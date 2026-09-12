<script lang="ts">
  import TaskQuickNoteList from '$lib/components/tactile/TaskQuickNoteList.svelte';
  import NoteQuickList from '$lib/components/tactile/NoteQuickList.svelte';
  import { audioMuted, toggleAudioMute } from '$lib/utils/audioFeedback';
  import type { TactileTask } from '$lib/types/tactileTask';
  import type { TactileNote } from '$lib/types/tactileNote';

  const seedTasks: TactileTask[] = [
    { id: 'task-1', title: 'Ship the tactile checkbox spring physics', note: '', completed: false },
    {
      id: 'task-2',
      title: 'Wire up the synthesized completion click',
      note: 'Sine sweep 800→1400Hz, ~15ms, fast gain decay.',
      completed: false
    },
    { id: 'task-3', title: 'Reorder items with drag + flip', note: '', completed: false },
    { id: 'task-4', title: 'Review with the design team', note: 'Compare against Things 3 and Linear.', completed: true }
  ];

  const seedNotes: TactileNote[] = [
    {
      id: 'note-1',
      title: 'Interaction notes',
      body: 'Spring stiffness 0.5 / damping 0.65 feels closest to Things 3.',
      pinned: true
    },
    { id: 'note-2', title: 'Palette', body: 'Zinc throughout — no accent color needed for this one.', pinned: false },
    { id: 'note-3', title: 'Follow-up', body: '', pinned: false }
  ];
</script>

<svelte:head>
  <title>Tactile Task List</title>
</svelte:head>

<div class="min-h-screen bg-zinc-50 px-4 py-10 dark:bg-zinc-900 sm:px-6">
  <div class="mx-auto max-w-4xl">
    <div class="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Tactile Task &amp; Quick-Note</h1>
        <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Click a checkbox/pin, click a title to expand, drag the grip handle to reorder.
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

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <section>
        <h2 class="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Tasks</h2>
        <TaskQuickNoteList initialTasks={seedTasks} />
      </section>

      <section>
        <h2 class="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Notes</h2>
        <NoteQuickList initialNotes={seedNotes} />
      </section>
    </div>
  </div>
</div>
