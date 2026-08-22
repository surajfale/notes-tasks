<script lang="ts">
  let className = '';
  export { className as class };
  export let padding: 'none' | 'small' | 'medium' | 'large' = 'medium';
  export let hover = false;
  export let clickable = false;

  const paddingClasses = {
    none: '',
    small: 'p-3 sm:p-4',
    medium: 'p-4 sm:p-6',
    large: 'p-6 sm:p-8'
  };

  $: classes = `
    bg-stone-50 dark:bg-stone-900
    rounded-lg
    border border-stone-200 dark:border-stone-800
    transition-colors duration-150
    ${paddingClasses[padding]}
    ${hover ? 'hover:border-stone-300 dark:hover:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/50' : ''}
    ${clickable ? 'cursor-pointer' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');
</script>

{#if clickable}
  <button
    type="button"
    class={classes}
    on:click
  >
    <slot />
  </button>
{:else}
  <div class={classes}>
    <slot />
  </div>
{/if}
