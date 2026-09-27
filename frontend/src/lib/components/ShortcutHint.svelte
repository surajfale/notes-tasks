<script lang="ts">
  export let onOpenCommandPalette: () => void;
</script>

<!--
  Desktop-only hint strip advertising the global keyboard shortcuts
  (⌘K/n/t// — see handleGlobalKeydown in +layout.svelte). Bottom-right so
  it never covers the sidebar's footer. Hidden on mobile, where there's no
  keyboard and the FAB/bottom-nav already cover quick actions.
-->
<div
  class="hidden md:flex items-center gap-3 fixed bottom-4 right-4 z-20 px-3 py-2 rounded-md
         bg-stone-50/95 dark:bg-stone-900/95 border border-stone-200 dark:border-stone-800
         text-xs text-stone-500 dark:text-stone-400 shadow-sm backdrop-blur-sm"
>
  <button
    type="button"
    on:click={onOpenCommandPalette}
    class="flex items-center gap-1 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
  >
    <kbd class="px-1.5 py-0.5 rounded border border-stone-300 dark:border-stone-700 font-mono text-[11px]">⌘K</kbd>
    commands
  </button>
  <span class="flex items-center gap-1">
    <kbd class="px-1.5 py-0.5 rounded border border-stone-300 dark:border-stone-700 font-mono text-[11px]">n</kbd>
    note
  </span>
  <span class="flex items-center gap-1">
    <kbd class="px-1.5 py-0.5 rounded border border-stone-300 dark:border-stone-700 font-mono text-[11px]">t</kbd>
    task
  </span>
  <span class="flex items-center gap-1">
    <kbd class="px-1.5 py-0.5 rounded border border-stone-300 dark:border-stone-700 font-mono text-[11px]">/</kbd>
    search
  </span>
</div>
