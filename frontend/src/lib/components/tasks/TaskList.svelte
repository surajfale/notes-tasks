<script lang="ts">
  import TaskCard from './TaskCard.svelte';
  import type { Task } from '$lib/types/task';

  export let tasks: Task[];
  export let emptyMessage = 'No tasks found';
  export let groupByPriority = false;
  // When true, completed tasks are moved into a collapsed section below the
  // active ones instead of being interleaved with them.
  export let splitCompleted = false;
  // 'list': dense vertical stack (default). 'grid': responsive card grid.
  export let layout: 'grid' | 'list' = 'list';

  $: containerClass =
    layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-4';

  let completedExpanded = false;

  // Group tasks by priority if enabled
  $: groupedTasks = groupByPriority
    ? {
        3: (Array.isArray(tasks) ? tasks : []).filter(t => t.priority === 3),
        2: (Array.isArray(tasks) ? tasks : []).filter(t => t.priority === 2),
        1: (Array.isArray(tasks) ? tasks : []).filter(t => t.priority === 1)
      } as Record<number, Task[]>
    : null;

  $: activeTasks = splitCompleted ? (Array.isArray(tasks) ? tasks : []).filter(t => !t.isCompleted) : [];
  $: completedTasks = splitCompleted ? (Array.isArray(tasks) ? tasks : []).filter(t => t.isCompleted) : [];

  const priorityLabels: Record<number, string> = {
    3: 'High Priority',
    2: 'Normal Priority',
    1: 'Low Priority'
  };
</script>

{#if !Array.isArray(tasks) || tasks.length === 0}
  <!-- Empty state -->
  <div class="text-center py-12">
    <svg
      class="mx-auto h-12 w-12 text-stone-400"
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
    <h3 class="mt-2 text-sm font-medium text-stone-900 dark:text-stone-100">{emptyMessage}</h3>
  </div>
{:else if groupByPriority && groupedTasks}
  <!-- Grouped by priority -->
  <div class="space-y-8">
    {#each [3, 2, 1] as priority}
      {#if groupedTasks && groupedTasks[priority]?.length > 0}
        <div>
          <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">
            {priorityLabels[priority]}
            <span class="text-sm font-normal text-stone-500 dark:text-stone-400">
              ({groupedTasks[priority]?.length || 0})
            </span>
          </h2>
          <div class={containerClass}>
            {#each groupedTasks[priority] || [] as task (task._id)}
              <TaskCard {task} />
            {/each}
          </div>
        </div>
      {/if}
    {/each}
  </div>
{:else if splitCompleted}
  <!-- Active tasks first, completed ones tucked into a collapsed section -->
  <div class={containerClass}>
    {#each activeTasks as task (task._id)}
      <TaskCard {task} />
    {/each}
  </div>

  {#if completedTasks.length > 0}
    <div class="mt-6">
      <button
        type="button"
        on:click={() => (completedExpanded = !completedExpanded)}
        aria-expanded={completedExpanded}
        class="flex items-center gap-2 text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
      >
        <svg
          class="w-4 h-4 transition-transform {completedExpanded ? 'rotate-90' : ''}"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        Completed ({completedTasks.length})
      </button>

      {#if completedExpanded}
        <div class="{containerClass} mt-3">
          {#each completedTasks as task (task._id)}
            <TaskCard {task} />
          {/each}
        </div>
      {/if}
    </div>
  {/if}
{:else}
  <!-- Simple list -->
  <div class={containerClass}>
    {#each Array.isArray(tasks) ? tasks : [] as task (task._id)}
      <TaskCard {task} />
    {/each}
  </div>
{/if}
