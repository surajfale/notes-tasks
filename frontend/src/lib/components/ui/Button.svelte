<script lang="ts">
  export let variant: 'primary' | 'secondary' | 'danger' = 'primary';
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let disabled = false;
  export let fullWidth = false;

  // Touch-friendly button sizing: min-height 44px for mobile (Apple HIG recommendation)
  const baseClasses = 'px-4 py-2.5 sm:px-6 sm:py-3 min-h-[44px] rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base';
  
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 active:bg-primary-800',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800'
  };

  $: classes = `${baseClasses} ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''}`;
</script>

<button
  {type}
  {disabled}
  class={classes}
  on:click
>
  <slot />
</button>
