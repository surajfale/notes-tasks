<script lang="ts">
  export let variant: 'primary' | 'secondary' | 'danger' | 'ghost' = 'primary';
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let disabled = false;
  export let loading = false;
  export let fullWidth = false;

  let className = '';
  export { className as class };

  // Touch-friendly button sizing: min-height 44px for mobile (Apple HIG recommendation)
  const baseClasses = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 min-h-[44px] rounded-lg font-medium transition-all duration-200 cursor-pointer active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-stone-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 text-sm sm:text-base';

  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 active:bg-primary-800',
    secondary: 'bg-stone-200 text-stone-900 hover:bg-stone-300 focus:ring-stone-400 dark:bg-stone-700 dark:text-stone-100 dark:hover:bg-stone-600',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800',
    ghost: 'bg-transparent text-stone-700 hover:bg-stone-100 focus:ring-stone-400 dark:text-stone-300 dark:hover:bg-stone-800'
  };

  $: classes = `${baseClasses} ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${className}`;
</script>

<button
  {type}
  disabled={disabled || loading}
  aria-busy={loading}
  class={classes}
  on:click
>
  {#if loading}
    <svg class="animate-spin -ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  {/if}
  <slot />
</button>
