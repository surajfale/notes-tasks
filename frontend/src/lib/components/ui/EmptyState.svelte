<script lang="ts">
  import '$lib/components/tactile/neumorphic.css';

  export let title: string;
  export let description = '';
</script>

<div
  class="neu-pressed flex flex-col items-center justify-center text-center py-16 px-6"
>
  <div
    class="neu-raised-sm flex items-center justify-center w-14 h-14 text-primary-500 dark:text-primary-400 mb-4"
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
