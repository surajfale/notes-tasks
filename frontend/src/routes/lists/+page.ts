import { listsStore } from '$lib/stores/lists';
import { notesStore } from '$lib/stores/notes';
import { tasksStore } from '$lib/stores/tasks';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  // Load all lists, notes, and tasks to show item counts
  await Promise.all([
    listsStore.loadAll(),
    notesStore.loadAll(),
    tasksStore.loadAll()
  ]);

  return {};
};
