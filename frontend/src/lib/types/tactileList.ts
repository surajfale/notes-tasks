/**
 * Local data shape for the tactile list component (lib/components/tactile/
 * ListItem.svelte, ListQuickList.svelte) — same independence-from-the-
 * real-model pattern as tactileTask.ts / tactileNote.ts. `color` is a
 * user-pickable accent (see ListItem's swatch picker), analogous to the
 * real List model's own `color` field.
 */
export interface TactileList {
  id: string;
  title: string;
  description: string;
  color: string;
  pinned: boolean;
}

/** A small, deliberately "funky" palette for the per-list color picker. */
export const LIST_SWATCHES: string[] = [
  '#FF6B6B',
  '#FFA94D',
  '#FFD43B',
  '#69DB7C',
  '#38D9A9',
  '#4DABF7',
  '#748FFC',
  '#DA77F2',
  '#F783AC'
];
