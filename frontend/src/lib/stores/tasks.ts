// Tasks store for state management

import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { tasksRepository } from '$lib/repositories/tasks.repository';
import { offlineStorage } from '$lib/storage/offline';
import type { Task, CreateTaskData, UpdateTaskData, TaskFilters } from '$lib/types/task';

interface TasksState {
  items: Task[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Create tasks store with CRUD operations
 */
function createTasksStore() {
  const { subscribe, set, update } = writable<TasksState>({
    items: [],
    isLoading: false,
    error: null
  });

  return {
    subscribe,

    /**
     * Load all tasks with optional filters
     * @param filters - Optional filters (listId, isCompleted, priority)
     */
    async loadAll(filters?: TaskFilters): Promise<void> {
      update((state) => ({ ...state, isLoading: true, error: null }));

      try {
        // Try to fetch from API
        const items = await tasksRepository.getAll(filters);
        
        // Cache in offline storage
        if (browser) {
          await offlineStorage.saveTasks(items, 'synced');
        }
        
        set({ items, isLoading: false, error: null });
      } catch (error: any) {
        // If offline, try to load from offline storage
        if (browser && !navigator.onLine) {
          try {
            const items = await offlineStorage.getTasks();
            set({ items, isLoading: false, error: null });
            return;
          } catch (offlineError) {
            // Fall through to error handling
          }
        }
        
        set({
          items: [],
          isLoading: false,
          error: error.message || 'Failed to load tasks'
        });
      }
    },

    /**
     * Create a new task
     * @param data - Task creation data
     * @returns Promise resolving to created task
     */
    async create(data: CreateTaskData): Promise<Task> {
      try {
        const newTask = await tasksRepository.create(data);
        update((state) => ({
          ...state,
          items: [newTask, ...(Array.isArray(state.items) ? state.items : [])],
          error: null
        }));
        return newTask;
      } catch (error: any) {
        update((state) => ({
          ...state,
          error: error.message || 'Failed to create task'
        }));
        throw error;
      }
    },

    /**
     * Update an existing task
     * @param id - Task ID
     * @param data - Task update data
     * @returns Promise resolving to updated task
     */
    async update(id: string, data: UpdateTaskData): Promise<Task> {
      try {
        const updatedTask = await tasksRepository.update(id, data);
        update((state) => ({
          ...state,
          items: (Array.isArray(state.items) ? state.items : []).map((task) => (task._id === id ? updatedTask : task)),
          error: null
        }));
        return updatedTask;
      } catch (error: any) {
        update((state) => ({
          ...state,
          error: error.message || 'Failed to update task'
        }));
        throw error;
      }
    },

    /**
     * Delete a task
     * @param id - Task ID
     */
    async delete(id: string): Promise<void> {
      try {
        await tasksRepository.delete(id);
        update((state) => ({
          ...state,
          items: (Array.isArray(state.items) ? state.items : []).filter((task) => task._id !== id),
          error: null
        }));
      } catch (error: any) {
        update((state) => ({
          ...state,
          error: error.message || 'Failed to delete task'
        }));
        throw error;
      }
    },

    /**
     * Toggle completion status of a task
     * @param id - Task ID
     * @param isCompleted - New completion status
     */
    async toggleComplete(id: string, isCompleted: boolean): Promise<Task> {
      try {
        const updatedTask = await tasksRepository.toggleComplete(id, isCompleted);
        update((state) => ({
          ...state,
          items: (Array.isArray(state.items) ? state.items : []).map((task) => (task._id === id ? updatedTask : task)),
          error: null
        }));
        return updatedTask;
      } catch (error: any) {
        update((state) => ({
          ...state,
          error: error.message || 'Failed to toggle completion status'
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

export const tasksStore = createTasksStore();
