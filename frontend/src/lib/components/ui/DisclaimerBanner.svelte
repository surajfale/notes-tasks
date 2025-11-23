<script lang="ts">
  import { onMount } from 'svelte';

  let isDismissed = false;

  onMount(() => {
    // Check if user has previously dismissed the banner
    const dismissed = localStorage.getItem('disclaimerDismissed') === 'true';
    isDismissed = dismissed;
  });

  function dismissBanner() {
    isDismissed = true;
    localStorage.setItem('disclaimerDismissed', 'true');
  }
</script>

{#if !isDismissed}
  <div class="sticky top-0 z-40 w-full bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800 shadow-sm">
    <div class="max-w-full px-4 py-3 sm:py-4">
      <div class="flex items-start gap-3 sm:gap-4">
        <!-- Icon -->
        <div class="flex-shrink-0 pt-0.5">
          <svg class="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex flex-col gap-1">
            <h3 class="text-sm sm:text-base font-semibold text-amber-900 dark:text-amber-100">
              Learning Project
            </h3>
            <p class="text-xs sm:text-sm text-amber-800 dark:text-amber-200">
              This is a study and learning project. There is no guarantee that all features will work perfectly or remain available. Use at your own discretion.
            </p>
          </div>
        </div>

        <!-- Close button -->
        <button
          on:click={dismissBanner}
          class="flex-shrink-0 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900"
          aria-label="Dismiss disclaimer"
        >
          <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </div>
{/if}
