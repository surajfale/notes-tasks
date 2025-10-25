<!--
  Sync Status Indicator Component
  
  Displays sync status including:
  - Pending changes count
  - Sync progress during synchronization
  - Error messages for failed sync attempts with retry button
  
  Requirements: 7.5, 7.6
-->
<script lang="ts">
  import { syncService, pendingCount, isSyncing, syncErrors, isOnline } from '$lib/storage/sync';
  import { fade, slide } from 'svelte/transition';
  import { onMount } from 'svelte';

  let showDetails = false;

  onMount(() => {
    // Initialize sync service
    syncService.initialize();
  });

  function handleRetrySync() {
    syncService.clearErrors();
    syncService.sync();
  }

  function toggleDetails() {
    showDetails = !showDetails;
  }
</script>

{#if $pendingCount > 0 || $isSyncing || $syncErrors.length > 0}
  <div class="fixed bottom-4 right-4 z-40 max-w-md" transition:fade={{ duration: 200 }}>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <!-- Main Status Bar -->
      <button
        on:click={toggleDetails}
        class="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors rounded-t-lg"
        class:rounded-b-lg={!showDetails}
      >
        <div class="flex items-center gap-3">
          {#if $isSyncing}
            <!-- Syncing Spinner -->
            <svg
              class="animate-spin h-5 w-5 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <div class="text-left">
              <div class="font-medium text-gray-900 dark:text-white">Syncing...</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                {$pendingCount} {$pendingCount === 1 ? 'change' : 'changes'} pending
              </div>
            </div>
          {:else if $syncErrors.length > 0}
            <!-- Error Icon -->
            <svg
              class="h-5 w-5 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div class="text-left">
              <div class="font-medium text-red-600 dark:text-red-400">Sync Failed</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                {$syncErrors.length} {$syncErrors.length === 1 ? 'error' : 'errors'}
              </div>
            </div>
          {:else if $pendingCount > 0}
            <!-- Pending Icon -->
            <svg
              class="h-5 w-5 text-amber-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div class="text-left">
              <div class="font-medium text-gray-900 dark:text-white">Pending Changes</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                {$pendingCount} {$pendingCount === 1 ? 'change' : 'changes'} waiting to sync
              </div>
            </div>
          {/if}
        </div>

        <!-- Expand/Collapse Icon -->
        <svg
          class="h-5 w-5 text-gray-400 transition-transform"
          class:rotate-180={showDetails}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <!-- Details Panel -->
      {#if showDetails}
        <div class="border-t border-gray-200 dark:border-gray-700" transition:slide={{ duration: 200 }}>
          <div class="px-4 py-3 space-y-3">
            <!-- Error Messages -->
            {#if $syncErrors.length > 0}
              <div class="space-y-2">
                <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sync Errors:
                </div>
                <div class="space-y-1 max-h-40 overflow-y-auto">
                  {#each $syncErrors as error}
                    <div class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                      {error}
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Sync Status Info -->
            <div class="text-sm text-gray-600 dark:text-gray-400">
              {#if !$isOnline}
                <div class="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                    />
                  </svg>
                  <span>Offline - Changes will sync when connection is restored</span>
                </div>
              {:else if $isSyncing}
                <div class="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <svg class="animate-pulse h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span>Synchronizing changes with server...</span>
                </div>
              {:else if $pendingCount > 0}
                <div class="flex items-center gap-2">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Changes will sync automatically</span>
                </div>
              {/if}
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2 pt-2">
              {#if $syncErrors.length > 0 && $isOnline}
                <button
                  on:click={handleRetrySync}
                  class="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors"
                  disabled={$isSyncing}
                >
                  Retry Sync
                </button>
              {/if}
              {#if $pendingCount > 0 && $isOnline && !$isSyncing}
                <button
                  on:click={() => syncService.sync()}
                  class="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-md transition-colors"
                >
                  Sync Now
                </button>
              {/if}
              <button
                on:click={toggleDetails}
                class="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .rotate-180 {
    transform: rotate(180deg);
  }
</style>
