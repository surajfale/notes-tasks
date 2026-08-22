<script lang="ts">
  import { goto } from '$app/navigation';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import PendingBadge from '$lib/components/sync/PendingBadge.svelte';
  import MarkdownRenderer from '$lib/components/ui/MarkdownRenderer.svelte';
  import Tag from '$lib/components/ui/Tag.svelte';
  import ShareModal from '$lib/components/ui/ShareModal.svelte';
  import { notesStore } from '$lib/stores/notes';
  import { listsStore } from '$lib/stores/lists';
  import { isNotePending } from '$lib/stores/syncStatus';
  import { formatRelativeDate } from '$lib/utils/date';
  import { getTagColor } from '$lib/utils/tagColors';
  import type { Note } from '$lib/types/note';

  export let note: Note;
  
  // A small accent color derived from the first tag, used sparingly (a thin
  // left border) rather than tinting the whole card.
  $: accentColor = note.tags && note.tags.length > 0 ? getTagColor(note.tags[0]) : null;
  
  // Check if this note has pending changes
  $: hasPendingChanges = isNotePending(note._id);

  let isDeleting = false;
  let showDeleteConfirm = false;
  let showShareModal = false;

  // Get list info if note has a listId
  $: list = note.listId 
    ? $listsStore.items.find(l => l._id === note.listId)
    : null;



  async function handleArchiveToggle(e: Event) {
    e.stopPropagation();
    try {
      await notesStore.toggleArchive(note._id, !note.isArchived);
    } catch (error) {
      console.error('Failed to toggle archive:', error);
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
      await notesStore.delete(note._id);
    } catch (error) {
      console.error('Failed to delete note:', error);
      isDeleting = false;
      showDeleteConfirm = false;
    }
  }

  function handleClick() {
    goto(`/notes/${note._id}`);
  }

  function cancelDelete(e: Event) {
    e.stopPropagation();
    showDeleteConfirm = false;
  }

  function handleShare(e: Event) {
    e.stopPropagation();
    showShareModal = true;
  }

  function closeShareModal() {
    showShareModal = false;
  }
</script>

<div
  class="group relative rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900
         transition-colors duration-150 cursor-pointer
         hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50/60 dark:hover:bg-gray-800/40"
  on:click={handleClick}
  on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
  role="button"
  tabindex="0"
>
  <div class="p-4 sm:p-6">
    <div class="flex flex-col gap-3">
    <!-- Header with title and badges -->
    <div class="flex items-start justify-between gap-2">
      <h3 class="flex items-start gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1 line-clamp-2">
        {#if accentColor}
          <span class="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0 {accentColor.dot}" aria-hidden="true"></span>
        {/if}
        <span>{note.title}</span>
      </h3>
      <div class="flex items-center gap-2">
        <PendingBadge show={$hasPendingChanges} size="sm" />
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

    <!-- Body preview with markdown rendering -->
    {#if note.body}
      <div class="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
        <MarkdownRenderer content={note.body} maxLength={200} />
      </div>
    {/if}

    <!-- Tags -->
    {#if note.tags && Array.isArray(note.tags) && note.tags.length > 0}
      <div class="flex flex-wrap gap-2">
        {#each note.tags as tag}
          <Tag {tag} size="sm" />
        {/each}
      </div>
    {/if}

    <!-- Metadata -->
    <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
      <span>Updated {formatRelativeDate(note.updatedAt)}</span>
    </div>

    <!-- Actions: full-opacity on touch devices, hover/focus-revealed on pointer devices -->
    <div class="flex items-center gap-1 pt-2 -mx-2 border-t border-gray-100 dark:border-gray-800
                opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
      {#if !showDeleteConfirm}
        <button
          on:click={handleShare}
          class="text-sm py-1.5 px-2 min-h-[36px] rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Share note"
        >
          Share
        </button>
        <button
          on:click={handleArchiveToggle}
          class="text-sm py-1.5 px-2 min-h-[36px] rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {note.isArchived ? 'Unarchive' : 'Archive'}
        </button>
        <button
          on:click={handleDelete}
          class="text-sm py-1.5 px-2 min-h-[36px] rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          disabled={isDeleting}
        >
          Delete
        </button>
      {:else}
        <span class="text-sm text-gray-700 dark:text-gray-300 px-2">Delete this note?</span>
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

      {#if note.isArchived}
        <span class="ml-auto text-xs text-gray-400 dark:text-gray-500 px-2">
          Archived
        </span>
      {/if}
    </div>
    </div>
  </div>
</div>

<!-- Share Modal -->
<ShareModal
  bind:open={showShareModal}
  {note}
  onClose={closeShareModal}
/>
