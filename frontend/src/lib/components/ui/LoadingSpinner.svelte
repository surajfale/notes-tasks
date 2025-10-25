<script lang="ts">
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let color: 'primary' | 'white' | 'gray' = 'primary';
  export let text: string | null = null;

  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  const colorClasses = {
    primary: 'border-primary-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-400 border-t-transparent dark:border-gray-500'
  };

  $: spinnerClasses = `${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-spin`;
</script>

<div class="flex flex-col items-center justify-center gap-2">
  <div class={spinnerClasses} role="status" aria-label="Loading">
    <span class="sr-only">Loading...</span>
  </div>
  {#if text}
    <p class="text-sm text-gray-600 dark:text-gray-400">{text}</p>
  {/if}
</div>
