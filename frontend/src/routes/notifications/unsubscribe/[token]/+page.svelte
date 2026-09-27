<script lang="ts">
  import { page } from '$app/stores';
  import { currentUser } from '$lib/stores/auth';
  import { notificationStore } from '$lib/stores/notifications';
  import { ApiError } from '$lib/types/error';
  import '$lib/components/tactile/neumorphic.css';

  // Landing page for the "unsubscribe" link in reminder email footers
  // (/notifications/unsubscribe/<token>). Public: works signed out.
  //
  // Nothing happens on page load on purpose — email security scanners open
  // every link in a message, so unsubscribing needs this explicit click
  // (which POSTs; the API has no GET that changes anything).

  type Status = 'confirm' | 'working' | 'done' | 'invalid' | 'error';
  let status: Status = 'confirm';

  async function unsubscribe() {
    status = 'working';
    try {
      await notificationStore.unsubscribeByToken($page.params.token ?? '');
      status = 'done';
    } catch (error) {
      status = error instanceof ApiError && error.status === 400 ? 'invalid' : 'error';
    }
  }

  // Where to send people to manage (or undo) this.
  $: settingsHref = $currentUser ? '/settings#notifications' : '/login?redirect=%2Fsettings';
</script>

<svelte:head>
  <title>Reminder emails · Notes & Tasks</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 px-4">
  <div class="neu-raised w-full max-w-sm p-6 text-center">
    {#if status === 'confirm' || status === 'working'}
      <h1 class="font-serif text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">Stop reminder emails?</h1>
      <p class="text-sm text-stone-600 dark:text-stone-400 mb-5">
        You won't get task reminders by email anymore. Browser notifications, if you use them, aren't affected.
      </p>
      <button
        type="button"
        on:click={unsubscribe}
        disabled={status === 'working'}
        class="w-full px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium disabled:opacity-60"
      >
        {status === 'working' ? 'Unsubscribing…' : 'Unsubscribe'}
      </button>
    {:else if status === 'done'}
      <h1 class="font-serif text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">You're unsubscribed</h1>
      <p class="text-sm text-stone-600 dark:text-stone-400 mb-5" role="status">
        Reminder emails are off for your account. You can turn them back on any time in Settings.
      </p>
      <a href={settingsHref} class="inline-block px-4 py-2 rounded-xl neu-raised-sm neu-interactive text-sm font-medium text-primary-700 dark:text-primary-300">
        Notification settings
      </a>
    {:else if status === 'invalid'}
      <h1 class="font-serif text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">This link doesn't work</h1>
      <p class="text-sm text-stone-600 dark:text-stone-400 mb-5" role="alert">
        It may have been cut off when the email was copied. You can turn off reminder emails in Settings instead.
      </p>
      <a href={settingsHref} class="inline-block px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium">Open settings</a>
    {:else}
      <h1 class="font-serif text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">Something went wrong</h1>
      <p class="text-sm text-stone-600 dark:text-stone-400 mb-5" role="alert">
        We couldn't reach the server. Check your connection and try again.
      </p>
      <button type="button" on:click={unsubscribe} class="w-full px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium">
        Try again
      </button>
    {/if}
  </div>
</div>
