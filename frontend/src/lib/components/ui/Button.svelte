<script lang="ts">
  import '$lib/components/tactile/neumorphic.css';

  export let variant: 'primary' | 'secondary' | 'danger' | 'ghost' = 'primary';
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let disabled = false;
  export let loading = false;
  export let fullWidth = false;

  let className = '';
  export { className as class };

  // Touch-friendly button sizing: min-height 44px for mobile (Apple HIG recommendation)
  const baseClasses = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 min-h-[44px] rounded-2xl font-medium transition-all duration-200 cursor-pointer active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-stone-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 text-sm sm:text-base';

  // Primary/danger stay flat solid color on purpose: neumorphism's soft-shadow
  // illusion needs low, controlled contrast, which a vivid CTA color destroys
  // (see neumorphic.css's design-intent note). Secondary/ghost sit on the
  // neutral surface, so they get the raised/pressed tactile treatment instead.
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 active:bg-primary-800',
    secondary: 'neu-raised-sm neu-interactive text-stone-900 dark:text-stone-100 focus:ring-stone-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800',
    // Plain text-style button (e.g. a "Back" link) — stays flat, matching the
    // same simple hover-bg convention used by the Edit/Delete text buttons in
    // card action rows, rather than a full neumorphic surface.
    ghost: 'bg-transparent text-stone-700 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 focus:ring-stone-400 dark:text-stone-300'
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
