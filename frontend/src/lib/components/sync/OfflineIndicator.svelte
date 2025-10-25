<!--
  Offline Indicator Component
  
  Displays a visual indicator when the application is offline.
  Shows network status and provides feedback to users about connectivity.
  
  Requirements: 7.5
-->
<script lang="ts">
  import { isOnline } from '$lib/storage/sync';
  import { fade, slide } from 'svelte/transition';
</script>

{#if !$isOnline}
  <div
    class="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 shadow-lg"
    transition:slide={{ duration: 300 }}
  >
    <div class="container mx-auto flex items-center justify-center gap-2">
      <svg
        class="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
        />
      </svg>
      <span class="font-medium">You're offline</span>
      <span class="text-sm opacity-90">Changes will sync when connection is restored</span>
    </div>
  </div>
{/if}

<style>
  /* Ensure the indicator is above all other content */
  :global(body.offline) {
    padding-top: 3rem;
  }
</style>
