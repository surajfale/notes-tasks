// Lists store for state management

import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { listsRepository } from '$lib/repositories/lists.repository';
import { offlineStorage } from '$lib/storage/offline';
import type { List, CreateListData, UpdateListData } from '$lib/types/list';

interface ListsState {
  items: List[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Create lists store with CRUD operations
 */
function createListsStore() {
  const { subscribe, set, update } = writable<ListsState>({
    items: [],
    isLoading: false,
    error: null
  });

  return {
    subscribe,

    /**
     * Load all lists
     */
    async loadAll(): Promise<void> {
      update((state) => ({ ...state, isLoading: true, error: null }));

      try {
        // Try to fetch from API
        const items = await listsRepository.getAll();
        
        // Cache in offline storage
        if (browser) {
          await offlineStorage.saveLists(items, 'synced');
        }
        
        set({ items, isLoading: false, error: null });
      } catch (error: any) {
        // If offline, try to load from offline storage
        if (browser && !navigator.onLine) {
          try {
            const items = await offlineStorage.getLists();
            set({ items, isLoading: false, error: null });
            return;
          } catch (offlineError) {
            // Fall through to error handling
          }
        }
        
        set({
          items: [],
          isLoading: false,
          error: error.message || 'Failed to load lists'
        });
      }
    },

    /**
     * Create a new list
     * @param data - List creation data
     * @returns Promise resolving to created list
     */
    async create(data: CreateListData): Promise<List> {
      try {
        const newList = await listsRepository.create(data);
        update((state) => ({
          ...state,
          items: [newList, ...(Array.isArray(state.items) ? state.items : [])],
          error: null
        }));
        return newList;
      } catch (error: any) {
        update((state) => ({
          ...state,
          error: error.message || 'Failed to create list'
        }));
        throw error;
      }
    },

    /**
     * Update an existing list
     * @param id - List ID
     * @param data - List update data
     * @returns Promise resolving to updated list
     */
    async update(id: string, data: UpdateListData): Promise<List> {
      try {
        const updatedList = await listsRepository.update(id, data);
        update((state) => ({
          ...state,
          items: (Array.isArray(state.items) ? state.items : []).map((list) => (list._id === id ? updatedList : list)),
          error: null
        }));
        return updatedList;
      } catch (error: any) {
        update((state) => ({
          ...state,
          error: error.message || 'Failed to update list'
        }));
        throw error;
      }
    },

    /**
     * Delete a list
     * @param id - List ID
     */
    async delete(id: string): Promise<void> {
      try {
        await listsRepository.delete(id);
        update((state) => ({
          ...state,
          items: (Array.isArray(state.items) ? state.items : []).filter((list) => list._id !== id),
          error: null
        }));
      } catch (error: any) {
        update((state) => ({
          ...state,
          error: error.message || 'Failed to delete list'
        }));
        throw error;
      }
    },

    /**
     * Clear error state
     */
    clearError(): void {
      update((state) => ({ ...state, error: null }));
    },

    /**
     * Reset store to initial state
     */
    reset(): void {
      set({ items: [], isLoading: false, error: null });
    }
  };
}

export const listsStore = createListsStore();
