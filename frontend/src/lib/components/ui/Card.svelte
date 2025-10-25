<script lang="ts">
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
  `.trim().replace(/\s+/g, ' ');
</script>

<div
  class={classes}
  on:click
  role={clickable ? 'button' : undefined}
  tabindex={clickable ? 0 : undefined}
  on:keydown={(e) => {
    if (clickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      e.currentTarget.click();
    }
  }}
>
  <slot />
</div>
