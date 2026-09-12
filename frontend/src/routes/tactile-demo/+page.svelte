<script lang="ts">
  import TaskQuickNoteList from '$lib/components/tactile/TaskQuickNoteList.svelte';
  import { audioMuted, toggleAudioMute } from '$lib/utils/audioFeedback';
  import type { TactileTask } from '$lib/types/tactileTask';

  const seedTasks: TactileTask[] = [
    { id: 'seed-1', title: 'Ship the tactile checkbox spring physics', note: '', completed: false },
    {
      id: 'seed-2',
      title: 'Wire up the synthesized completion click',
      note: 'Sine sweep 800→1400Hz, ~15ms, fast gain decay.',
      completed: false
    },
    { id: 'seed-3', title: 'Reorder items with drag + flip', note: '', completed: false },
    { id: 'seed-4', title: 'Review with the design team', note: 'Compare against Things 3 and Linear.', completed: true }
  ];
</script>

<svelte:head>
  <title>Tactile Task List</title>
</svelte:head>

<div class="min-h-screen bg-zinc-50 px-4 py-10 dark:bg-zinc-900 sm:px-6">
  <div class="mx-auto max-w-lg">
    <div class="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Tactile Task List</h1>
        <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Click a checkbox, click a title to add a note, drag the grip handle to reorder.
        </p>
      </div>
      <button
        type="button"
        onclick={toggleAudioMute}
        aria-pressed={$audioMuted}
        class="flex shrink-0 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs
               font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300
               dark:hover:bg-zinc-900"
      >
        {#if $audioMuted}
          <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 9v6h4l5 5V4L7 9H3z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 9l5 5m0-5l-5 5" />
          </svg>
          Muted
        {:else}
          <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 9v6h4l5 5V4L7 9H3z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 8.5a5 5 0 010 7" />
          </svg>
          Sound on
        {/if}
      </button>
    </div>

    <TaskQuickNoteList initialTasks={seedTasks} />
  </div>
</div>
