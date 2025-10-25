<script lang="ts">
  import NoteCard from './NoteCard.svelte';
  import type { Note } from '$lib/types/note';

  export let notes: Note[];
  export let emptyMessage = 'No notes found';
  export let layout: 'grid' | 'list' = 'grid';
</script>

{#if notes.length === 0}
  <div class="flex flex-col items-center justify-center py-12 text-center">
    <svg
      class="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
    <p class="text-gray-600 dark:text-gray-400 text-lg">
      {emptyMessage}
    </p>
  </div>
{:else}
  <div
    class={layout === 'grid'
      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
      : 'flex flex-col gap-3'}
  >
    {#each notes as note (note._id)}
      <NoteCard {note} />
    {/each}
  </div>
{/if}
