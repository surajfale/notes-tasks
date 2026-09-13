<script lang="ts">
  import type { ViewLayout } from '$lib/utils/viewLayout';
  import '$lib/components/tactile/neumorphic.css';

  // Displays the currently-effective layout (persona default, or the
  // user's manual override) and reports a choice back via onChange —
  // the caller owns persisting the override (see routes/notes,
  // routes/tasks +page.svelte).
  export let layout: ViewLayout;
  export let onChange: (layout: ViewLayout) => void;
</script>

<div
  class="neu-pressed inline-flex gap-0.5 p-0.5 flex-shrink-0"
  role="group"
  aria-label="View layout"
>
  <button
    type="button"
    on:click={() => onChange('list')}
    aria-pressed={layout === 'list'}
    title="List view"
    class="flex items-center justify-center w-10 min-h-[36px] rounded-[10px] transition-all
           {layout === 'list'
             ? 'neu-raised-sm text-primary-700 dark:text-primary-300'
             : 'text-stone-500 dark:text-stone-400'}"
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
    class="flex items-center justify-center w-10 min-h-[36px] rounded-[10px] transition-all
           {layout === 'grid'
             ? 'neu-raised-sm text-primary-700 dark:text-primary-300'
             : 'text-stone-500 dark:text-stone-400'}"
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4h6v6H4V4zM14 4h6v6h-6V4zM4 14h6v6H4v-6zM14 14h6v6h-6v-6z" />
    </svg>
  </button>
</div>
