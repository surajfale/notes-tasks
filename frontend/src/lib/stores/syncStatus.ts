/**
 * Sync Status Store
 * 
 * Tracks which items (notes, tasks, lists) have pending sync status.
 * Used to display pending badges on cards.
 * 
 * Requirements: 7.5
 */

import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { offlineStorage } from '$lib/storage/offline';

interface SyncStatusState {
  pendingNoteIds: Set<string>;
  pendingTaskIds: Set<string>;
  pendingListIds: Set<string>;
}

const initialState: SyncStatusState = {
  pendingNoteIds: new Set(),
  pendingTaskIds: new Set(),
  pendingListIds: new Set()
};

const syncStatusStore = writable<SyncStatusState>(initialState);

/**
 * Update pending items from IndexedDB
 */
async function updatePendingItems(): Promise<void> {
  if (!browser) return;

  try {
    const pending = await offlineStorage.getAllPending();
    
    syncStatusStore.set({
      pendingNoteIds: new Set(Array.isArray(pending.notes) ? pending.notes.map(item => item.data._id) : []),
      pendingTaskIds: new Set(Array.isArray(pending.tasks) ? pending.tasks.map(item => item.data._id) : []),
      pendingListIds: new Set(Array.isArray(pending.lists) ? pending.lists.map(item => item.data._id) : [])
    });
  } catch (error) {
    console.error('Failed to update pending items:', error);
  }
}

/**
 * Mark a note as pending
 */
function markNotePending(id: string): void {
  syncStatusStore.update(state => {
    const newPendingNoteIds = new Set(state.pendingNoteIds);
    newPendingNoteIds.add(id);
    return { ...state, pendingNoteIds: newPendingNoteIds };
  });
}

/**
 * Mark a task as pending
 */
function markTaskPending(id: string): void {
  syncStatusStore.update(state => {
    const newPendingTaskIds = new Set(state.pendingTaskIds);
    newPendingTaskIds.add(id);
    return { ...state, pendingTaskIds: newPendingTaskIds };
  });
}

/**
 * Mark a list as pending
 */
function markListPending(id: string): void {
  syncStatusStore.update(state => {
    const newPendingListIds = new Set(state.pendingListIds);
    newPendingListIds.add(id);
    return { ...state, pendingListIds: newPendingListIds };
  });
}

/**
 * Clear pending status for a note
 */
function clearNotePending(id: string): void {
  syncStatusStore.update(state => {
    const newPendingNoteIds = new Set(state.pendingNoteIds);
    newPendingNoteIds.delete(id);
    return { ...state, pendingNoteIds: newPendingNoteIds };
  });
}

/**
 * Clear pending status for a task
 */
function clearTaskPending(id: string): void {
  syncStatusStore.update(state => {
    const newPendingTaskIds = new Set(state.pendingTaskIds);
    newPendingTaskIds.delete(id);
    return { ...state, pendingTaskIds: newPendingTaskIds };
  });
}

/**
 * Clear pending status for a list
 */
function clearListPending(id: string): void {
  syncStatusStore.update(state => {
    const newPendingListIds = new Set(state.pendingListIds);
    newPendingListIds.delete(id);
    return { ...state, pendingListIds: newPendingListIds };
  });
}

/**
 * Sync status service
 */
export const syncStatusService = {
  subscribe: syncStatusStore.subscribe,
  updatePendingItems,
  markNotePending,
  markTaskPending,
  markListPending,
  clearNotePending,
  clearTaskPending,
  clearListPending
};

/**
 * Derived store to check if a note has pending changes
 */
export function isNotePending(noteId: string) {
  return derived(syncStatusStore, $state => $state.pendingNoteIds.has(noteId));
}

/**
 * Derived store to check if a task has pending changes
 */
export function isTaskPending(taskId: string) {
  return derived(syncStatusStore, $state => $state.pendingTaskIds.has(taskId));
}

/**
 * Derived store to check if a list has pending changes
 */
export function isListPending(listId: string) {
  return derived(syncStatusStore, $state => $state.pendingListIds.has(listId));
}
