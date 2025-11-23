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
  
  // Get color based on first tag (or default if no tags)
  $: cardColor = note.tags && note.tags.length > 0 
    ? (() => {
        const color = getTagColor(note.tags[0]);
        return { bg: color.cardBg || color.bg, border: color.border };
      })()
    : { bg: 'bg-white dark:bg-gray-900', border: 'border-gray-200 dark:border-gray-700' };
  
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
  class="relative rounded-xl border-2 transition-all duration-200 cursor-pointer
         {cardColor.border} {cardColor.bg}
         hover:shadow-lg hover:scale-[1.02]"
  on:click={handleClick}
  on:keydown={(e) => e.key === 'Enter' && handleClick()}
  role="button"
  tabindex="0"
>
  <div class="p-4 sm:p-6">
    <div class="flex flex-col gap-3">
    <!-- Header with title and badges -->
    <div class="flex items-start justify-between gap-2">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1 line-clamp-2">
        {note.title}
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

    <!-- Actions -->
    <div class="flex items-center gap-2 sm:gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
      {#if !showDeleteConfirm}
        <button
          on:click={handleShare}
          class="text-sm sm:text-base py-1 px-2 min-h-[36px] text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          title="Share note"
        >
          Share
        </button>
        <button
          on:click={handleArchiveToggle}
          class="text-sm sm:text-base py-1 px-2 min-h-[36px] text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          {note.isArchived ? 'Unarchive' : 'Archive'}
        </button>
        <button
          on:click={handleDelete}
          class="text-sm sm:text-base py-1 px-2 min-h-[36px] text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
          disabled={isDeleting}
        >
          Delete
        </button>
      {:else}
        <span class="text-sm sm:text-base text-gray-700 dark:text-gray-300">Delete this note?</span>
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
      
      {#if note.isArchived}
        <span class="ml-auto text-xs sm:text-sm text-gray-500 dark:text-gray-500">
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
