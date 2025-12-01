<script lang="ts">
  import { goto } from '$app/navigation';
  import CreateLink from '$lib/components/links/CreateLink.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  function handleSuccess() {
    goto('/links');
  }

  function handleCancel() {
    goto('/links');
  }
</script>

<svelte:head>
  <title>Create Link</title>
</svelte:head>

<div class="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-2xl">
  <div class="mb-6 sm:mb-8">
    <Button variant="ghost" on:click={handleCancel} class="mb-4 pl-0 hover:bg-transparent">
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Back to Links
    </Button>
    <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Create New Link</h1>
  </div>

  <div class="bg-white dark:bg-gray-950 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 p-6 sm:p-8">
    <CreateLink on:success={handleSuccess} on:cancel={handleCancel} />
  </div>
</div>
