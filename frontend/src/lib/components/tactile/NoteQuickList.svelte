<script lang="ts">
  /**
   * The notes counterpart to TaskQuickNoteList — same drag-reorder gesture
   * (shared via dragReorder.svelte.ts) and flip-animated siblings, holding
   * a $state array of TactileNote instead of TactileTask.
   *
   * Known accessibility gap: reordering has no keyboard-driven alternative
   * (only the pointer-driven drag handle) — same caveat as
   * TaskQuickNoteList. Pinning/expanding a note is fully keyboard
   * accessible (Space / Enter via NoteItem + TactilePinButton).
   */
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';
  import NoteItem from './NoteItem.svelte';
  import { createDragReorder } from '$lib/utils/dragReorder.svelte';
  import type { TactileNote } from '$lib/types/tactileNote';

  interface Props {
    initialNotes: TactileNote[];
  }

  let { initialNotes }: Props = $props();

  // Seed once from the prop, then this component owns the array — later
  // changes to initialNotes from the caller are intentionally not tracked.
  // svelte-ignore state_referenced_locally
  let notes = $state<TactileNote[]>(initialNotes);

  const pinnedCount = $derived(notes.filter((n) => n.pinned).length);

  const drag = createDragReorder<TactileNote>(
    () => notes,
    (next) => (notes = next)
  );

  function togglePinned(id: string, pinned: boolean) {
    notes = notes.map((n) => (n.id === id ? { ...n, pinned } : n));
  }

  function updateBody(id: string, body: string) {
    notes = notes.map((n) => (n.id === id ? { ...n, body } : n));
  }
</script>

<div class="flex flex-col gap-3">
  <p class="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
    {pinnedCount} pinned · {notes.length} total
  </p>

  <ul class="flex flex-col gap-2">
    {#each notes as note (note.id)}
      <li
        data-drag-row
        animate:flip={{ duration: drag.draggingId === note.id ? 0 : 260, easing: quintOut }}
      >
        <NoteItem
          {note}
          isDragging={drag.draggingId === note.id}
          dragOffsetY={drag.draggingId === note.id ? drag.dragOffsetY : 0}
          onTogglePinned={togglePinned}
          onBodyChange={updateBody}
          onDragHandlePointerDown={(e: PointerEvent) => drag.startDrag(note.id, e)}
        />
      </li>
    {/each}
  </ul>
</div>
