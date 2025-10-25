/**
 * Offline Sync Service
 * 
 * Manages synchronization of offline changes with the backend.
 * Implements network status detection, sync queue processing, and exponential backoff retry logic.
 */

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { offlineStorage, type StoredItem } from './offline';
import { notesRepository } from '$lib/repositories/notes.repository';
import { tasksRepository } from '$lib/repositories/tasks.repository';
import { listsRepository } from '$lib/repositories/lists.repository';
import { syncStatusService } from '$lib/stores/syncStatus';
import type { Note } from '$lib/types/note';
import type { Task } from '$lib/types/task';
import type { List } from '$lib/types/list';

/**
 * Sync operation types
 */
type SyncOperation = 'create' | 'update' | 'delete';

/**
 * Sync queue item
 */
interface SyncQueueItem {
  id: string;
  type: 'note' | 'task' | 'list';
  operation: SyncOperation;
  data: any;
  retryCount: number;
  lastAttempt?: number;
}

/**
 * Sync state
 */
interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: number | null;
  errors: string[];
}

/**
 * Initial sync state
 */
const initialState: SyncState = {
  isOnline: browser ? navigator.onLine : true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncTime: null,
  errors: []
};

/**
 * Sync state store
 */
const syncStateStore = writable<SyncState>(initialState);

/**
 * Exponential backoff configuration
 */
const RETRY_CONFIG = {
  maxRetries: 5,
  baseDelay: 1000, // 1 second
  maxDelay: 60000, // 1 minute
  backoffMultiplier: 2
};

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(retryCount: number): number {
  const delay = Math.min(
    RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount),
    RETRY_CONFIG.maxDelay
  );
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
}

/**
 * Check if enough time has passed since last retry attempt
 */
function canRetry(item: SyncQueueItem): boolean {
  if (!item.lastAttempt) return true;
  
  const backoffDelay = calculateBackoffDelay(item.retryCount);
  const timeSinceLastAttempt = Date.now() - item.lastAttempt;
  
  return timeSinceLastAttempt >= backoffDelay;
}

/**
 * Sync a single note
 */
async function syncNote(item: StoredItem<Note>, operation: SyncOperation): Promise<void> {
  const note = item.data;
  
  switch (operation) {
    case 'create':
      await notesRepository.create({
        title: note.title,
        body: note.body,
        tags: note.tags,
        listId: note.listId
      });
      break;
    case 'update':
      await notesRepository.update(note._id, {
        title: note.title,
        body: note.body,
        tags: note.tags,
        listId: note.listId,
        isArchived: note.isArchived
      });
      break;
    case 'delete':
      await notesRepository.delete(note._id);
      break;
  }
}

/**
 * Sync a single task
 */
async function syncTask(item: StoredItem<Task>, operation: SyncOperation): Promise<void> {
  const task = item.data;
  
  switch (operation) {
    case 'create':
      await tasksRepository.create({
        title: task.title,
        description: task.description,
        dueAt: task.dueAt,
        priority: task.priority,
        listId: task.listId
      });
      break;
    case 'update':
      await tasksRepository.update(task._id, {
        title: task.title,
        description: task.description,
        dueAt: task.dueAt,
        priority: task.priority,
        listId: task.listId,
        isCompleted: task.isCompleted
      });
      break;
    case 'delete':
      await tasksRepository.delete(task._id);
      break;
  }
}

/**
 * Sync a single list
 */
async function syncList(item: StoredItem<List>, operation: SyncOperation): Promise<void> {
  const list = item.data;
  
  switch (operation) {
    case 'create':
      await listsRepository.create({
        title: list.title,
        color: list.color,
        emoji: list.emoji
      });
      break;
    case 'update':
      await listsRepository.update(list._id, {
        title: list.title,
        color: list.color,
        emoji: list.emoji
      });
      break;
    case 'delete':
      await listsRepository.delete(list._id);
      break;
  }
}

/**
 * Process sync queue and synchronize pending items
 */
