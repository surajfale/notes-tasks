<script lang="ts">
  import { goto } from '$app/navigation';
  import { tasksStore } from '$lib/stores/tasks';
  import { listsStore } from '$lib/stores/lists';
  import TaskEditor from '$lib/components/tasks/TaskEditor.svelte';
  import { onMount } from 'svelte';
  import type { CreateTaskData, UpdateTaskData } from '$lib/types/task';
  import { ApiError } from '$lib/types/error';

  let isSubmitting = false;
  let apiError = '';
  let lastSubmitData: CreateTaskData | null = null;

  onMount(() => {
    // Load lists if not already loaded
    if (!Array.isArray($listsStore.items) || $listsStore.items.length === 0) {
      listsStore.loadAll();
    }
  });

  async function handleSubmit(event: CustomEvent<CreateTaskData | UpdateTaskData>) {
    isSubmitting = true;
    apiError = '';
    lastSubmitData = event.detail as CreateTaskData;

    try {
      await tasksStore.create(lastSubmitData);
      // Redirect to tasks list on success
      goto('/tasks');
    } catch (error) {
      console.error('Failed to create task:', error);
      
      // Handle different error types
      if (error instanceof ApiError) {
        if (error.statusCode === 0) {
          apiError = 'Network error. Please check your connection and try again.';
        } else if (error.statusCode === 400) {
          apiError = error.message || 'Invalid task data. Please check your inputs.';
        } else if (error.statusCode === 401) {
          apiError = 'Your session has expired. Please log in again.';
        } else if (error.statusCode >= 500) {
          apiError = 'Server error. Please try again later.';
        } else {
          apiError = error.message || 'Failed to create task. Please try again.';
        }
      } else {
        apiError = 'An unexpected error occurred. Please try again.';
      }
    } finally {
      isSubmitting = false;
    }
  }

  function handleRetry() {
    if (lastSubmitData) {
      handleSubmit({ detail: lastSubmitData } as CustomEvent<CreateTaskData | UpdateTaskData>);
    }
  }

  function handleCancel() {
    goto('/tasks');
  }
</script>

<div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
  <div class="mb-6">
    <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Create Task</h1>
    <p class="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">Add a new task to your list</p>
  </div>

  <div class="bg-white dark:bg-black rounded-lg shadow-md p-4 sm:p-6">
    <TaskEditor
      on:submit={handleSubmit}
      on:cancel={handleCancel}
      {isSubmitting}
      {apiError}
      onRetry={lastSubmitData ? handleRetry : null}
    />
  </div>
</div>
