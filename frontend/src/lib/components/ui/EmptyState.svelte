<script lang="ts">
  export let title: string;
  export let description = '';
</script>

<div
  class="flex flex-col items-center justify-center text-center py-16 px-6 rounded-lg border border-dashed border-stone-200 dark:border-stone-800"
>
  <div
    class="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-500 dark:text-primary-400 mb-4"
  >
    <slot name="icon" />
  </div>
  <h3 class="text-base font-semibold text-stone-900 dark:text-stone-100">
    {title}
  </h3>
  {#if description}
    <p class="mt-1.5 text-sm text-stone-500 dark:text-stone-400 max-w-sm">
      {description}
    </p>
  {/if}
  {#if $$slots.default}
    <div class="mt-6">
      <slot />
    </div>
  {/if}
</div>
