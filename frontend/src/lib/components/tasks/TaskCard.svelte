<script lang="ts">
  import { goto } from '$app/navigation';
  import PendingBadge from '$lib/components/sync/PendingBadge.svelte';
  import MarkdownRenderer from '$lib/components/ui/MarkdownRenderer.svelte';
  import TactileCheckbox from '$lib/components/tactile/TactileCheckbox.svelte';
  import { tasksStore } from '$lib/stores/tasks';
  import { listsStore } from '$lib/stores/lists';
  import { isTaskPending } from '$lib/stores/syncStatus';
  import { personaStore } from '$lib/stores/persona';
  import { formatDueDate, isPastDate } from '$lib/utils/date';
  import { getTagColor } from '$lib/utils/tagColors';
  import type { Task } from '$lib/types/task';
  import type { UiPersona } from '$lib/types/user';
  import '$lib/components/tactile/neumorphic.css';

  export let task: Task;

  // Check if this task has pending changes
  $: hasPendingChanges = isTaskPending(task._id);

  let isDeleting = false;
  let showDeleteConfirm = false;
  let isTogglingComplete = false;

  // Vivid persona: small confetti burst when a task is marked complete.
  let persona: UiPersona = 'focus';
  personaStore.subscribe((value) => {
    persona = value;
  });
  let showCelebration = false;

  // Get list info if task has a listId
  $: list = task.listId 
    ? $listsStore.items.find(l => l._id === task.listId)
    : null;



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

  // Notification display logic
  $: hasNotifications = task.notificationEnabled && task.notificationTimings && task.notificationTimings.length > 0;
  
  // Format notification timings for display
  function formatNotificationTiming(timing: string): string {
    switch (timing) {
      case 'same_day':
        return 'Same day';
      case '1_day_before':
        return '1 day before';
      case '2_days_before':
        return '2 days before';
      default:
        return timing;
    }
  }
  
  $: notificationTimingsText = hasNotifications 
    ? task.notificationTimings.map(formatNotificationTiming).join(', ')
    : '';

  async function handleToggleComplete(next: boolean) {
    if (isTogglingComplete) return;

    isTogglingComplete = true;
    try {
      await tasksStore.toggleComplete(task._id, next);
      if (next && persona === 'vivid') {
        showCelebration = true;
        setTimeout(() => {
          showCelebration = false;
        }, 650);
      }
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

<div
  class="group relative cursor-pointer {task.isCompleted ? 'neu-pressed' : 'neu-raised neu-interactive'}"
  on:click={handleClick}
  on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
  role="button"
  tabindex="0"
>
  <div class="p-4 sm:p-6">
    <div class="flex gap-4">
    <!-- Completion checkbox -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="flex-shrink-0 pt-1 relative" role="presentation" on:click|stopPropagation>
      <TactileCheckbox
        checked={task.isCompleted}
        disabled={isTogglingComplete}
        label={task.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
        accent="tasks"
        glyph={persona === 'terminal' ? 'terminal' : 'check'}
        onToggle={handleToggleComplete}
      />
      {#if showCelebration}
        <span class="celebration" aria-hidden="true">
          {#each Array(6) as _, i}
            <span class="spark" style="--angle: {i * 60}deg"></span>
          {/each}
        </span>
      {/if}
    </div>

    <!-- Task content -->
    <div class="flex-1 min-w-0">
      <div class="flex flex-col gap-3">
        <!-- Header with title, priority, and badges -->
        <div class="flex items-start justify-between gap-2">
          <h3 class="font-serif text-lg font-semibold flex-1 line-clamp-2 {task.isCompleted ? 'line-through text-stone-500 dark:text-stone-500' : 'text-stone-900 dark:text-stone-100'}">
            {task.title}
          </h3>
          <div class="flex items-center gap-2 flex-shrink-0">
            <!-- Pending badge -->
            <PendingBadge show={$hasPendingChanges} size="sm" />
            <!-- Notification indicator -->
            {#if hasNotifications}
              <span 
                class="px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                title="Notifications: {notificationTimingsText}"
              >
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span class="hidden sm:inline">{task.notificationTimings.length}</span>
              </span>
            {/if}
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

        <!-- Checklist progress -->
        {#if task.checklistItems && task.checklistItems.length > 0}
          {@const completedCount = task.checklistItems.filter(item => item.isCompleted).length}
          {@const totalCount = task.checklistItems.length}
          {@const progress = (completedCount / totalCount) * 100}
          <div class="space-y-2">
            <div class="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span>{completedCount} / {totalCount} items completed</span>
            </div>
            <div class="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2">
              <div
                class="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style="width: {progress}%"
              ></div>
            </div>
          </div>
        {/if}

        <!-- Description preview with markdown rendering -->
        {#if task.description}
          <div class="text-sm line-clamp-2 {task.isCompleted ? 'text-stone-500 dark:text-stone-500' : 'text-stone-600 dark:text-stone-400'}">
            <MarkdownRenderer content={task.description} maxLength={150} />
          </div>
        {/if}

        <!-- Due date and notifications -->
        {#if task.dueAt || hasNotifications}
          <div class="flex flex-col gap-2">
            {#if task.dueAt}
              <div class="flex items-center gap-1 text-sm {isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-stone-600 dark:text-stone-400'}">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{dueDateText}</span>
              </div>
            {/if}
            {#if hasNotifications}
              <div class="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span>Reminders: {notificationTimingsText}</span>
              </div>
            {/if}
          </div>
        {/if}

        <!-- Actions: full-opacity on touch devices, hover/focus-revealed on pointer devices -->
        <div class="flex items-center gap-1 pt-2 -mx-2 border-t border-stone-100 dark:border-stone-800
                    opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
          {#if !showDeleteConfirm}
            <button
              on:click={(e) => { e.stopPropagation(); handleToggleComplete(!task.isCompleted); }}
              disabled={isTogglingComplete}
              class="text-sm py-1.5 px-2 min-h-[36px] rounded-md text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors disabled:opacity-50"
            >
              <span class="hidden sm:inline">{task.isCompleted ? 'Mark Incomplete' : 'Mark Complete'}</span>
              <span class="sm:hidden">{task.isCompleted ? 'Incomplete' : 'Complete'}</span>
            </button>
            <button
              on:click={handleDelete}
              class="text-sm py-1.5 px-2 min-h-[36px] rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              disabled={isDeleting}
            >
              Delete
            </button>
          {:else}
            <span class="text-sm text-stone-700 dark:text-stone-300 px-2">Delete this task?</span>
            <button
              on:click={handleDelete}
              class="text-sm py-1.5 px-2 min-h-[36px] rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Confirm'}
            </button>
            <button
              on:click={cancelDelete}
              class="text-sm py-1.5 px-2 min-h-[36px] rounded-md text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>
          {/if}

          {#if task.isCompleted}
            <span class="ml-auto text-xs text-stone-400 dark:text-stone-500 px-2">
              Completed
            </span>
          {/if}
        </div>
      </div>
    </div>
    </div>
  </div>
</div>

<style>
  /* Vivid persona only (see showCelebration in the script block) — a brief
     radial confetti burst around the checkbox. Neutralized automatically by
     app.css's prefers-reduced-motion rule (zeros animation-duration). */
  .celebration {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .spark {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 6px;
    height: 6px;
    border-radius: 9999px;
    transform: translate(-50%, -50%);
    animation: task-spark-burst 550ms ease-out forwards;
  }

  .spark:nth-child(1) {
    background: #ff5a36;
  }
  .spark:nth-child(2) {
    background: #5b5fef;
  }
  .spark:nth-child(3) {
    background: #14ae7a;
  }
  .spark:nth-child(4) {
    background: #ff8a3d;
  }
  .spark:nth-child(5) {
    background: #ffcf3d;
  }
  .spark:nth-child(6) {
    background: #5b5fef;
  }

  @keyframes task-spark-burst {
    0% {
      transform: translate(-50%, -50%) rotate(var(--angle)) translateX(0) scale(1);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) rotate(var(--angle)) translateX(22px) scale(0.4);
      opacity: 0;
    }
  }
</style>
