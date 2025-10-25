<script lang="ts">
  import { goto } from '$app/navigation';
  import Card from '$lib/components/ui/Card.svelte';
  import PendingBadge from '$lib/components/sync/PendingBadge.svelte';
  import { tasksStore } from '$lib/stores/tasks';
  import { listsStore } from '$lib/stores/lists';
  import { isTaskPending } from '$lib/stores/syncStatus';
  import { formatDueDate, isPastDate } from '$lib/utils/date';
  import type { Task } from '$lib/types/task';

  export let task: Task;
  
  // Check if this task has pending changes
  $: hasPendingChanges = isTaskPending(task._id);

  let isDeleting = false;
  let showDeleteConfirm = false;
  let isTogglingComplete = false;

  // Get list info if task has a listId
  $: list = task.listId 
    ? $listsStore.items.find(l => l._id === task.listId)
    : null;

  // Truncate description for preview
  $: descriptionPreview = task.description.length > 120 
    ? task.description.substring(0, 120) + '...' 
    : task.description;

  // Priority colors and labels
  const priorityConfig = {
    1: { label: 'Low', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    2: { label: 'Normal', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
    3: { label: 'High', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' }
  };

  $: priorityInfo = priorityConfig[task.priority];

  // Format due date using utility function
  $: dueDateText = task.dueAt ? formatDueDate(task.dueAt) : '';
  $: isOverdue = task.dueAt && isPastDate(task.dueAt) && !task.isCompleted;

  async function handleToggleComplete(e: Event) {
    e.stopPropagation();
    if (isTogglingComplete) return;
    
    isTogglingComplete = true;
    try {
      await tasksStore.toggleComplete(task._id, !task.isCompleted);
    } catch (error) {
      console.error('Failed to toggle completion:', error);
    } finally {
      isTogglingComplete = false;
    }
  }

  async function handleDelete(e: Event) {
    e.stopPropagation();
    if (!showDeleteConfirm) {
      showDeleteConfirm = true;
      return;
    }

    isDeleting = true;
    try {
      await tasksStore.delete(task._id);
    } catch (error) {
      console.error('Failed to delete task:', error);
      isDeleting = false;
      showDeleteConfirm = false;
    }
  }

  function handleClick() {
    goto(`/tasks/${task._id}`);
  }

  function cancelDelete(e: Event) {
    e.stopPropagation();
    showDeleteConfirm = false;
  }
</script>

<Card hover clickable padding="medium" on:click={handleClick}>
  <div class="flex gap-4">
    <!-- Completion checkbox -->
    <div class="flex-shrink-0 pt-1">
      <button
        on:click={handleToggleComplete}
        disabled={isTogglingComplete}
        class="w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all
               {task.isCompleted 
                 ? 'bg-primary-600 border-primary-600' 
                 : 'border-gray-300 dark:border-gray-600 hover:border-primary-500'}"
        aria-label={task.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {#if task.isCompleted}
          <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
        {/if}
      </button>
    </div>

    <!-- Task content -->
    <div class="flex-1 min-w-0">
      <div class="flex flex-col gap-3">
        <!-- Header with title, priority, and badges -->
        <div class="flex items-start justify-between gap-2">
          <h3 class="text-lg font-semibold flex-1 line-clamp-2 {task.isCompleted ? 'line-through text-gray-500 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}">
            {task.title}
          </h3>
          <div class="flex items-center gap-2 flex-shrink-0">
            <!-- Pending badge -->
            <PendingBadge show={$hasPendingChanges} size="sm" />
            <!-- Priority indicator -->
            <span 
              class="px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap {priorityInfo.bg} {priorityInfo.color}"
            >
              {priorityInfo.label}
            </span>
            <!-- List badge -->
            {#if list}
              <span 
                class="px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap flex items-center gap-1"
                style="background-color: {list.color}20; color: {list.color}"
              >
                {#if list.emoji}
                  <span>{list.emoji}</span>
                {/if}
                {list.title}
              </span>
            {/if}
          </div>
        </div>

        <!-- Description preview -->
        {#if task.description}
          <p class="text-sm line-clamp-2 {task.isCompleted ? 'text-gray-500 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'}">
            {descriptionPreview}
          </p>
        {/if}

        <!-- Due date -->
        {#if task.dueAt}
          <div class="flex items-center gap-1 text-sm {isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-600 dark:text-gray-400'}">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{dueDateText}</span>
          </div>
        {/if}

        <!-- Actions -->
        <div class="flex items-center gap-2 sm:gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          {#if !showDeleteConfirm}
            <button
              on:click={handleToggleComplete}
              disabled={isTogglingComplete}
              class="text-sm sm:text-base py-1 px-2 min-h-[36px] text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors disabled:opacity-50"
            >
              <span class="hidden sm:inline">{task.isCompleted ? 'Mark Incomplete' : 'Mark Complete'}</span>
              <span class="sm:hidden">{task.isCompleted ? 'Incomplete' : 'Complete'}</span>
            </button>
            <button
              on:click={handleDelete}
              class="text-sm sm:text-base py-1 px-2 min-h-[36px] text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
              disabled={isDeleting}
            >
              Delete
            </button>
          {:else}
            <span class="text-sm sm:text-base text-gray-700 dark:text-gray-300">Delete this task?</span>
            <button
              on:click={handleDelete}
              class="text-sm sm:text-base py-1 px-2 min-h-[36px] text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Confirm'}
            </button>
            <button
              on:click={cancelDelete}
              class="text-sm sm:text-base py-1 px-2 min-h-[36px] text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Cancel
            </button>
          {/if}
          
          {#if task.isCompleted}
            <span class="ml-auto text-xs sm:text-sm text-gray-500 dark:text-gray-500">
              Completed
            </span>
          {/if}
        </div>
      </div>
    </div>
  </div>
</Card>
