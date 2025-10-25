/**
 * Offline Storage Utility
 * 
 * Manages offline data persistence using IndexedDB via the idb library.
 * Stores notes, tasks, and lists with sync status tracking for offline-first functionality.
 * 
 * Requirements: 7.1, 7.2
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Note } from '$lib/types/note';
import type { Task } from '$lib/types/task';
import type { List } from '$lib/types/list';

/**
 * Sync status for offline data
 * - 'synced': Data is synchronized with the backend
 * - 'pending': Data has local changes that need to be synced
 */
export type SyncStatus = 'synced' | 'pending';

/**
 * Wrapper interface for stored items with sync status
 */
export interface StoredItem<T> {
  data: T;
  syncStatus: SyncStatus;
  lastModified: number; // Timestamp for conflict resolution
}

/**
 * Database schema definition for IndexedDB
 */
interface NotesTasksDB extends DBSchema {
  notes: {
    key: string; // _id
    value: StoredItem<Note>;
    indexes: { 'by-sync-status': SyncStatus };
  };
  tasks: {
    key: string; // _id
    value: StoredItem<Task>;
    indexes: { 'by-sync-status': SyncStatus };
  };
  lists: {
    key: string; // _id
    value: StoredItem<List>;
    indexes: { 'by-sync-status': SyncStatus };
  };
}

const DB_NAME = 'notes-tasks-db';
const DB_VERSION = 1;

/**
 * Initialize and open the IndexedDB database
 */
async function getDB(): Promise<IDBPDatabase<NotesTasksDB>> {
  return openDB<NotesTasksDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create notes store
      if (!db.objectStoreNames.contains('notes')) {
        const notesStore = db.createObjectStore('notes', { keyPath: 'data._id' });
        notesStore.createIndex('by-sync-status', 'syncStatus');
      }

      // Create tasks store
      if (!db.objectStoreNames.contains('tasks')) {
        const tasksStore = db.createObjectStore('tasks', { keyPath: 'data._id' });
        tasksStore.createIndex('by-sync-status', 'syncStatus');
      }

      // Create lists store
      if (!db.objectStoreNames.contains('lists')) {
        const listsStore = db.createObjectStore('lists', { keyPath: 'data._id' });
        listsStore.createIndex('by-sync-status', 'syncStatus');
      }
    }
  });
}

/**
 * Offline storage interface for managing IndexedDB operations
 */
