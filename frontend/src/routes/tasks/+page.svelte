<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { tasksStore } from '$lib/stores/tasks';
  import { listsStore } from '$lib/stores/lists';
  import TaskList from '$lib/components/tasks/TaskList.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { LoadingOverlay, ErrorMessage } from '$lib/components/ui';
  import type { TaskFilters, TaskPriority } from '$lib/types/task';

  // Filter state
  let selectedListId = '';
  let completionFilter: 'all' | 'active' | 'completed' = 'all';
  let selectedPriority: TaskPriority | '' = '';

  // Read listId from URL parameters
  $: {
    const listIdParam = $page.url.searchParams.get('listId');
    if (listIdParam && listIdParam !== selectedListId) {
      selectedListId = listIdParam;
      if (typeof window !== 'undefined') {
        loadTasks();
      }
    }
  }

  // Load tasks and lists on mount
  onMount(async () => {
    try {
      await Promise.all([
        listsStore.loadAll(),
        loadTasks()
      ]);
    } catch (error) {
      console.error('Failed to load data on mount:', error);
    }
  });

  // Load tasks with current filters
  async function loadTasks() {
    const filters: TaskFilters = {};

    if (selectedListId) {
      filters.listId = selectedListId;
    }

    if (completionFilter === 'active') {
      filters.isCompleted = false;
    } else if (completionFilter === 'completed') {
      filters.isCompleted = true;
    }

    if (selectedPriority) {
      filters.priority = selectedPriority;
    }

    await tasksStore.loadAll(filters);
  }

  // Handle filter changes
  function handleListFilterChange() {
    loadTasks();
  }

  function handleCompletionFilterChange() {
    loadTasks();
  }

  function handlePriorityFilterChange() {
    loadTasks();
  }

  function handleCreateTask() {
    goto('/tasks/new');
  }

  // Clear filters
  function clearAllFilters() {
    selectedListId = '';
    completionFilter = 'all';
    selectedPriority = '';
    loadTasks();
  }

  $: hasActiveFilters = selectedListId || completionFilter !== 'all' || selectedPriority;

  // Group tasks by priority (optional feature)
  $: tasksByPriority = {
    3: (Array.isArray($tasksStore.items) ? $tasksStore.items : []).filter(t => t.priority === 3),
    2: (Array.isArray($tasksStore.items) ? $tasksStore.items : []).filter(t => t.priority === 2),
    1: (Array.isArray($tasksStore.items) ? $tasksStore.items : []).filter(t => t.priority === 1)
  };

  // Stats
  $: totalTasks = Array.isArray($tasksStore.items) ? $tasksStore.items.length : 0;
  $: completedTasks = (Array.isArray($tasksStore.items) ? $tasksStore.items : []).filter(t => t.isCompleted).length;
  $: activeTasks = totalTasks - completedTasks;
</script>

<svelte:head>
  <title>Tasks</title>
</svelte:head>

<div class="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
    <div>
      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Tasks</h1>
      <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
        {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}
        {#if completionFilter === 'all'}
          <span class="hidden sm:inline">· {activeTasks} active · {completedTasks} completed</span>
        {/if}
      </p>
    </div>
    <Button variant="primary" on:click={handleCreateTask} fullWidth={false}>
      <span class="hidden sm:inline">Create Task</span>
      <span class="sm:hidden">+ New</span>
    </Button>
  </div>

  <!-- Filters -->
  <div class="bg-white dark:bg-gray-950 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 p-4 sm:p-6 mb-6 sm:mb-8">
    <div class="flex flex-col gap-4">
      <!-- Filter controls row -->
      <div class="flex flex-col sm:flex-row sm:flex-wrap gap-4 items-stretch sm:items-end">
        <!-- List filter -->
        <div class="flex-1 min-w-full sm:min-w-[180px]">
          <label for="list-filter" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Filter by List
          </label>
          <select
            id="list-filter"
            bind:value={selectedListId}
            on:change={handleListFilterChange}
            class="w-full px-4 py-3 min-h-[44px] text-base rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-black text-gray-900 dark:text-gray-100
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Lists</option>
            {#each Array.isArray($listsStore.items) ? $listsStore.items : [] as list}
              <option value={list._id}>
                {list.emoji ? `${list.emoji} ` : ''}{list.title}
              </option>
            {/each}
          </select>
        </div>

        <!-- Completion status filter -->
        <div class="flex-1 min-w-full sm:min-w-[180px]">
          <label for="completion-filter" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <select
            id="completion-filter"
            bind:value={completionFilter}
            on:change={handleCompletionFilterChange}
            class="w-full px-4 py-3 min-h-[44px] text-base rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-black text-gray-900 dark:text-gray-100
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Tasks</option>
            <option value="active">Active Only</option>
            <option value="completed">Completed Only</option>
          </select>
        </div>

        <!-- Priority filter -->
        <div class="flex-1 min-w-full sm:min-w-[180px]">
          <label for="priority-filter" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Priority
          </label>
          <select
            id="priority-filter"
            bind:value={selectedPriority}
            on:change={handlePriorityFilterChange}
            class="w-full px-4 py-3 min-h-[44px] text-base rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-black text-gray-900 dark:text-gray-100
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Priorities</option>
            <option value="3">High Priority</option>
            <option value="2">Normal Priority</option>
            <option value="1">Low Priority</option>
          </select>
        </div>

        <!-- Clear filters -->
        {#if hasActiveFilters}
          <button
            on:click={clearAllFilters}
            class="text-sm sm:text-base text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium min-h-[44px] px-4 sm:pb-2"
          >
            Clear Filters
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- Error message -->
  {#if $tasksStore.error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
      <p class="text-red-800 dark:text-red-200">{$tasksStore.error}</p>
    </div>
  {/if}

  <!-- Error state -->
  {#if $tasksStore.error}
    <ErrorMessage
      title="Failed to Load Tasks"
      message={$tasksStore.error}
      showRetry={true}
      on:retry={loadTasks}
    />
  {:else if $tasksStore.isLoading}
    <LoadingOverlay text="Loading tasks..." />
  {:else if $tasksStore.items.length === 0}
    <!-- Empty state -->
    <div class="text-center py-12">
      <svg
        class="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No tasks found</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {hasActiveFilters ? 'Try adjusting your filters' : 'Get started by creating a new task'}
      </p>
      {#if !hasActiveFilters}
        <div class="mt-6">
          <Button variant="primary" on:click={handleCreateTask}>
            Create Task
          </Button>
        </div>
      {/if}
    </div>
  {:else}
    <!-- Tasks list -->
    <TaskList 
      tasks={Array.isArray($tasksStore.items) ? $tasksStore.items : []} 
      emptyMessage={hasActiveFilters ? 'No tasks match your filters' : 'No tasks found'}
    />
  {/if}
</div>
