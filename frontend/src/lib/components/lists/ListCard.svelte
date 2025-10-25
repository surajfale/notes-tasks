<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import { listsStore } from '$lib/stores/lists';
  import { notesStore } from '$lib/stores/notes';
  import { tasksStore } from '$lib/stores/tasks';
  import type { List } from '$lib/types/list';

  export let list: List;
  export let onEdit: ((list: List) => void) | undefined = undefined;
  export let onDelete: ((list: List) => void) | undefined = undefined;

  let isDeleting = false;
  let showDeleteConfirm = false;

  // Count items in this list
  $: noteCount = (Array.isArray($notesStore.items) ? $notesStore.items : []).filter(n => n.listId === list._id).length;
  $: taskCount = (Array.isArray($tasksStore.items) ? $tasksStore.items : []).filter(t => t.listId === list._id).length;
  $: totalItems = noteCount + taskCount;

  async function handleDelete(e: Event) {
    e.stopPropagation();
    if (!showDeleteConfirm) {
      showDeleteConfirm = true;
      return;
    }

    if (onDelete) {
      onDelete(list);
    }
  }

  function handleEdit(e: Event) {
    e.stopPropagation();
    if (onEdit) {
      onEdit(list);
    }
  }

  function cancelDelete(e: Event) {
    e.stopPropagation();
    showDeleteConfirm = false;
  }
</script>

<Card padding="medium" hover>
  <div class="flex flex-col gap-4">
    <!-- Header with color indicator and emoji -->
    <div class="flex items-start gap-3">
      <div 
        class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style="background-color: {list.color}20"
      >
        {#if list.emoji}
          <span>{list.emoji}</span>
        {:else}
          <div 
            class="w-6 h-6 rounded-full"
            style="background-color: {list.color}"
          />
        {/if}
      </div>
      
      <div class="flex-1 min-w-0">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
          {list.title}
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {totalItems} {totalItems === 1 ? 'item' : 'items'}
          {#if noteCount > 0 || taskCount > 0}
            <span class="text-gray-500 dark:text-gray-500">
              ({noteCount} {noteCount === 1 ? 'note' : 'notes'}, {taskCount} {taskCount === 1 ? 'task' : 'tasks'})
            </span>
          {/if}
        </p>
      </div>
    </div>

    <!-- Color preview bar -->
    <div 
      class="h-2 rounded-full"
      style="background-color: {list.color}"
    />

    <!-- Actions -->
    <div class="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
      {#if !showDeleteConfirm}
        <button
          on:click={handleEdit}
          class="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          Edit
        </button>
        <button
          on:click={handleDelete}
          class="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
          disabled={isDeleting}
        >
          Delete
        </button>
      {:else}
        <span class="text-sm text-gray-700 dark:text-gray-300">Delete this list?</span>
        <button
          on:click={handleDelete}
          class="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors"
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Confirm'}
        </button>
        <button
          on:click={cancelDelete}
          class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Cancel
        </button>
      {/if}
    </div>
  </div>
</Card>