export const offlineStorage = {
  // ==================== NOTES ====================

  /**
   * Store a single note in IndexedDB
   */
  async saveNote(note: Note, syncStatus: SyncStatus = 'synced'): Promise<void> {
    if (!note || !note._id) {
      console.error('Cannot save note without _id:', note);
      return;
    }

    const db = await getDB();
    await db.put('notes', {
      data: note,
      syncStatus,
      lastModified: Date.now()
    });
  },

  /**
   * Store multiple notes in IndexedDB
   */
  async saveNotes(notes: Note[], syncStatus: SyncStatus = 'synced'): Promise<void> {
    if (!Array.isArray(notes)) {
      console.error('saveNotes called with non-array:', notes);
      return;
    }

    // Filter out notes without _id
    const validNotes = notes.filter(note => {
      if (!note || !note._id) {
        console.error('Note missing _id, skipping:', note);
        return false;
      }
      return true;
    });

    if (validNotes.length === 0) {
      return;
    }

    const db = await getDB();
    const tx = db.transaction('notes', 'readwrite');
    const timestamp = Date.now();

    await Promise.all([
      ...validNotes.map(note =>
        tx.store.put({
          data: note,
          syncStatus,
          lastModified: timestamp
        })
      ),
      tx.done
    ]);
  },

  /**
   * Retrieve all notes from IndexedDB
   */
  async getNotes(): Promise<Note[]> {
    const db = await getDB();
    const storedItems = await db.getAll('notes');
    return storedItems.map(item => item.data);
  },

  /**
   * Retrieve a single note by ID
   */
  async getNote(id: string): Promise<Note | undefined> {
    const db = await getDB();
    const storedItem = await db.get('notes', id);
    return storedItem?.data;
  },

  /**
   * Delete a note from IndexedDB
   */
  async deleteNote(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('notes', id);
  },

  /**
   * Get all notes with pending sync status
   */
  async getPendingNotes(): Promise<StoredItem<Note>[]> {
    const db = await getDB();
    return db.getAllFromIndex('notes', 'by-sync-status', 'pending');
  },

  /**
   * Update sync status for a note
   */
  async updateNoteSync(id: string, syncStatus: SyncStatus): Promise<void> {
    const db = await getDB();
    const storedItem = await db.get('notes', id);
    if (storedItem) {
      storedItem.syncStatus = syncStatus;
      storedItem.lastModified = Date.now();
      await db.put('notes', storedItem);
    }
  },

  // ==================== TASKS ====================

  /**
   * Store a single task in IndexedDB
   */
  async saveTask(task: Task, syncStatus: SyncStatus = 'synced'): Promise<void> {
    if (!task || !task._id) {
      console.error('Cannot save task without _id:', task);
      return;
    }

    const db = await getDB();
    await db.put('tasks', {
      data: task,
      syncStatus,
      lastModified: Date.now()
    });
  },

  /**
   * Store multiple tasks in IndexedDB
   */
  async saveTasks(tasks: Task[], syncStatus: SyncStatus = 'synced'): Promise<void> {
    if (!Array.isArray(tasks)) {
      console.error('saveTasks called with non-array:', tasks);
      return;
    }

    // Filter out tasks without _id
    const validTasks = tasks.filter(task => {
      if (!task || !task._id) {
        console.error('Task missing _id, skipping:', task);
        return false;
      }
      return true;
    });

    if (validTasks.length === 0) {
      return;
    }

    const db = await getDB();
    const tx = db.transaction('tasks', 'readwrite');
    const timestamp = Date.now();

    await Promise.all([
      ...validTasks.map(task =>
        tx.store.put({
          data: task,
          syncStatus,
          lastModified: timestamp
        })
      ),
      tx.done
    ]);
  },

  /**
   * Retrieve all tasks from IndexedDB
   */
  async getTasks(): Promise<Task[]> {
    const db = await getDB();
    const storedItems = await db.getAll('tasks');
    return storedItems.map(item => item.data);
  },

  /**
   * Retrieve a single task by ID
   */
  async getTask(id: string): Promise<Task | undefined> {
    const db = await getDB();
    const storedItem = await db.get('tasks', id);
    return storedItem?.data;
  },

  /**
   * Delete a task from IndexedDB
   */
  async deleteTask(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('tasks', id);
  },

  /**
   * Get all tasks with pending sync status
   */
  async getPendingTasks(): Promise<StoredItem<Task>[]> {
    const db = await getDB();
    return db.getAllFromIndex('tasks', 'by-sync-status', 'pending');
  },

  /**
   * Update sync status for a task
   */
  async updateTaskSync(id: string, syncStatus: SyncStatus): Promise<void> {
    const db = await getDB();
    const storedItem = await db.get('tasks', id);
    if (storedItem) {
      storedItem.syncStatus = syncStatus;
      storedItem.lastModified = Date.now();
      await db.put('tasks', storedItem);
    }
  },

  // ==================== LISTS ====================

  /**
   * Store a single list in IndexedDB
   */
  async saveList(list: List, syncStatus: SyncStatus = 'synced'): Promise<void> {
    if (!list || !list._id) {
      console.error('Cannot save list without _id:', list);
      return;
    }

    const db = await getDB();
    await db.put('lists', {
      data: list,
      syncStatus,
      lastModified: Date.now()
    });
  },

  /**
   * Store multiple lists in IndexedDB
   */
  async saveLists(lists: List[], syncStatus: SyncStatus = 'synced'): Promise<void> {
    if (!Array.isArray(lists)) {
      console.error('saveLists called with non-array:', lists);
      return;
    }

    // Filter out lists without _id
    const validLists = lists.filter(list => {
      if (!list || !list._id) {
        console.error('List missing _id, skipping:', list);
        return false;
      }
      return true;
    });

    if (validLists.length === 0) {
      return;
    }

    const db = await getDB();
    const tx = db.transaction('lists', 'readwrite');
    const timestamp = Date.now();

    await Promise.all([
      ...validLists.map(list =>
        tx.store.put({
          data: list,
          syncStatus,
          lastModified: timestamp
        })
      ),
      tx.done
    ]);
  },

  /**
   * Retrieve all lists from IndexedDB
   */
  async getLists(): Promise<List[]> {
    const db = await getDB();
    const storedItems = await db.getAll('lists');
    return storedItems.map(item => item.data);
  },

  /**
   * Retrieve a single list by ID
   */
  async getList(id: string): Promise<List | undefined> {
    const db = await getDB();
    const storedItem = await db.get('lists', id);
    return storedItem?.data;
  },

  /**
   * Delete a list from IndexedDB
   */
  async deleteList(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('lists', id);
  },

  /**
   * Get all lists with pending sync status
   */
  async getPendingLists(): Promise<StoredItem<List>[]> {
    const db = await getDB();
    return db.getAllFromIndex('lists', 'by-sync-status', 'pending');
  },

  /**
   * Update sync status for a list
   */
  async updateListSync(id: string, syncStatus: SyncStatus): Promise<void> {
    const db = await getDB();
    const storedItem = await db.get('lists', id);
    if (storedItem) {
      storedItem.syncStatus = syncStatus;
      storedItem.lastModified = Date.now();
      await db.put('lists', storedItem);
    }
  },

  // ==================== UTILITY ====================

  /**
   * Get all pending items across all stores
   */
  async getAllPending(): Promise<{
    notes: StoredItem<Note>[];
    tasks: StoredItem<Task>[];
    lists: StoredItem<List>[];
  }> {
    const [notes, tasks, lists] = await Promise.all([
      this.getPendingNotes(),
      this.getPendingTasks(),
      this.getPendingLists()
    ]);

    return { notes, tasks, lists };
  },

  /**
   * Clear all data from IndexedDB (useful for logout)
   */
  async clearAll(): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(['notes', 'tasks', 'lists'], 'readwrite');

    await Promise.all([
      tx.objectStore('notes').clear(),
      tx.objectStore('tasks').clear(),
      tx.objectStore('lists').clear(),
      tx.done
    ]);
  },

  /**
   * Get count of pending items
   */
  async getPendingCount(): Promise<number> {
    const pending = await this.getAllPending();
    return pending.notes.length + pending.tasks.length + pending.lists.length;
  }
};
