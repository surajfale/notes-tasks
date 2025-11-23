<script lang="ts">
  import MarkdownRenderer from '$lib/components/ui/MarkdownRenderer.svelte';
  import Tag from '$lib/components/ui/Tag.svelte';
  import { formatRelativeDate } from '$lib/utils/date';
  import type { Note } from '$lib/types/note';

  export let note: Note;
  export let forExport: boolean = false;

  // Calculate dimensions for export
  $: exportStyle = forExport ? 'width: 1200px; padding: 60px;' : '';
</script>

<div
  class="note-preview-card bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-2 border-gray-200 dark:border-gray-700"
  style={exportStyle}
>
  <div class="space-y-6">
    <!-- Title -->
    <div class="border-b-4 border-primary-500 dark:border-primary-400 pb-4">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 break-words">
        {note.title}
      </h1>
    </div>

    <!-- Body with markdown rendering -->
    {#if note.body}
      <div class="text-lg text-gray-700 dark:text-gray-300 prose prose-lg dark:prose-invert max-w-none">
        <MarkdownRenderer content={note.body} />
      </div>
    {/if}

    <!-- Tags -->
    {#if note.tags && note.tags.length > 0}
      <div class="flex flex-wrap gap-3 pt-4">
        {#each note.tags as tag}
          <Tag {tag} size="md" />
        {/each}
      </div>
    {/if}

    <!-- Footer with date -->
    <div class="pt-6 border-t-2 border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span class="flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Updated {formatRelativeDate(note.updatedAt)}
        </span>
        
        <!-- App branding for export -->
        {#if forExport}
          <span class="text-primary-600 dark:text-primary-400 font-semibold">
            📝 Notes & Tasks
          </span>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .note-preview-card {
    min-height: 400px;
  }

  /* Ensure proper sizing for export */
  :global(.note-preview-card.export) {
    box-sizing: border-box;
  }

  /* Enhance typography for image export */
  .note-preview-card :global(.markdown-content) {
    line-height: 1.8;
  }

  .note-preview-card :global(h1),
  .note-preview-card :global(h2),
  .note-preview-card :global(h3) {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
  }

  .note-preview-card :global(ul),
  .note-preview-card :global(ol) {
    margin: 1em 0;
  }

  .note-preview-card :global(li) {
    margin: 0.5em 0;
  }

  .note-preview-card :global(code) {
    padding: 0.2em 0.4em;
    border-radius: 3px;
  }

  .note-preview-card :global(strong) {
    font-weight: 600;
  }
</style>
