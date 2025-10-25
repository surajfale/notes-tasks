// Notes repository

import { browser } from '$app/environment';
import { apiClient } from '$lib/api/client';
import { API_ENDPOINTS } from '$lib/api/endpoints';
import { offlineStorage } from '$lib/storage/offline';
import { syncService } from '$lib/storage/sync';
import type {
  Note,
  CreateNoteData,
  UpdateNoteData,
  NoteFilters
} from '$lib/types/note';

/**
 * Build query string from note filters
 * @param filters - Note filter parameters
 * @returns Query string for URL
 */
function buildQueryString(filters?: NoteFilters): string {
  if (!filters) return '';

  const params = new URLSearchParams();

  if (filters.listId) {
    params.set('listId', filters.listId);
  }

  if (filters.isArchived !== undefined) {
    params.set('isArchived', String(filters.isArchived));
  }

  if (filters.tags && filters.tags.length > 0) {
    params.set('tags', filters.tags.join(','));
  }

  if (filters.search) {
    params.set('search', filters.search);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

/**
 * Notes repository for handling note-related API calls
 */
export const notesRepository = {
  /**
   * Get all notes with optional filtering
   * @param filters - Optional filters (listId, isArchived, tags, search)
   * @returns Promise resolving to array of notes
   */
  async getAll(filters?: NoteFilters): Promise<Note[]> {
    const query = buildQueryString(filters);
    return apiClient.get<Note[]>(`${API_ENDPOINTS.NOTES.BASE}${query}`);
  },

  /**
   * Get a specific note by ID
   * @param id - Note ID
   * @returns Promise resolving to note data
   */
  async getById(id: string): Promise<Note> {
    return apiClient.get<Note>(API_ENDPOINTS.NOTES.BY_ID(id));
  },

  /**
   * Create a new note
   * @param data - Note creation data (title, body, tags, listId)
   * @returns Promise resolving to created note
   */
  async create(data: CreateNoteData): Promise<Note> {
    // Check if online
    if (browser && !navigator.onLine) {
      // Create temporary note with pending status
      const tempNote: Note = {
        _id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: 'temp',
        title: data.title,
        body: data.body,
        tags: data.tags || [],
        listId: data.listId,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await offlineStorage.saveNote(tempNote, 'pending');
      await syncService.updatePendingCount();
      return tempNote;
    }

    const note = await apiClient.post<Note>(API_ENDPOINTS.NOTES.BASE, data);
    
    // Save to offline storage as synced
    if (browser) {
      await offlineStorage.saveNote(note, 'synced');
    }
    
    return note;
  },

  /**
   * Update an existing note
   * @param id - Note ID
   * @param data - Note update data (partial)
   * @returns Promise resolving to updated note
   */
  async update(id: string, data: UpdateNoteData): Promise<Note> {
    // Check if online
    if (browser && !navigator.onLine) {
      // Get existing note from offline storage
      const existingNote = await offlineStorage.getNote(id);
      if (!existingNote) {
        throw new Error('Note not found in offline storage');
      }
      
      // Update note locally
      const updatedNote: Note = {
        ...existingNote,
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      await offlineStorage.saveNote(updatedNote, 'pending');
      await syncService.updatePendingCount();
      return updatedNote;
    }

    const note = await apiClient.put<Note>(API_ENDPOINTS.NOTES.BY_ID(id), data);
    
    // Update offline storage as synced
    if (browser) {
      await offlineStorage.saveNote(note, 'synced');
    }
    
    return note;
  },

  /**
   * Delete a note
   * @param id - Note ID
   * @returns Promise resolving when note is deleted
   */
  async delete(id: string): Promise<void> {
    // Check if online
    if (browser && !navigator.onLine) {
      // Delete from offline storage immediately
      await offlineStorage.deleteNote(id);
      await syncService.updatePendingCount();
      return;
    }

    await apiClient.delete<void>(API_ENDPOINTS.NOTES.BY_ID(id));
    
    // Delete from offline storage
    if (browser) {
      await offlineStorage.deleteNote(id);
    }
  },

  /**
   * Toggle archive status of a note
   * @param id - Note ID
   * @param isArchived - New archive status
   * @returns Promise resolving to updated note
   */
  async toggleArchive(id: string, isArchived: boolean): Promise<Note> {
    // Check if online
    if (browser && !navigator.onLine) {
      // Get existing note from offline storage
      const existingNote = await offlineStorage.getNote(id);
      if (!existingNote) {
        throw new Error('Note not found in offline storage');
      }
      
      // Update note locally
      const updatedNote: Note = {
        ...existingNote,
        isArchived,
        updatedAt: new Date().toISOString()
      };
      
      await offlineStorage.saveNote(updatedNote, 'pending');
      await syncService.updatePendingCount();
      return updatedNote;
    }

    const note = await apiClient.put<Note>(API_ENDPOINTS.NOTES.ARCHIVE(id), { isArchived });
    
    // Update offline storage as synced
    if (browser) {
      await offlineStorage.saveNote(note, 'synced');
    }
    
    return note;
  }
};
