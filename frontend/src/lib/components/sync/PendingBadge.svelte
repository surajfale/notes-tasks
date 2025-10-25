<!--
  Pending Badge Component
  
  Visual indicator for items with pending changes that haven't been synced yet.
  Displays a small badge on note/task cards to show sync status.
  
  Requirements: 7.5
-->
<script lang="ts">
  import { fade } from 'svelte/transition';

  export let show: boolean = false;
  export let size: 'sm' | 'md' = 'sm';
</script>

{#if show}
  <div
    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
    class:text-xs={size === 'sm'}
    class:text-sm={size === 'md'}
    transition:fade={{ duration: 150 }}
    title="This item has pending changes that will sync when online"
  >
    <svg
      class="animate-pulse"
      class:w-3={size === 'sm'}
      class:h-3={size === 'sm'}
      class:w-4={size === 'md'}
      class:h-4={size === 'md'}
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill-rule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
        clip-rule="evenodd"
      />
    </svg>
    <span class="font-medium">Pending</span>
  </div>
{/if}
