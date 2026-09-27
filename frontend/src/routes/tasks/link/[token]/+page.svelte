<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { authStore, currentUser } from '$lib/stores/auth';
  import { listsStore } from '$lib/stores/lists';
  import { readTaskLink } from '$lib/utils/deepLink';
  import '$lib/components/tactile/neumorphic.css';

  // Landing page for the "View Task" button in reminder emails
  // (/tasks/link/<token>). Forwards to the task, via login if needed.
  // Public route (hooks.client.ts PUBLIC_ROUTES) so a logged-out click
  // isn't bounced to a plain /login that forgets where it was going.

  type Outcome = 'forwarding' | 'invalid' | 'other-account';
  let outcome: Outcome = 'forwarding';

  onMount(() => {
    const target = readTaskLink($page.params.token ?? '');
    if (!target) {
      outcome = 'invalid';
      return;
    }

    const taskPath = `/tasks/${target.taskId}`;
    const user = $currentUser;

    if (!user) {
      goto(`/login?redirect=${encodeURIComponent(taskPath)}`, { replaceState: true });
    } else if (user._id === target.userId) {
      goto(taskPath, { replaceState: true });
    } else {
      outcome = 'other-account';
    }
  });

  function switchAccount() {
    const target = readTaskLink($page.params.token ?? '');
    authStore.logout();
    listsStore.reset();
    goto(target ? `/login?redirect=${encodeURIComponent(`/tasks/${target.taskId}`)}` : '/login', { replaceState: true });
  }
</script>

<svelte:head>
  <title>Opening task… · Notes & Tasks</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 px-4">
  <div class="neu-raised w-full max-w-sm p-6 text-center">
    {#if outcome === 'forwarding'}
      <div
        class="mx-auto mb-4 h-8 w-8 rounded-full border-2 border-stone-300 border-t-primary-600 animate-spin"
        aria-hidden="true"
      ></div>
      <p class="text-stone-700 dark:text-stone-300" role="status">Opening your task…</p>
    {:else if outcome === 'invalid'}
      <h1 class="font-serif text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">This link doesn't work</h1>
      <p class="text-sm text-stone-600 dark:text-stone-400 mb-5">
        It may have been cut off when the email was copied. You can still find the task in your list.
      </p>
      <a href="/tasks" class="inline-block px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium">Go to tasks</a>
    {:else}
      <h1 class="font-serif text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">This reminder is for another account</h1>
      <p class="text-sm text-stone-600 dark:text-stone-400 mb-5">
        You're signed in as <strong>{$currentUser?.username}</strong>. To open this task, sign in to the account
        this email was sent to.
      </p>
      <div class="flex flex-col gap-2">
        <button
          type="button"
          on:click={switchAccount}
          class="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium"
        >
          Switch account
        </button>
        <a href="/tasks" class="px-4 py-2 text-sm text-stone-600 dark:text-stone-400">Go to my tasks</a>
      </div>
    {/if}
  </div>
</div>
