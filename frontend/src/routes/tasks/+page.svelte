<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { tasksStore } from '$lib/stores/tasks';
  import { listsStore } from '$lib/stores/lists';
  import TaskList from '$lib/components/tasks/TaskList.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import ViewLayoutToggle from '$lib/components/ui/ViewLayoutToggle.svelte';
  import { LoadingOverlay, ErrorMessage, PageHeader, EmptyState } from '$lib/components/ui';
  import { personaStore } from '$lib/stores/persona';
  import { getStoredLayout, setStoredLayout, type ViewLayout } from '$lib/utils/viewLayout';
  import type { TaskFilters, TaskPriority } from '$lib/types/task';
  import type { UiPersona } from '$lib/types/user';

  const LAYOUT_STORAGE_KEY = 'tasks-view-layout';

  // Filter state
  let selectedListId = '';
  let completionFilter: 'all' | 'active' | 'completed' = 'all';
  let selectedPriority: TaskPriority | '' = '';
  let showFilters = false;

  // View layout: defaults from the active persona (vivid -> grid, everyone
  // else -> dense list), overridable by hand and remembered per-browser.
  let persona: UiPersona = 'focus';
  personaStore.subscribe((value) => {
    persona = value;
  });
  let manualLayout: ViewLayout | null = null;
  let defaultLayout: ViewLayout;
  $: defaultLayout = persona === 'vivid' ? 'grid' : 'list';
  let layout: ViewLayout;
  $: layout = manualLayout ?? defaultLayout;

  function handleLayoutChange(value: ViewLayout) {
    manualLayout = value;
    setStoredLayout(LAYOUT_STORAGE_KEY, value);
  }

  // Quick-add: create a task from just a title without leaving the list
  let quickAddTitle = '';
  let isQuickAdding = false;

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
    manualLayout = getStoredLayout(LAYOUT_STORAGE_KEY);
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

  async function handleQuickAdd() {
    const title = quickAddTitle.trim();
    if (!title || isQuickAdding) return;

    isQuickAdding = true;
    try {
      await tasksStore.create({
        title,
        description: '',
        listId: selectedListId || undefined
      });
      quickAddTitle = '';
    } catch (error) {
      console.error('Failed to quick-add task:', error);
    } finally {
      isQuickAdding = false;
    }
  }

  // Clear filters
  function clearAllFilters() {
    selectedListId = '';
    completionFilter = 'all';
    selectedPriority = '';
    loadTasks();
  }

  $: hasActiveFilters = selectedListId || completionFilter !== 'all' || selectedPriority;
  $: activeFilterCount = (selectedListId ? 1 : 0) + (completionFilter !== 'all' ? 1 : 0) + (selectedPriority ? 1 : 0);

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
  <PageHeader title="Tasks">
    <svelte:fragment slot="description">
      {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}
      {#if completionFilter === 'all'}
        <span class="hidden sm:inline">· {activeTasks} active · {completedTasks} completed</span>
      {/if}
    </svelte:fragment>
    <svelte:fragment slot="actions">
      <!-- Hidden on mobile: the floating create button already covers this there. -->
      <Button variant="primary" on:click={handleCreateTask} fullWidth={false} class="hidden md:inline-flex">
        Create Task
      </Button>
    </svelte:fragment>
  </PageHeader>

  <!-- Quick add + filters toggle -->
  <div class="flex gap-3 mb-4">
    <form on:submit|preventDefault={handleQuickAdd} class="flex-1 flex gap-2">
      <input
        type="text"
        bind:value={quickAddTitle}
        placeholder="Quick add a task and press Enter…"
        disabled={isQuickAdding}
        class="w-full px-4 py-3 min-h-[44px] text-base rounded-lg border border-stone-200 dark:border-stone-800
               bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500
               focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
               disabled:opacity-50"
      />
    </form>
    <ViewLayoutToggle {layout} onChange={handleLayoutChange} />
    <button
      type="button"
      on:click={() => (showFilters = !showFilters)}
      aria-expanded={showFilters}
      class="flex items-center gap-2 px-4 min-h-[44px] rounded-lg border text-sm font-medium transition-colors flex-shrink-0
             {showFilters || activeFilterCount > 0
               ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
               : 'border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/50'}"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
      </svg>
      <span class="hidden sm:inline">Filters</span>
      {#if activeFilterCount > 0}
        <span class="flex items-center justify-center w-5 h-5 rounded-full bg-primary-600 text-white text-xs font-semibold">
          {activeFilterCount}
        </span>
      {/if}
    </button>
  </div>

  {#if showFilters}
  <div class="bg-stone-50 dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 p-4 sm:p-6 mb-6 sm:mb-8">
    <div class="flex flex-col gap-4">
      <!-- Filter controls row -->
      <div class="flex flex-col sm:flex-row sm:flex-wrap gap-4 items-stretch sm:items-end">
        <!-- List filter -->
        <div class="flex-1 min-w-full sm:min-w-[180px]">
          <label for="list-filter" class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            Filter by List
          </label>
          <select
            id="list-filter"
            bind:value={selectedListId}
            on:change={handleListFilterChange}
            class="w-full px-4 py-3 min-h-[44px] text-base rounded-lg border border-stone-300 dark:border-stone-600 
                   bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100
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
          <label for="completion-filter" class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            Status
          </label>
          <select
            id="completion-filter"
            bind:value={completionFilter}
            on:change={handleCompletionFilterChange}
            class="w-full px-4 py-3 min-h-[44px] text-base rounded-lg border border-stone-300 dark:border-stone-600 
                   bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Tasks</option>
            <option value="active">Active Only</option>
            <option value="completed">Completed Only</option>
          </select>
        </div>

        <!-- Priority filter -->
        <div class="flex-1 min-w-full sm:min-w-[180px]">
          <label for="priority-filter" class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            Priority
          </label>
          <select
            id="priority-filter"
            bind:value={selectedPriority}
            on:change={handlePriorityFilterChange}
            class="w-full px-4 py-3 min-h-[44px] text-base rounded-lg border border-stone-300 dark:border-stone-600 
                   bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100
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
    <EmptyState
      title="No tasks found"
      description={hasActiveFilters ? 'Try adjusting your filters' : 'Get started by creating a new task'}
    >
      <svelte:fragment slot="icon">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      </svelte:fragment>
      {#if !hasActiveFilters}
        <Button variant="primary" on:click={handleCreateTask}>
          Create Task
        </Button>
      {/if}
    </EmptyState>
  {:else}
    <!-- Tasks list -->
    <TaskList
      tasks={Array.isArray($tasksStore.items) ? $tasksStore.items : []}
      emptyMessage={hasActiveFilters ? 'No tasks match your filters' : 'No tasks found'}
      splitCompleted={completionFilter === 'all'}
      {layout}
    />
  {/if}
</div>
