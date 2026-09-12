<script lang="ts">
  /**
   * The notes counterpart to TaskItem — same card shell, drag handle,
   * expandable Preview/Edit/AI drawer and physics, but no completion
   * state. Pinning (TactilePinButton) stands in for the checkbox, and the
   * "state changed" visual is a violet left accent + faint tint rather
   * than a strikethrough, since strikethrough has no sensible meaning for
   * a note.
   */
  import type { Snippet } from 'svelte';
  import { slide } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import TactilePinButton from './TactilePinButton.svelte';
  import TactileContentDrawer from './TactileContentDrawer.svelte';
  import type { TactileNote } from '$lib/types/tactileNote';
  import './neumorphic.css';

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
  class="group relative flex items-start gap-3 border-l-4 p-3 transition-colors duration-300
         neu-raised {isDragging ? 'neu-dragging' : ''}
         {note.pinned ? 'note-pinned-tint border-l-violet-500 dark:border-l-violet-400' : 'border-l-transparent'}"
  style="
    transform: translateY({dragOffsetY}px) scale({isDragging ? 1.02 : 1}) rotate({isDragging ? 1 : 0}deg);
    transition: {isDragging ? 'none' : 'transform 200ms ease, box-shadow 200ms ease'};
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
      accent="notes"
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
      <div transition:slide={{ duration: 220, easing: cubicOut }} class="overflow-hidden">
        {#if bodyEditor}
          {@render bodyEditor({ body: localBody, onChange: handleBodyChange })}
        {:else}
          <TactileContentDrawer
            value={localBody}
            onChange={handleBodyChange}
            kind="note"
            accent="notes"
            placeholder="Write a note…"
            fieldId={bodyFieldId}
          />
        {/if}
      </div>
    {/if}
  </div>
</div>
