<script lang="ts">
  import SyncButton from '$lib/components/sync/SyncButton.svelte';

  export let title: string;
  export let description = '';
  // Mobile-only sync button (replaces pull-to-refresh in the installed app).
  // Off for pages that shouldn't offer it.
  export let showSync = true;
</script>

<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
  <div class="min-w-0 flex items-start justify-between gap-3">
    <div class="min-w-0">
      <h1 class="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-brand-gradient w-fit">
        {title}
      </h1>
      {#if $$slots.description}
        <p class="mt-1.5 text-sm sm:text-base text-stone-500 dark:text-stone-400">
          <slot name="description" />
        </p>
      {:else if description}
        <p class="mt-1.5 text-sm sm:text-base text-stone-500 dark:text-stone-400">
          {description}
        </p>
      {/if}
    </div>

    {#if showSync}
      <SyncButton class="md:hidden" />
    {/if}
  </div>

  {#if $$slots.actions}
    <div class="flex items-center gap-2 sm:gap-3 flex-shrink-0">
      <slot name="actions" />
    </div>
  {/if}
</div>
