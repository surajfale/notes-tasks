/**
 * Small helper for persisting a user's manual grid/list view choice,
 * separately from the persona-driven default (see routes/notes and
 * routes/tasks +page.svelte). A stored value always wins over the
 * persona default once the user has explicitly toggled it.
 */

import { browser } from '$app/environment';

export type ViewLayout = 'grid' | 'list';

export function getStoredLayout(key: string): ViewLayout | null {
  if (!browser) return null;
  const stored = localStorage.getItem(key);
  return stored === 'grid' || stored === 'list' ? stored : null;
}

export function setStoredLayout(key: string, layout: ViewLayout): void {
  if (!browser) return;
  localStorage.setItem(key, layout);
}
