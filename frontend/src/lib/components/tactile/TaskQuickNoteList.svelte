<script lang="ts">
  /**
   * Owns the task array; drag-to-reorder gesture math is shared with
   * NoteQuickList via dragReorder.svelte.ts. The dragged row's own
   * transform follows the pointer directly (see TaskItem's dragOffsetY),
   * while displaced siblings reorder via svelte/animate's `flip`.
   *
   * Known accessibility gap: reordering has no keyboard-driven alternative
   * (only the pointer-driven drag handle). Completing/expanding a task is
   * fully keyboard accessible (Space / Enter via TaskItem + TactileCheckbox).
   */
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';
  import TaskItem from './TaskItem.svelte';
  import { createDragReorder } from '$lib/utils/dragReorder.svelte';
  import type { TactileTask } from '$lib/types/tactileTask';

  interface Props {
    initialTasks: TactileTask[];
  }

  let { initialTasks }: Props = $props();

  // Seed once from the prop, then this component owns the array — later
  // changes to initialTasks from the caller are intentionally not tracked.
  // svelte-ignore state_referenced_locally
  let tasks = $state<TactileTask[]>(initialTasks);

  const remainingCount = $derived(tasks.filter((t) => !t.completed).length);

  const drag = createDragReorder<TactileTask>(
    () => tasks,
    (next) => (tasks = next)
  );

  function toggleComplete(id: string, completed: boolean) {
    tasks = tasks.map((t) => (t.id === id ? { ...t, completed } : t));
  }

  function updateNote(id: string, note: string) {
    tasks = tasks.map((t) => (t.id === id ? { ...t, note } : t));
  }
</script>

<div class="flex flex-col gap-3">
  <p class="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
    {remainingCount} remaining
  </p>

  <ul class="flex flex-col gap-2">
    {#each tasks as task (task.id)}
      <li
        data-drag-row
        animate:flip={{ duration: drag.draggingId === task.id ? 0 : 260, easing: quintOut }}
      >
        <TaskItem
          {task}
          isDragging={drag.draggingId === task.id}
          dragOffsetY={drag.draggingId === task.id ? drag.dragOffsetY : 0}
          onToggleComplete={toggleComplete}
          onNoteChange={updateNote}
          onDragHandlePointerDown={(e: PointerEvent) => drag.startDrag(task.id, e)}
        />
      </li>
    {/each}
  </ul>
</div>
