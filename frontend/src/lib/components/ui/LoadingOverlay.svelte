<script lang="ts">
  import LoadingSpinner from './LoadingSpinner.svelte';

  export let text: string | null = null;
  export let fullScreen: boolean = false;
</script>

{#if fullScreen}
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
      <LoadingSpinner size="lg" {text} />
    </div>
  </div>
{:else}
  <div class="flex items-center justify-center py-12">
    <LoadingSpinner size="md" {text} />
  </div>
{/if}
