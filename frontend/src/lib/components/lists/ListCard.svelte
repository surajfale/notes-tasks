<script lang="ts">
  import { listsStore } from '$lib/stores/lists';
  import { notesStore } from '$lib/stores/notes';
  import { tasksStore } from '$lib/stores/tasks';
  import type { List } from '$lib/types/list';
  import '$lib/components/tactile/neumorphic.css';

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

<div class="neu-raised neu-interactive group p-4 sm:p-6">
  <div class="flex flex-col gap-4">
    <!-- Header with color indicator and emoji -->
    <div class="flex items-start gap-3">
      <div
        class="neu-raised-sm w-11 h-11 flex items-center justify-center text-xl flex-shrink-0"
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
        <h3 class="font-serif text-base font-semibold text-stone-900 dark:text-stone-100 truncate">
          {list.title}
        </h3>
        <p class="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
          {totalItems} {totalItems === 1 ? 'item' : 'items'}
          {#if noteCount > 0 || taskCount > 0}
            <span class="text-stone-400 dark:text-stone-500">
              ({noteCount} {noteCount === 1 ? 'note' : 'notes'}, {taskCount} {taskCount === 1 ? 'task' : 'tasks'})
            </span>
          {/if}
        </p>
      </div>
    </div>

    <!-- Actions: full-opacity on touch devices, hover/focus-revealed on pointer devices -->
    <div class="flex items-center gap-1 -mx-2 pt-2 border-t border-stone-100 dark:border-stone-800
                opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
      {#if !showDeleteConfirm}
        <button
          on:click={handleEdit}
          class="text-sm py-1.5 px-2 min-h-[36px] rounded-md text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
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
        <span class="text-sm text-stone-700 dark:text-stone-300 px-2">Delete this list?</span>
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
    </div>
  </div>
</div>
