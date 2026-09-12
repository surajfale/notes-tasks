<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import PendingBadge from '$lib/components/sync/PendingBadge.svelte';
  import MarkdownRenderer from '$lib/components/ui/MarkdownRenderer.svelte';
  import Tag from '$lib/components/ui/Tag.svelte';
  import ShareModal from '$lib/components/ui/ShareModal.svelte';
  import NoteQuickViewModal from '$lib/components/notes/NoteQuickViewModal.svelte';
  import { notesStore } from '$lib/stores/notes';
  import { listsStore } from '$lib/stores/lists';
  import { isNotePending } from '$lib/stores/syncStatus';
  import { formatRelativeDate } from '$lib/utils/date';
  import { getTagColor } from '$lib/utils/tagColors';
  import type { Note } from '$lib/types/note';
  import '$lib/components/tactile/neumorphic.css';

  export let note: Note;
  
  // A small accent color derived from the first tag, used sparingly (a thin
  // left border) rather than tinting the whole card.
  $: accentColor = note.tags && note.tags.length > 0 ? getTagColor(note.tags[0]) : null;
  
  // Check if this note has pending changes
  $: hasPendingChanges = isNotePending(note._id);

  let isDeleting = false;
  let showDeleteConfirm = false;
  let showShareModal = false;
  let showQuickView = false;
  let quickViewMode: 'preview' | 'edit' = 'preview';

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
    quickViewMode = 'preview';
    showQuickView = true;
  }

  function handleEdit(e: Event) {
    e.stopPropagation();
    quickViewMode = 'edit';
    showQuickView = true;
  }

  function closeQuickView() {
    showQuickView = false;
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
  class="group relative cursor-pointer {note.isArchived ? 'neu-pressed' : 'neu-raised neu-interactive'}"
  on:click={handleClick}
  on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
  role="button"
  tabindex="0"
>
  <div class="p-4 sm:p-6">
    <div class="flex flex-col gap-3">
    <!-- Header with title and badges -->
    <div class="flex items-start justify-between gap-2">
      <h3 class="font-serif flex items-start gap-2 text-lg font-semibold text-stone-900 dark:text-stone-100 flex-1 line-clamp-2">
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
      <div class="text-sm text-stone-600 dark:text-stone-400 line-clamp-3">
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
    <div class="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-500">
      <span>Updated {formatRelativeDate(note.updatedAt)}</span>
    </div>

    <!-- Actions: full-opacity on touch devices, hover/focus-revealed on pointer devices -->
    <div class="flex items-center gap-1 pt-2 -mx-2 border-t border-stone-100 dark:border-stone-800
                opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
      {#if !showDeleteConfirm}
        <button
          on:click={handleEdit}
          class="text-sm py-1.5 px-2 min-h-[36px] rounded-md text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          Edit
        </button>
        <button
          on:click={handleShare}
          class="text-sm py-1.5 px-2 min-h-[36px] rounded-md text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          title="Share note"
        >
          Share
        </button>
        <button
          on:click={handleArchiveToggle}
          class="text-sm py-1.5 px-2 min-h-[36px] rounded-md text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
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
        <span class="text-sm text-stone-700 dark:text-stone-300 px-2">Delete this note?</span>
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

      {#if note.isArchived}
        <span class="ml-auto text-xs text-stone-400 dark:text-stone-500 px-2">
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

<!-- Quick view/edit popup -->
<NoteQuickViewModal
  {note}
  bind:open={showQuickView}
  initialMode={quickViewMode}
  onClose={closeQuickView}
/>
