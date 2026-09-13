// Links store for state management

import { browser } from '$app/environment';
import { writable, get } from 'svelte/store';
import { linksRepository } from '$lib/repositories/links.repository';
import { offlineStorage } from '$lib/storage/offline';
import type { Link, CreateLinkData, UpdateLinkData, LinkFilters } from '$lib/types/link';

interface LinksState {
  items: Link[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Create links store with CRUD operations
 */
function createLinksStore() {
  const { subscribe, set, update } = writable<LinksState>({
    items: [],
    isLoading: false,
    error: null
  });

  return {
    subscribe,

    /**
     * Load all links with optional filters
     * @param filters - Optional filters (listId, isArchived, tags, search)
     */
    async loadAll(filters?: LinkFilters): Promise<void> {
      update((state) => ({ ...state, isLoading: true, error: null }));

      try {
        // Try to fetch from API
        const items = await linksRepository.getAll(filters);

        // Cache in offline storage
        if (browser) {
          await offlineStorage.saveLinks(items, 'synced');
        }

        set({ items, isLoading: false, error: null });
      } catch (error: any) {
        // If offline, try to load from offline storage
        if (browser && !navigator.onLine) {
          try {
            const items = await offlineStorage.getLinks();
            set({ items, isLoading: false, error: null });
            return;
          } catch (offlineError) {
            // Fall through to error handling
          }
        }

        set({
          items: [],
          isLoading: false,
          error: error.message || 'Failed to load links'
        });
      }
    },

    /**
     * Create a new link
     * @param data - Link creation data
     * @returns Promise resolving to created link
     */
    async create(data: CreateLinkData): Promise<Link> {
      try {
        const newLink = await linksRepository.create(data);
        update((state) => ({
          ...state,
          items: [newLink, ...(Array.isArray(state.items) ? state.items : [])],
          error: null
        }));
        return newLink;
      } catch (error: any) {
        update((state) => ({
          ...state,
          error: error.message || 'Failed to create link'
        }));
        throw error;
      }
    },

    /**
     * Update an existing link
     * @param id - Link ID
     * @param data - Link update data
     * @returns Promise resolving to updated link
     */
    async update(id: string, data: UpdateLinkData): Promise<Link> {
      // Optimistic update so the card reflects the change immediately
      const previousState = get({ subscribe });
      update((state) => ({
        ...state,
        items: (Array.isArray(state.items) ? state.items : []).map((link) =>
          link._id === id ? { ...link, ...data } : link
        )
      }));

      try {
        const updatedLink = await linksRepository.update(id, data);
        update((state) => ({
          ...state,
          items: (Array.isArray(state.items) ? state.items : []).map((link) => (link._id === id ? updatedLink : link)),
          error: null
        }));
        return updatedLink;
      } catch (error: any) {
        // Revert on error
        set(previousState);
        update((state) => ({
          ...state,
          error: error.message || 'Failed to update link'
        }));
        throw error;
      }
    },

    /**
     * Delete a link
     * @param id - Link ID
     */
    async delete(id: string): Promise<void> {
      // Optimistic update
      const previousState = get({ subscribe });
      update((state) => ({
        ...state,
        items: (Array.isArray(state.items) ? state.items : []).filter((link) => link._id !== id)
      }));

      try {
        await linksRepository.delete(id);
        update((state) => ({ ...state, error: null }));
      } catch (error: any) {
        // Revert on error
        set(previousState);
        update((state) => ({
          ...state,
          error: error.message || 'Failed to delete link'
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

export const linksStore = createLinksStore();
