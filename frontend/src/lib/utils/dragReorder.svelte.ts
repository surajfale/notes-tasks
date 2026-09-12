/**
 * Pointer-based drag-to-reorder for a flip-animated list, shared by
 * TaskQuickNoteList and NoteQuickList so the two lists' drag math can't
 * silently diverge. Works uniformly for mouse, touch, and pen (unlike
 * native HTML5 drag-and-drop, which has no reliable touch story).
 *
 * The caller renders each row inside an element carrying
 * `data-drag-row`, applies `animate:flip` to it, and passes the current
 * item array + a setter — this module owns no data, only the gesture.
 */
import { browser } from '$app/environment';

export interface DragReorderController {
  readonly draggingId: string | null;
  readonly dragOffsetY: number;
  startDrag: (id: string, e: PointerEvent) => void;
}

export function createDragReorder<T extends { id: string }>(
  getItems: () => T[],
  setItems: (next: T[]) => void
): DragReorderController {
  let draggingId = $state<string | null>(null);
  let dragOffsetY = $state(0);

  // Gesture-local — read/written only from the pointermove/up handlers,
  // never rendered directly, so these don't need to be reactive.
  let dragStartClientY = 0;
  let dragStartIndex = 0;
  let dragRowHeight = 0;

  function handleMove(e: PointerEvent) {
    if (draggingId === null || dragRowHeight === 0) return;

    dragOffsetY = e.clientY - dragStartClientY;

    const items = getItems();
    const currentIndex = items.findIndex((item) => item.id === draggingId);
    if (currentIndex === -1) return;

    // Once the dragged row has moved more than half a row's height past a
    // neighbor, swap it into that slot — a live, Trello-style reorder.
    const rawShift = Math.round(dragOffsetY / dragRowHeight);
    const targetIndex = Math.min(Math.max(dragStartIndex + rawShift, 0), items.length - 1);

    if (targetIndex !== currentIndex) {
      const next = [...items];
      const [moved] = next.splice(currentIndex, 1);
      next.splice(targetIndex, 0, moved);
      setItems(next);

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
    if (!browser) return;
    window.removeEventListener('pointermove', handleMove);
    window.removeEventListener('pointerup', endDrag);
  }

  function startDrag(id: string, e: PointerEvent) {
    if (!browser) return;
    const handle = e.currentTarget as HTMLElement;
    const row = handle.closest('[data-drag-row]') as HTMLElement | null;
    if (!row) return;

    handle.setPointerCapture(e.pointerId);
    draggingId = id;
    dragOffsetY = 0;
    dragStartClientY = e.clientY;
    dragStartIndex = getItems().findIndex((item) => item.id === id);
    dragRowHeight = row.getBoundingClientRect().height;

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', endDrag);
  }

  return {
    get draggingId() {
      return draggingId;
    },
    get dragOffsetY() {
      return dragOffsetY;
    },
    startDrag
  };
}
