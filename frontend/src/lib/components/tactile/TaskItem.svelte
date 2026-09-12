<script lang="ts">
  /**
   * A single tactile task row: checkbox, animated strikethrough, an
   * expandable Preview/Edit/AI drawer, and a drag handle. Drag *tracking*
   * (pointer math, array reorder, flip) lives in the parent
   * TaskQuickNoteList — this component only renders the resulting
   * isDragging/dragOffsetY as a lift/scale/tilt, and reports the handle's
   * pointerdown back up.
   *
   * Neumorphic: the card is a `.neu-raised` surface (neumorphic.css) that
   * deepens into `.neu-dragging` while being dragged; the funky "tasks"
   * accent (coral/pink) only shows up on the checkbox's checked state.
   */
  import type { Snippet } from 'svelte';
  import { slide } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import TactileCheckbox from './TactileCheckbox.svelte';
  import TactileContentDrawer from './TactileContentDrawer.svelte';
  import type { TactileTask } from '$lib/types/tactileTask';
  import './neumorphic.css';

  interface NoteEditorProps {
    note: string;
    onChange: (value: string) => void;
  }

  interface Props {
    task: TactileTask;
    isDragging?: boolean;
    dragOffsetY?: number;
    onToggleComplete: (id: string, completed: boolean) => void;
    onNoteChange: (id: string, note: string) => void;
    onDragHandlePointerDown: (e: PointerEvent) => void;
    noteEditor?: Snippet<[NoteEditorProps]>;
  }

  let {
    task,
    isDragging = false,
    dragOffsetY = 0,
    onToggleComplete,
    onNoteChange,
    onDragHandlePointerDown,
    noteEditor
  }: Props = $props();

  let isExpanded = $state(false);

  // Seeded once as an editable draft (uncontrolled-input style) — task.id
  // is stable for this instance's lifetime since the parent's {#each}
  // block keys on it, so neither of these needs to track later prop changes.
  // svelte-ignore state_referenced_locally
  let localNote = $state(task.note);
  // svelte-ignore state_referenced_locally
  const noteFieldId = `task-note-${task.id}`;

  function handleNoteChange(value: string) {
    localNote = value;
    onNoteChange(task.id, value);
  }
</script>

<div
  class="group relative flex items-start gap-3 p-3 neu-raised {isDragging ? 'neu-dragging' : ''}"
  style="
    transform: translateY({dragOffsetY}px) scale({isDragging ? 1.02 : 1}) rotate({isDragging ? 1 : 0}deg);
    transition: {isDragging ? 'none' : 'transform 200ms ease, box-shadow 200ms ease'};
    z-index: {isDragging ? 10 : 1};
  "
>
  <!-- Drag handle: pointer-driven only. Known gap — no keyboard-accessible
       reorder alternative is provided; see TaskQuickNoteList docs. -->
  <button
    type="button"
    aria-label={`Drag to reorder "${task.title}"`}
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
    <TactileCheckbox
      checked={task.completed}
      accent="tasks"
      label={task.completed ? `Mark "${task.title}" as incomplete` : `Mark "${task.title}" as complete`}
      onToggle={(next) => onToggleComplete(task.id, next)}
    />
  </div>

  <div class="min-w-0 flex-1">
    <!-- A real <button>: Enter and Space both activate it natively, which
         is exactly "Enter to edit" from the spec — no manual key handling
         needed here (compare TactileCheckbox, which has to override the
         default because it wants Space-only). -->
    <button
      type="button"
      class="block w-full rounded text-left focus-visible:outline-none focus-visible:ring-2
             focus-visible:ring-zinc-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
      aria-expanded={isExpanded}
      aria-controls={noteFieldId}
      onclick={() => (isExpanded = !isExpanded)}
    >
      <span
        class="relative inline-block text-sm font-medium text-zinc-900 transition-opacity duration-300 dark:text-zinc-100
               {task.completed ? 'opacity-40' : 'opacity-100'}"
      >
        {task.title}
        <span
          class="pointer-events-none absolute left-0 top-1/2 h-px w-full origin-left -translate-y-1/2 bg-current
                 transition-transform duration-300 ease-out {task.completed ? 'scale-x-100' : 'scale-x-0'}"
        ></span>
      </span>
    </button>

    {#if isExpanded}
      <div transition:slide={{ duration: 220, easing: cubicOut }} class="overflow-hidden">
        {#if noteEditor}
          {@render noteEditor({ note: localNote, onChange: handleNoteChange })}
        {:else}
          <TactileContentDrawer
            value={localNote}
            onChange={handleNoteChange}
            kind="task"
            accent="tasks"
            placeholder="Add a note or subtask…"
            fieldId={noteFieldId}
          />
        {/if}
      </div>
    {/if}
  </div>
</div>
