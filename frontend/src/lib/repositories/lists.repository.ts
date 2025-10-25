// Lists repository

import { browser } from '$app/environment';
import { apiClient } from '$lib/api/client';
import { API_ENDPOINTS } from '$lib/api/endpoints';
import { offlineStorage } from '$lib/storage/offline';
import { syncService } from '$lib/storage/sync';
import type {
  List,
  CreateListData,
  UpdateListData
} from '$lib/types/list';

/**
 * Lists repository for handling list-related API calls
 */
export const listsRepository = {
  /**
   * Get all lists
   * @returns Promise resolving to array of lists
   */
  async getAll(): Promise<List[]> {
    return apiClient.get<List[]>(API_ENDPOINTS.LISTS.BASE);
  },

  /**
   * Get a specific list by ID
   * @param id - List ID
   * @returns Promise resolving to list data
   */
  async getById(id: string): Promise<List> {
    return apiClient.get<List>(API_ENDPOINTS.LISTS.BY_ID(id));
  },

  /**
   * Create a new list
   * @param data - List creation data (title, color, emoji)
   * @returns Promise resolving to created list
   */
  async create(data: CreateListData): Promise<List> {
    // Check if online
    if (browser && !navigator.onLine) {
      // Create temporary list with pending status
      const tempList: List = {
        _id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: 'temp',
        title: data.title,
        color: data.color,
        emoji: data.emoji,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await offlineStorage.saveList(tempList, 'pending');
      await syncService.updatePendingCount();
      return tempList;
    }

    const list = await apiClient.post<List>(API_ENDPOINTS.LISTS.BASE, data);
    
    // Save to offline storage as synced
    if (browser) {
      await offlineStorage.saveList(list, 'synced');
    }
    
    return list;
  },

  /**
   * Update an existing list
   * @param id - List ID
   * @param data - List update data (partial)
   * @returns Promise resolving to updated list
   */
  async update(id: string, data: UpdateListData): Promise<List> {
    // Check if online
    if (browser && !navigator.onLine) {
      // Get existing list from offline storage
      const existingList = await offlineStorage.getList(id);
      if (!existingList) {
        throw new Error('List not found in offline storage');
      }
      
      // Update list locally
      const updatedList: List = {
        ...existingList,
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      await offlineStorage.saveList(updatedList, 'pending');
      await syncService.updatePendingCount();
      return updatedList;
    }

    const list = await apiClient.put<List>(API_ENDPOINTS.LISTS.BY_ID(id), data);
    
    // Update offline storage as synced
    if (browser) {
      await offlineStorage.saveList(list, 'synced');
    }
    
    return list;
  },

  /**
   * Delete a list
   * @param id - List ID
   * @returns Promise resolving when list is deleted
   */
  async delete(id: string): Promise<void> {
    // Check if online
    if (browser && !navigator.onLine) {
      // Delete from offline storage immediately
      await offlineStorage.deleteList(id);
      await syncService.updatePendingCount();
      return;
    }

    await apiClient.delete<void>(API_ENDPOINTS.LISTS.BY_ID(id));
    
    // Delete from offline storage
    if (browser) {
      await offlineStorage.deleteList(id);
    }
  }
};
