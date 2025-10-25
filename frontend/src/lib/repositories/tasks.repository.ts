// Tasks repository

import { browser } from '$app/environment';
import { apiClient } from '$lib/api/client';
import { API_ENDPOINTS } from '$lib/api/endpoints';
import { offlineStorage } from '$lib/storage/offline';
import { syncService } from '$lib/storage/sync';
import type {
  Task,
  CreateTaskData,
  UpdateTaskData,
  TaskFilters
} from '$lib/types/task';

/**
 * Build query string from task filters
 * @param filters - Task filter parameters
 * @returns Query string for URL
 */
function buildQueryString(filters?: TaskFilters): string {
  if (!filters) return '';

  const params = new URLSearchParams();

  if (filters.listId) {
    params.set('listId', filters.listId);
  }

  if (filters.isCompleted !== undefined) {
    params.set('isCompleted', String(filters.isCompleted));
  }

  if (filters.priority !== undefined) {
    params.set('priority', String(filters.priority));
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

/**
 * Tasks repository for handling task-related API calls
 */
export const tasksRepository = {
  /**
   * Get all tasks with optional filtering
   * @param filters - Optional filters (listId, isCompleted, priority)
   * @returns Promise resolving to array of tasks
   */
  async getAll(filters?: TaskFilters): Promise<Task[]> {
    const query = buildQueryString(filters);
    return apiClient.get<Task[]>(`${API_ENDPOINTS.TASKS.BASE}${query}`);
  },

  /**
   * Get a specific task by ID
   * @param id - Task ID
   * @returns Promise resolving to task data
   */
  async getById(id: string): Promise<Task> {
    return apiClient.get<Task>(API_ENDPOINTS.TASKS.BY_ID(id));
  },

  /**
   * Create a new task
   * @param data - Task creation data (title, description, dueAt, priority, listId)
   * @returns Promise resolving to created task
   */
  async create(data: CreateTaskData): Promise<Task> {
    // Check if online
    if (browser && !navigator.onLine) {
      // Create temporary task with pending status
      const tempTask: Task = {
        _id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: 'temp',
        title: data.title,
        description: data.description,
        dueAt: data.dueAt,
        priority: data.priority || 2,
        listId: data.listId,
        isCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await offlineStorage.saveTask(tempTask, 'pending');
      await syncService.updatePendingCount();
      return tempTask;
    }

    const task = await apiClient.post<Task>(API_ENDPOINTS.TASKS.BASE, data);
    
    // Save to offline storage as synced
    if (browser) {
      await offlineStorage.saveTask(task, 'synced');
    }
    
    return task;
  },

  /**
   * Update an existing task
   * @param id - Task ID
   * @param data - Task update data (partial)
   * @returns Promise resolving to updated task
   */
  async update(id: string, data: UpdateTaskData): Promise<Task> {
    // Check if online
    if (browser && !navigator.onLine) {
      // Get existing task from offline storage
      const existingTask = await offlineStorage.getTask(id);
      if (!existingTask) {
        throw new Error('Task not found in offline storage');
      }
      
      // Update task locally
      const updatedTask: Task = {
        ...existingTask,
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      await offlineStorage.saveTask(updatedTask, 'pending');
      await syncService.updatePendingCount();
      return updatedTask;
    }

    const task = await apiClient.put<Task>(API_ENDPOINTS.TASKS.BY_ID(id), data);
    
    // Update offline storage as synced
    if (browser) {
      await offlineStorage.saveTask(task, 'synced');
    }
    
    return task;
  },

  /**
   * Delete a task
   * @param id - Task ID
   * @returns Promise resolving when task is deleted
   */
  async delete(id: string): Promise<void> {
    // Check if online
    if (browser && !navigator.onLine) {
      // Delete from offline storage immediately
      await offlineStorage.deleteTask(id);
      await syncService.updatePendingCount();
      return;
    }

    await apiClient.delete<void>(API_ENDPOINTS.TASKS.BY_ID(id));
    
    // Delete from offline storage
    if (browser) {
      await offlineStorage.deleteTask(id);
    }
  },

  /**
   * Toggle completion status of a task
   * @param id - Task ID
   * @param isCompleted - New completion status
   * @returns Promise resolving to updated task
   */
  async toggleComplete(id: string, isCompleted: boolean): Promise<Task> {
    // Check if online
    if (browser && !navigator.onLine) {
      // Get existing task from offline storage
      const existingTask = await offlineStorage.getTask(id);
      if (!existingTask) {
        throw new Error('Task not found in offline storage');
      }
      
      // Update task locally
      const updatedTask: Task = {
        ...existingTask,
        isCompleted,
        updatedAt: new Date().toISOString()
      };
      
      await offlineStorage.saveTask(updatedTask, 'pending');
      await syncService.updatePendingCount();
      return updatedTask;
    }

    const task = await apiClient.put<Task>(API_ENDPOINTS.TASKS.COMPLETE(id), { isCompleted });
    
    // Update offline storage as synced
    if (browser) {
      await offlineStorage.saveTask(task, 'synced');
    }
    
    return task;
  }
};
