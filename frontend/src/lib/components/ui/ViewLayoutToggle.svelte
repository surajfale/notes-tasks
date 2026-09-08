<script lang="ts">
  import type { ViewLayout } from '$lib/utils/viewLayout';

  // Displays the currently-effective layout (persona default, or the
  // user's manual override) and reports a choice back via onChange —
  // the caller owns persisting the override (see routes/notes,
  // routes/tasks +page.svelte).
  export let layout: ViewLayout;
  export let onChange: (layout: ViewLayout) => void;
</script>

<div
  class="inline-flex rounded-lg border border-stone-200 dark:border-stone-800 overflow-hidden flex-shrink-0"
  role="group"
  aria-label="View layout"
>
  <button
    type="button"
    on:click={() => onChange('list')}
    aria-pressed={layout === 'list'}
    title="List view"
    class="flex items-center justify-center w-10 min-h-[44px] transition-colors
           {layout === 'list'
             ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
             : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/50'}"
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  </button>
  <button
    type="button"
    on:click={() => onChange('grid')}
    aria-pressed={layout === 'grid'}
    title="Grid view"
    class="flex items-center justify-center w-10 min-h-[44px] border-l border-stone-200 dark:border-stone-800 transition-colors
           {layout === 'grid'
             ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
             : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/50'}"
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4h6v6H4V4zM14 4h6v6h-6V4zM4 14h6v6H4v-6zM14 14h6v6h-6v-6z" />
    </svg>
  </button>
</div>
