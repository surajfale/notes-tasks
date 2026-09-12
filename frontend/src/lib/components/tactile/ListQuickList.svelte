<script lang="ts">
  /**
   * The lists counterpart to TaskQuickNoteList/NoteQuickList — same
   * drag-to-reorder + flip behavior via the shared dragReorder helper.
   */
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';
  import ListItem from './ListItem.svelte';
  import { createDragReorder } from '$lib/utils/dragReorder.svelte';
  import type { TactileList } from '$lib/types/tactileList';

  interface Props {
    initialLists: TactileList[];
  }

  let { initialLists }: Props = $props();

  // svelte-ignore state_referenced_locally
  let lists = $state<TactileList[]>(initialLists);

  const pinnedCount = $derived(lists.filter((l) => l.pinned).length);

  const drag = createDragReorder<TactileList>(
    () => lists,
    (next) => (lists = next)
  );

  function togglePinned(id: string, pinned: boolean) {
    lists = lists.map((l) => (l.id === id ? { ...l, pinned } : l));
  }

  function updateDescription(id: string, description: string) {
    lists = lists.map((l) => (l.id === id ? { ...l, description } : l));
  }

  function updateColor(id: string, color: string) {
    lists = lists.map((l) => (l.id === id ? { ...l, color } : l));
  }
</script>

<div class="flex flex-col gap-3">
  <p class="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
    {pinnedCount} favorited · {lists.length} total
  </p>

  <ul class="flex flex-col gap-2">
    {#each lists as list (list.id)}
      <li
        data-drag-row
        animate:flip={{ duration: drag.draggingId === list.id ? 0 : 260, easing: quintOut }}
      >
        <ListItem
          {list}
          isDragging={drag.draggingId === list.id}
          dragOffsetY={drag.draggingId === list.id ? drag.dragOffsetY : 0}
          onTogglePinned={togglePinned}
          onDescriptionChange={updateDescription}
          onColorChange={updateColor}
          onDragHandlePointerDown={(e: PointerEvent) => drag.startDrag(list.id, e)}
        />
      </li>
    {/each}
  </ul>
</div>