async function processSyncQueue(): Promise<void> {
  const state = get(syncStateStore);
  
  // Don't sync if already syncing or offline
  if (state.isSyncing || !state.isOnline) {
    return;
  }

  // Update state to syncing
  syncStateStore.update(s => ({ ...s, isSyncing: true, errors: [] }));

  try {
    // Get all pending items
    const pending = await offlineStorage.getAllPending();
    const totalPending = pending.notes.length + pending.tasks.length + pending.lists.length;

    if (totalPending === 0) {
      syncStateStore.update(s => ({
        ...s,
        isSyncing: false,
        pendingCount: 0,
        lastSyncTime: Date.now()
      }));
      return;
    }

    const errors: string[] = [];
    let successCount = 0;

    // Sync lists first (they may be referenced by notes/tasks)
    for (const item of pending.lists) {
      try {
        await syncList(item, 'update');
        await offlineStorage.updateListSync(item.data._id, 'synced');
        syncStatusService.clearListPending(item.data._id);
        successCount++;
      } catch (error: any) {
        console.error('Failed to sync list:', error);
        errors.push(`List "${item.data.title}": ${error.message}`);
      }
    }

    // Sync notes
    for (const item of pending.notes) {
      try {
        await syncNote(item, 'update');
        await offlineStorage.updateNoteSync(item.data._id, 'synced');
        syncStatusService.clearNotePending(item.data._id);
        successCount++;
      } catch (error: any) {
        console.error('Failed to sync note:', error);
        errors.push(`Note "${item.data.title}": ${error.message}`);
      }
    }

    // Sync tasks
    for (const item of pending.tasks) {
      try {
        await syncTask(item, 'update');
        await offlineStorage.updateTaskSync(item.data._id, 'synced');
        syncStatusService.clearTaskPending(item.data._id);
        successCount++;
      } catch (error: any) {
        console.error('Failed to sync task:', error);
        errors.push(`Task "${item.data.title}": ${error.message}`);
      }
    }

    // Update pending count
    const remainingPending = await offlineStorage.getPendingCount();

    syncStateStore.update(s => ({
      ...s,
      isSyncing: false,
      pendingCount: remainingPending,
      lastSyncTime: Date.now(),
      errors
    }));

  } catch (error: any) {
    console.error('Sync queue processing failed:', error);
    syncStateStore.update(s => ({
      ...s,
      isSyncing: false,
      errors: [...s.errors, `Sync failed: ${error.message}`]
    }));
  }
}

/**
 * Update pending count
 */
async function updatePendingCount(): Promise<void> {
  try {
    const count = await offlineStorage.getPendingCount();
    syncStateStore.update(s => ({ ...s, pendingCount: count }));
  } catch (error) {
    console.error('Failed to update pending count:', error);
  }
}

/**
 * Initialize sync service
 */
function initializeSyncService(): void {
  if (!browser) return;

  // Set up online/offline event listeners
  window.addEventListener('online', () => {
    console.log('Network connection restored');
    syncStateStore.update(s => ({ ...s, isOnline: true }));
    // Trigger sync when coming back online
    processSyncQueue();
  });

  window.addEventListener('offline', () => {
    console.log('Network connection lost');
    syncStateStore.update(s => ({ ...s, isOnline: false }));
  });

  // Initialize online status
  syncStateStore.update(s => ({ ...s, isOnline: navigator.onLine }));

  // Update pending count and sync status on initialization
  updatePendingCount();
  syncStatusService.updatePendingItems();

  // Set up periodic sync check (every 30 seconds when online)
  setInterval(() => {
    const state = get(syncStateStore);
    if (state.isOnline && !state.isSyncing && state.pendingCount > 0) {
      processSyncQueue();
    }
  }, 30000);
}

/**
 * Sync service interface
 */
export const syncService = {
  /**
   * Subscribe to sync state
   */
  subscribe: syncStateStore.subscribe,

  /**
   * Initialize the sync service
   */
  initialize: initializeSyncService,

  /**
   * Manually trigger sync
   */
  sync: processSyncQueue,

  /**
   * Update pending count
   */
  updatePendingCount,

  /**
   * Get current sync state
   */
  getState: () => get(syncStateStore),

  /**
   * Clear sync errors
   */
  clearErrors: () => {
    syncStateStore.update(s => ({ ...s, errors: [] }));
  }
};

/**
 * Derived store for online status
 */
export const isOnline = derived(syncStateStore, $state => $state.isOnline);

/**
 * Derived store for syncing status
 */
export const isSyncing = derived(syncStateStore, $state => $state.isSyncing);

/**
 * Derived store for pending count
 */
export const pendingCount = derived(syncStateStore, $state => $state.pendingCount);

/**
 * Derived store for sync errors
 */
export const syncErrors = derived(syncStateStore, $state => $state.errors);
