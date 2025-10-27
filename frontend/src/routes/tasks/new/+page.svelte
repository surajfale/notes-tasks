<script lang="ts">
  import { goto } from '$app/navigation';
  import { tasksStore } from '$lib/stores/tasks';
  import { listsStore } from '$lib/stores/lists';
  import TaskEditor from '$lib/components/tasks/TaskEditor.svelte';
  import { onMount } from 'svelte';
  import type { CreateTaskData, UpdateTaskData } from '$lib/types/task';

  let isSubmitting = false;

  onMount(() => {
    // Load lists if not already loaded
    if (!Array.isArray($listsStore.items) || $listsStore.items.length === 0) {
      listsStore.loadAll();
    }
  });

  async function handleSubmit(event: CustomEvent<CreateTaskData | UpdateTaskData>) {
    isSubmitting = true;

    try {
      await tasksStore.create(event.detail as CreateTaskData);
      // Redirect to tasks list on success
      goto('/tasks');
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      isSubmitting = false;
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
    />
  </div>

  {#if $tasksStore.error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-6">
      <p class="text-red-800 dark:text-red-200">{$tasksStore.error}</p>
    </div>
  {/if}
</div>
