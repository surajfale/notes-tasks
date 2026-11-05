<!--
  Sync Button (mobile)

  Stands in for pull-to-refresh, which app.css disables so an overscroll can't
  reload the installed app mid-edit. One tap:
    1. pushes the pending IndexedDB queue (syncService.sync — lists before notes/tasks),
    2. if that succeeded, reloads to pull fresh server data — same as
       pull-to-refresh did. Pending writes live in IndexedDB, so nothing is lost.
  Offline or on a sync error it does NOT reload: the offline banner /
  SyncStatusIndicator already explain why, and a reload would throw away the view.
  A dot badge shows when local changes are waiting to sync.
-->
<script lang="ts">
  import { get } from 'svelte/store';
  import { syncService, isSyncing, isOnline, pendingCount, syncErrors } from '$lib/storage/sync';
  import '$lib/components/tactile/neumorphic.css';

  let className = '';
  export { className as class };

  // Covers the reload as well as the sync itself, so the spinner keeps going
  // until the page actually goes away.
  let busy = false;

  $: spinning = busy || $isSyncing;
  $: label = !$isOnline
    ? 'Offline — changes are saved on this device'
    : spinning
      ? 'Syncing…'
      : $pendingCount > 0
        ? `Sync ${$pendingCount} pending ${$pendingCount === 1 ? 'change' : 'changes'} and refresh`
        : 'Sync and refresh';

  async function handleSync() {
    if (busy || !$isOnline) return;
    busy = true;
    try {
      syncService.clearErrors();
      await syncService.sync();
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
    if (get(syncErrors).length > 0 || !get(isOnline)) {
      // Leave the error/offline state on screen instead of reloading it away.
      busy = false;
      return;
    }
    navigator.vibrate?.(10);
    // `busy` stays true: the spinner runs until the page unloads.
    location.reload();
  }
</script>

<button
  type="button"
  on:click={handleSync}
  disabled={spinning}
  aria-label={label}
  title={label}
  class="relative inline-flex items-center justify-center w-11 h-11 rounded-full flex-shrink-0
         transition-transform active:scale-95 disabled:opacity-80
         {spinning ? 'neu-pressed' : 'neu-raised'}
         {$isOnline ? 'text-stone-600 dark:text-stone-300' : 'text-amber-600 dark:text-amber-400'}
         {className}"
>
  {#if !$isOnline}
    <!-- Cloud with slash: offline -->
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18M8.5 8.5A4 4 0 007 16h9m3.5-1.5A3.5 3.5 0 0017 9h-.5a5 5 0 00-6.2-3.9" />
    </svg>
  {:else}
    <!-- Circular arrows: sync -->
    <svg class="w-5 h-5" class:animate-spin={spinning} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  {/if}

  {#if $pendingCount > 0 && $isOnline}
    <span class="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-primary-500 ring-2 ring-stone-50 dark:ring-stone-900" aria-hidden="true"></span>
  {/if}
</button>
