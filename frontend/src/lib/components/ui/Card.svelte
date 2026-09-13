<script lang="ts">
  import '$lib/components/tactile/neumorphic.css';

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
    neu-raised
    ${hover || clickable ? 'neu-interactive' : ''}
    ${paddingClasses[padding]}
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
