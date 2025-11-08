<script lang="ts">
  import TaskCard from './TaskCard.svelte';
  import type { Task } from '$lib/types/task';

  export let tasks: Task[];
  export let emptyMessage = 'No tasks found';
  export let groupByPriority = false;

  // Group tasks by priority if enabled
  $: groupedTasks = groupByPriority
    ? {
        3: (Array.isArray(tasks) ? tasks : []).filter(t => t.priority === 3),
        2: (Array.isArray(tasks) ? tasks : []).filter(t => t.priority === 2),
        1: (Array.isArray(tasks) ? tasks : []).filter(t => t.priority === 1)
      } as Record<number, Task[]>
    : null;

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
    <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">{emptyMessage}</h3>
  </div>
{:else if groupByPriority && groupedTasks}
  <!-- Grouped by priority -->
  <div class="space-y-8">
    {#each [3, 2, 1] as priority}
      {#if groupedTasks && groupedTasks[priority]?.length > 0}
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {priorityLabels[priority]}
            <span class="text-sm font-normal text-gray-500 dark:text-gray-400">
              ({groupedTasks[priority]?.length || 0})
            </span>
          </h2>
          <div class="space-y-4">
            {#each groupedTasks[priority] || [] as task (task._id)}
              <TaskCard {task} />
            {/each}
          </div>
        </div>
      {/if}
    {/each}
  </div>
{:else}
  <!-- Simple list -->
  <div class="space-y-4">
    {#each Array.isArray(tasks) ? tasks : [] as task (task._id)}
      <TaskCard {task} />
    {/each}
  </div>
{/if}
