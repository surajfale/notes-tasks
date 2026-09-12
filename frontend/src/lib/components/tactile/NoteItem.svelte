<script lang="ts">
  /**
   * The notes counterpart to TaskItem — same card shell, drag handle,
   * expandable drawer and physics, but no completion state. Pinning
   * (TactilePinButton) stands in for the checkbox, and the "state changed"
   * visual is a left accent + tint rather than a strikethrough, since
   * strikethrough has no sensible meaning for a note.
   */
  import type { Snippet } from 'svelte';
  import { slide } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import TactilePinButton from './TactilePinButton.svelte';
  import type { TactileNote } from '$lib/types/tactileNote';

  interface BodyEditorProps {
    body: string;
    onChange: (value: string) => void;
  }

  interface Props {
    note: TactileNote;
    isDragging?: boolean;
    dragOffsetY?: number;
    onTogglePinned: (id: string, pinned: boolean) => void;
    onBodyChange: (id: string, body: string) => void;
    onDragHandlePointerDown: (e: PointerEvent) => void;
    bodyEditor?: Snippet<[BodyEditorProps]>;
  }

  let {
    note,
    isDragging = false,
    dragOffsetY = 0,
    onTogglePinned,
    onBodyChange,
    onDragHandlePointerDown,
    bodyEditor
  }: Props = $props();

  let isExpanded = $state(false);

  // Seeded once as an editable draft — note.id is stable for this
  // instance's lifetime since the parent's {#each} block keys on it.
  // svelte-ignore state_referenced_locally
  let localBody = $state(note.body);
  // svelte-ignore state_referenced_locally
  const bodyFieldId = `note-body-${note.id}`;

  function handleBodyChange(value: string) {
    localBody = value;
    onBodyChange(note.id, value);
  }
</script>

<div
  class="group relative flex items-start gap-3 rounded-lg border border-l-4 bg-white p-3 transition-colors duration-300
         dark:bg-zinc-950
         {note.pinned
    ? 'border-zinc-200 border-l-zinc-900 bg-zinc-50 dark:border-zinc-800 dark:border-l-zinc-100 dark:bg-zinc-900/60'
    : 'border-zinc-200 border-l-zinc-200 dark:border-zinc-800 dark:border-l-zinc-800'}"
  style="
    transform: translateY({dragOffsetY}px) scale({isDragging ? 1.02 : 1}) rotate({isDragging ? 1 : 0}deg);
    box-shadow: {isDragging
    ? '0 12px 24px -8px rgb(0 0 0 / 0.25), 0 4px 8px -4px rgb(0 0 0 / 0.15)'
    : 'none'};
    transition: {isDragging ? 'none' : 'transform 200ms ease, box-shadow 200ms ease, border-color 300ms ease, background-color 300ms ease'};
    z-index: {isDragging ? 10 : 1};
  "
>
  <!-- Drag handle: pointer-driven only — see NoteQuickList docs for the
       same known accessibility gap as TaskQuickNoteList. -->
  <button
    type="button"
    aria-label={`Drag to reorder "${note.title}"`}
    class="mt-0.5 flex h-6 w-4 shrink-0 cursor-grab items-center justify-center rounded text-zinc-300
           opacity-0 transition-opacity duration-150 hover:text-zinc-500 focus-visible:opacity-100
           group-hover:opacity-100 active:cursor-grabbing dark:text-zinc-700 dark:hover:text-zinc-400"
    style="touch-action: none;"
    onpointerdown={onDragHandlePointerDown}
  >
    <svg viewBox="0 0 10 16" class="h-4 w-4" fill="currentColor" aria-hidden="true">
      <circle cx="2.5" cy="2.5" r="1.25" />
      <circle cx="7.5" cy="2.5" r="1.25" />
      <circle cx="2.5" cy="8" r="1.25" />
      <circle cx="7.5" cy="8" r="1.25" />
      <circle cx="2.5" cy="13.5" r="1.25" />
      <circle cx="7.5" cy="13.5" r="1.25" />
    </svg>
  </button>

  <div class="pt-0.5">
    <TactilePinButton
      pinned={note.pinned}
      label={note.pinned ? `Unpin "${note.title}"` : `Pin "${note.title}"`}
      onToggle={(next) => onTogglePinned(note.id, next)}
    />
  </div>

  <div class="min-w-0 flex-1">
    <!-- A real <button>: Enter and Space both activate it natively —
         "Enter to edit" needs no manual key handling here. -->
    <button
      type="button"
      class="block w-full rounded text-left focus-visible:outline-none focus-visible:ring-2
             focus-visible:ring-zinc-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
      aria-expanded={isExpanded}
      aria-controls={bodyFieldId}
      onclick={() => (isExpanded = !isExpanded)}
    >
      <span class="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {note.title}
      </span>
      {#if !isExpanded && localBody}
        <span class="mt-0.5 block truncate text-xs text-zinc-500 dark:text-zinc-400">
          {localBody}
        </span>
      {/if}
    </button>

    {#if isExpanded}
      <div id={bodyFieldId} transition:slide={{ duration: 220, easing: cubicOut }} class="overflow-hidden pt-2">
        {#if bodyEditor}
          {@render bodyEditor({ body: localBody, onChange: handleBodyChange })}
        {:else}
          <textarea
            value={localBody}
            oninput={(e) => handleBodyChange(e.currentTarget.value)}
            placeholder="Write a note…"
            rows="3"
            class="w-full resize-none rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-sm text-zinc-700
                   placeholder-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500
                   dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:placeholder-zinc-600"
          ></textarea>
        {/if}
      </div>
    {/if}
  </div>
</div>
