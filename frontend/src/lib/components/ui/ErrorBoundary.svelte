<script lang="ts">
  import { onMount } from 'svelte';
  import ErrorMessage from './ErrorMessage.svelte';

  export let fallbackTitle: string = 'Something went wrong';
  export let fallbackMessage: string = 'An unexpected error occurred. Please try refreshing the page.';
  export let showRetry: boolean = true;

  let hasError = false;
  let errorDetails: string | null = null;

  onMount(() => {
    // Catch unhandled errors in this component's scope
    const handleError = (event: ErrorEvent) => {
      console.error('Error caught by boundary:', event.error);
      hasError = true;
      errorDetails = event.error?.message || fallbackMessage;
      event.preventDefault();
    };

    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('error', handleError);
    };
  });

  function handleRetry() {
    hasError = false;
    errorDetails = null;
    // Reload the page to reset state
    window.location.reload();
  }
</script>

{#if hasError}
  <div class="p-4">
    <ErrorMessage
      title={fallbackTitle}
      message={errorDetails || fallbackMessage}
      {showRetry}
      on:retry={handleRetry}
    />
  </div>
{:else}
  <slot />
{/if}
