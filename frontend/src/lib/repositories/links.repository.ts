// Links repository

import { browser } from '$app/environment';
import { apiClient } from '$lib/api/client';
import { API_ENDPOINTS } from '$lib/api/endpoints';
import { offlineStorage } from '$lib/storage/offline';
import { syncService } from '$lib/storage/sync';
import type {
  Link,
  CreateLinkData,
  UpdateLinkData,
  LinkFilters
} from '$lib/types/link';

/**
 * Build query string from link filters
 * @param filters - Link filter parameters
 * @returns Query string for URL
 */
function buildQueryString(filters?: LinkFilters): string {
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
 * Links repository for handling link-related API calls
 */
export const linksRepository = {
  /**
   * Get all links with optional filtering
   * @param filters - Optional filters (listId, isArchived, tags, search)
   * @returns Promise resolving to array of links
   */
  async getAll(filters?: LinkFilters): Promise<Link[]> {
    const query = buildQueryString(filters);
    return apiClient.get<Link[]>(`${API_ENDPOINTS.LINKS.BASE}${query}`);
  },

  /**
   * Get a specific link by ID
   * @param id - Link ID
   * @returns Promise resolving to link data
   */
  async getById(id: string): Promise<Link> {
    return apiClient.get<Link>(API_ENDPOINTS.LINKS.BY_ID(id));
  },

  /**
   * Create a new link
   * @param data - Link creation data (title, url, tags, listId)
   * @returns Promise resolving to created link
   */
  async create(data: CreateLinkData): Promise<Link> {
    // Check if online
    if (browser && !navigator.onLine) {
      // Create temporary link with pending status. Note: offline creation
      // can't run the backend's og:* metadata scrape, so description/image
      // stay empty until this syncs.
      const tempLink: Link = {
        _id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: 'temp',
        title: data.title,
        url: data.url,
        tags: data.tags || [],
        listId: data.listId,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await offlineStorage.saveLink(tempLink, 'pending');
      await syncService.updatePendingCount();
      return tempLink;
    }

    const link = await apiClient.post<Link>(API_ENDPOINTS.LINKS.BASE, data);

    // Save to offline storage as synced
    if (browser) {
      await offlineStorage.saveLink(link, 'synced');
    }

    return link;
  },

  /**
   * Update an existing link
   * @param id - Link ID
   * @param data - Link update data (partial)
   * @returns Promise resolving to updated link
   */
  async update(id: string, data: UpdateLinkData): Promise<Link> {
    // Check if online
    if (browser && !navigator.onLine) {
      // Get existing link from offline storage
      const existingLink = await offlineStorage.getLink(id);
      if (!existingLink) {
        throw new Error('Link not found in offline storage');
      }

      // Update link locally
      const updatedLink: Link = {
        ...existingLink,
        ...data,
        updatedAt: new Date().toISOString()
      };

      await offlineStorage.saveLink(updatedLink, 'pending');
      await syncService.updatePendingCount();
      return updatedLink;
    }

    const link = await apiClient.put<Link>(API_ENDPOINTS.LINKS.BY_ID(id), data);

    // Update offline storage as synced
    if (browser) {
      await offlineStorage.saveLink(link, 'synced');
    }

    return link;
  },

  /**
   * Delete a link
   * @param id - Link ID
   * @returns Promise resolving when link is deleted
   */
  async delete(id: string): Promise<void> {
    // Check if online
    if (browser && !navigator.onLine) {
      // Delete from offline storage immediately
      await offlineStorage.deleteLink(id);
      await syncService.updatePendingCount();
      return;
    }

    await apiClient.delete<void>(API_ENDPOINTS.LINKS.BY_ID(id));

    // Delete from offline storage
    if (browser) {
      await offlineStorage.deleteLink(id);
    }
  }
};
