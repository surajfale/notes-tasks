/**
 * Local data shape for the tactile note component (lib/components/tactile/
 * NoteItem.svelte, NoteQuickList.svelte) — mirrors tactileTask.ts's
 * independence from the app's real Note type (types/note.ts). `pinned`
 * is invented for this component set; the production Note model has no
 * such field (it uses isArchived + tags instead).
 */
export interface TactileNote {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
}
