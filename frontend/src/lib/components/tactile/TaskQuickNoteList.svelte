<script lang="ts">
  /**
   * Owns the task array and the drag-to-reorder gesture. Drag tracking is
   * pointer-event based (not native HTML5 drag-and-drop) so it works
   * identically for mouse, touch, and pen: the dragged row's own transform
   * follows the pointer directly (see TaskItem's dragOffsetY), while
   * displaced siblings reorder via svelte/animate's `flip`.
   *
   * Known accessibility gap: reordering has no keyboard-driven alternative
   * (only the pointer-driven drag handle). Completing/expanding a task is
   * fully keyboard accessible (Space / Enter via TaskItem + TactileCheckbox).
   */
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';
  import TaskItem from './TaskItem.svelte';
  import type { TactileTask } from '$lib/types/tactileTask';

  interface Props {
    initialTasks: TactileTask[];
  }

  let { initialTasks }: Props = $props();

  // Seed once from the prop, then this component owns the array — later
  // changes to initialTasks from the caller are intentionally not tracked.
  // svelte-ignore state_referenced_locally
  let tasks = $state<TactileTask[]>(initialTasks);
  let draggingId = $state<string | null>(null);
  let dragOffsetY = $state(0);

  const remainingCount = $derived(tasks.filter((t) => !t.completed).length);

  // Drag-gesture-local (not reactive state — only read/written from the
  // pointermove/up handlers themselves, never rendered directly).
  let dragStartClientY = 0;
  let dragStartIndex = 0;
  let dragRowHeight = 0;

  function toggleComplete(id: string, completed: boolean) {
    tasks = tasks.map((t) => (t.id === id ? { ...t, completed } : t));
  }

  function updateNote(id: string, note: string) {
    tasks = tasks.map((t) => (t.id === id ? { ...t, note } : t));
  }

  function startDrag(id: string, e: PointerEvent) {
    const handle = e.currentTarget as HTMLElement;
    const row = handle.closest('[data-task-row]') as HTMLElement | null;
    if (!row) return;

    handle.setPointerCapture(e.pointerId);
    draggingId = id;
    dragOffsetY = 0;
    dragStartClientY = e.clientY;
    dragStartIndex = tasks.findIndex((t) => t.id === id);
    dragRowHeight = row.getBoundingClientRect().height;

    window.addEventListener('pointermove', handleDragMove);
    window.addEventListener('pointerup', endDrag);
  }

  function handleDragMove(e: PointerEvent) {
    if (draggingId === null || dragRowHeight === 0) return;

    dragOffsetY = e.clientY - dragStartClientY;

    // Once the dragged row has moved more than half a row's height past a
    // neighbor, swap it into that slot — a live, Trello-style reorder.
    const currentIndex = tasks.findIndex((t) => t.id === draggingId);
    const rawShift = Math.round(dragOffsetY / dragRowHeight);
    const targetIndex = Math.min(Math.max(dragStartIndex + rawShift, 0), tasks.length - 1);

    if (targetIndex !== currentIndex) {
      const next = [...tasks];
      const [moved] = next.splice(currentIndex, 1);
      next.splice(targetIndex, 0, moved);
      tasks = next;

      // Re-baseline against the new position so the offset math above
      // stays correct relative to wherever the row physically is now.
      dragStartIndex = targetIndex;
      dragStartClientY = e.clientY;
      dragOffsetY = 0;
    }
  }

  function endDrag() {
    draggingId = null;
    dragOffsetY = 0;
    dragRowHeight = 0;
    window.removeEventListener('pointermove', handleDragMove);
    window.removeEventListener('pointerup', endDrag);
  }
</script>

<div class="flex flex-col gap-3">
  <p class="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
    {remainingCount} remaining
  </p>

  <ul class="flex flex-col gap-2">
    {#each tasks as task (task.id)}
      <li
        data-task-row
        animate:flip={{ duration: draggingId === task.id ? 0 : 260, easing: quintOut }}
      >
        <TaskItem
          {task}
          isDragging={draggingId === task.id}
          dragOffsetY={draggingId === task.id ? dragOffsetY : 0}
          onToggleComplete={toggleComplete}
          onNoteChange={updateNote}
          onDragHandlePointerDown={(e: PointerEvent) => startDrag(task.id, e)}
        />
      </li>
    {/each}
  </ul>
</div>
