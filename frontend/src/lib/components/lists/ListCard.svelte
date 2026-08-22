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

<Card padding="medium" hover class="group">
  <div class="flex flex-col gap-4">
    <!-- Header with color indicator and emoji -->
    <div class="flex items-start gap-3">
      <div
        class="w-11 h-11 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
        style="background-color: {list.color}1a"
      >
        {#if list.emoji}
          <span>{list.emoji}</span>
        {:else}
          <div
            class="w-4 h-4 rounded-full"
            style="background-color: {list.color}"
          ></div>
        {/if}
      </div>

      <div class="flex-1 min-w-0">
        <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
          {list.title}
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {totalItems} {totalItems === 1 ? 'item' : 'items'}
          {#if noteCount > 0 || taskCount > 0}
            <span class="text-gray-400 dark:text-gray-500">
              ({noteCount} {noteCount === 1 ? 'note' : 'notes'}, {taskCount} {taskCount === 1 ? 'task' : 'tasks'})
            </span>
          {/if}
        </p>
      </div>
    </div>

    <!-- Actions: full-opacity on touch devices, hover/focus-revealed on pointer devices -->
    <div class="flex items-center gap-1 -mx-2 pt-2 border-t border-gray-100 dark:border-gray-800
                opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
      {#if !showDeleteConfirm}
        <button
          on:click={handleEdit}
          class="text-sm py-1.5 px-2 min-h-[36px] rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          Edit
        </button>
        <button
          on:click={handleDelete}
          class="text-sm py-1.5 px-2 min-h-[36px] rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          disabled={isDeleting}
        >
          Delete
        </button>
      {:else}
        <span class="text-sm text-gray-700 dark:text-gray-300 px-2">Delete this list?</span>
        <button
          on:click={handleDelete}
          class="text-sm py-1.5 px-2 min-h-[36px] rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors"
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting…' : 'Confirm'}
        </button>
        <button
          on:click={cancelDelete}
          class="text-sm py-1.5 px-2 min-h-[36px] rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
      {/if}
    </div>
  </div>
</Card>
