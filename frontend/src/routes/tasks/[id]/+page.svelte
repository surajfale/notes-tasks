<script lang="ts">
  import { goto } from '$app/navigation';
  import { tasksStore } from '$lib/stores/tasks';
  import { listsStore } from '$lib/stores/lists';
  import Button from '$lib/components/ui/Button.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import TaskEditor from '$lib/components/tasks/TaskEditor.svelte';
  import NotificationDisplay from '$lib/components/tasks/NotificationDisplay.svelte';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import type { UpdateTaskData } from '$lib/types/task';
  import { formatRelativeDate, formatAbsoluteDateTime } from '$lib/utils/date';
  import { ApiError } from '$lib/types/error';

  export let data: PageData;

  let isCompleted = data.task.isCompleted;
  let isSubmitting = false;
  let showDeleteModal = false;
  let isDeleting = false;
  let apiError = '';
  let lastSubmitData: UpdateTaskData | null = null;

  onMount(() => {
    // Load lists if not already loaded
    if (!Array.isArray($listsStore.items) || $listsStore.items.length === 0) {
      listsStore.loadAll();
    }
  });

  async function handleSubmit(event: CustomEvent<UpdateTaskData>) {
    isSubmitting = true;
    apiError = '';
    lastSubmitData = event.detail;

    try {
      await tasksStore.update(data.task._id, lastSubmitData);
      // Redirect to tasks list on success
      goto('/tasks');
    } catch (error) {
      console.error('Failed to update task:', error);
      
      // Handle different error types
      if (error instanceof ApiError) {
        if (error.statusCode === 0) {
          apiError = 'Network error. Please check your connection and try again.';
        } else if (error.statusCode === 400) {
          apiError = error.message || 'Invalid task data. Please check your inputs.';
        } else if (error.statusCode === 401) {
          apiError = 'Your session has expired. Please log in again.';
        } else if (error.statusCode === 404) {
          apiError = 'Task not found. It may have been deleted.';
        } else if (error.statusCode >= 500) {
          apiError = 'Server error. Please try again later.';
        } else {
          apiError = error.message || 'Failed to update task. Please try again.';
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
      handleSubmit({ detail: lastSubmitData } as CustomEvent<UpdateTaskData>);
    }
  }

  async function handleToggleComplete() {
    isSubmitting = true;
    try {
      await tasksStore.toggleComplete(data.task._id, !isCompleted);
      isCompleted = !isCompleted;
    } catch (error) {
      console.error('Failed to toggle completion:', error);
    } finally {
      isSubmitting = false;
    }
  }

  function openDeleteModal() {
    showDeleteModal = true;
  }

  function closeDeleteModal() {
    showDeleteModal = false;
  }

  async function handleDelete() {
    isDeleting = true;
    try {
      await tasksStore.delete(data.task._id);
      goto('/tasks');
    } catch (error) {
      console.error('Failed to delete task:', error);
      isDeleting = false;
      closeDeleteModal();
    }
  }

  function handleCancel() {
    goto('/tasks');
  }
</script>

<div class="max-w-4xl mx-auto p-6">
  <div class="mb-6">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Edit Task</h1>
    <div class="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
      <span>Last updated {formatRelativeDate(data.task.updatedAt)}</span>
      <span class="text-gray-400 dark:text-gray-600">•</span>
      <span title={formatAbsoluteDateTime(data.task.createdAt)}>Created {formatRelativeDate(data.task.createdAt)}</span>
    </div>
  </div>

  <div class="bg-white dark:bg-black rounded-lg shadow-md p-6 space-y-6">
    <!-- Completion Checkbox at the top -->
    <div class="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
      <input
        type="checkbox"
        id="isCompleted"
        checked={isCompleted}
        disabled={isSubmitting}
        class="w-6 h-6 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 focus:ring-2"
        on:change={handleToggleComplete}
      />
      <label
        for="isCompleted"
        class="text-base font-medium text-gray-700 dark:text-gray-300"
      >
        Mark as {isCompleted ? 'incomplete' : 'complete'}
      </label>
    </div>

    <!-- Notification Status Display -->
    <NotificationDisplay
      enabled={data.task.notificationEnabled || false}
      timings={data.task.notificationTimings || []}
      sentNotifications={data.task.notificationsSent || []}
      dueDate={data.task.dueAt}
    />

    <TaskEditor
      task={data.task}
      on:submit={handleSubmit}
      on:cancel={handleCancel}
      {isSubmitting}
      {apiError}
      onRetry={lastSubmitData ? handleRetry : null}
    />

    <!-- Delete button -->
    <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
      <Button
        type="button"
        variant="danger"
        on:click={openDeleteModal}
        disabled={isSubmitting}
      >
        Delete Task
      </Button>
    </div>
  </div>
</div>

<!-- Delete Confirmation Modal -->
<Modal
  bind:open={showDeleteModal}
  title="Delete Task"
  onClose={closeDeleteModal}
>
  <p class="text-gray-700 dark:text-gray-300">
    Are you sure you want to delete this task? This action cannot be undone.
  </p>
  
  <svelte:fragment slot="footer">
    <div class="flex gap-4 justify-end">
      <Button
        type="button"
        variant="secondary"
        on:click={closeDeleteModal}
        disabled={isDeleting}
      >
        Cancel
      </Button>
      <Button
        type="button"
        variant="danger"
        on:click={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? 'Deleting...' : 'Delete'}
      </Button>
    </div>
  </svelte:fragment>
</Modal>
