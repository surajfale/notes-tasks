// Notes store for state management

import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { notesRepository } from '$lib/repositories/notes.repository';
import { offlineStorage } from '$lib/storage/offline';
import type { Note, CreateNoteData, UpdateNoteData, NoteFilters } from '$lib/types/note';

interface NotesState {
  items: Note[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Create notes store with CRUD operations
 */
function createNotesStore() {
  const { subscribe, set, update } = writable<NotesState>({
    items: [],
    isLoading: false,
    error: null
  });

  return {
    subscribe,

    /**
     * Load all notes with optional filters
     * @param filters - Optional filters (listId, isArchived, tags, search)
     */
    async loadAll(filters?: NoteFilters): Promise<void> {
      update((state) => ({ ...state, isLoading: true, error: null }));

      try {
        // Try to fetch from API
        const items = await notesRepository.getAll(filters);
        
        // Cache in offline storage
        if (browser) {
          await offlineStorage.saveNotes(items, 'synced');
        }
        
        set({ items, isLoading: false, error: null });
      } catch (error: any) {
        // If offline, try to load from offline storage
        if (browser && !navigator.onLine) {
          try {
            const items = await offlineStorage.getNotes();
            set({ items, isLoading: false, error: null });
            return;
          } catch (offlineError) {
            // Fall through to error handling
          }
        }
        
        set({
          items: [],
          isLoading: false,
          error: error.message || 'Failed to load notes'
        });
      }
    },

    /**
     * Create a new note
     * @param data - Note creation data
     * @returns Promise resolving to created note
     */
    async create(data: CreateNoteData): Promise<Note> {
      try {
        const newNote = await notesRepository.create(data);
        update((state) => ({
          ...state,
          items: [newNote, ...(Array.isArray(state.items) ? state.items : [])],
          error: null
        }));
        return newNote;
      } catch (error: any) {
        update((state) => ({
          ...state,
          error: error.message || 'Failed to create note'
        }));
        throw error;
      }
    },

    /**
     * Update an existing note
     * @param id - Note ID
     * @param data - Note update data
     * @returns Promise resolving to updated note
     */
    async update(id: string, data: UpdateNoteData): Promise<Note> {
      try {
        const updatedNote = await notesRepository.update(id, data);
        update((state) => ({
          ...state,
          items: (Array.isArray(state.items) ? state.items : []).map((note) => (note._id === id ? updatedNote : note)),
          error: null
        }));
        return updatedNote;
      } catch (error: any) {
        update((state) => ({
          ...state,
          error: error.message || 'Failed to update note'
        }));
        throw error;
      }
    },

    /**
     * Delete a note
     * @param id - Note ID
     */
    async delete(id: string): Promise<void> {
      try {
        await notesRepository.delete(id);
        update((state) => ({
          ...state,
          items: (Array.isArray(state.items) ? state.items : []).filter((note) => note._id !== id),
          error: null
        }));
      } catch (error: any) {
        update((state) => ({
          ...state,
          error: error.message || 'Failed to delete note'
        }));
        throw error;
      }
    },

    /**
     * Toggle archive status of a note
     * @param id - Note ID
     * @param isArchived - New archive status
     */
    async toggleArchive(id: string, isArchived: boolean): Promise<Note> {
      try {
        const updatedNote = await notesRepository.toggleArchive(id, isArchived);
        update((state) => ({
          ...state,
          items: (Array.isArray(state.items) ? state.items : []).map((note) => (note._id === id ? updatedNote : note)),
          error: null
        }));
        return updatedNote;
      } catch (error: any) {
        update((state) => ({
          ...state,
          error: error.message || 'Failed to toggle archive status'
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

export const notesStore = createNotesStore();
