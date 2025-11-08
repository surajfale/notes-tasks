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
    bg-white dark:bg-gray-800 
    rounded-xl 
    shadow-md 
    border border-gray-200 dark:border-gray-700
    transition-all duration-200
    ${paddingClasses[padding]}
    ${hover ? 'hover:shadow-lg hover:scale-[1.02]' : ''}
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
