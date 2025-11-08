<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let text: string = '';
  export let position: 'top' | 'bottom' | 'left' | 'right' = 'top';
  export let delay: number = 300;

  let showTooltip = false;
  let tooltipElement: HTMLDivElement;
  let triggerElement: HTMLDivElement;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  function handleMouseEnter() {
    timeoutId = setTimeout(() => {
      showTooltip = true;
    }, delay);
  }

  function handleMouseLeave() {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    showTooltip = false;
  }

  function handleFocus() {
    showTooltip = true;
  }

  function handleBlur() {
    showTooltip = false;
  }

  onDestroy(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });

  // Position classes based on position prop
  $: positionClasses = (() => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  })();

  // Arrow classes based on position prop
  $: arrowClasses = (() => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900 dark:border-t-gray-700';
      case 'bottom':
        return 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900 dark:border-b-gray-700';
      case 'left':
        return 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900 dark:border-l-gray-700';
      case 'right':
        return 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900 dark:border-r-gray-700';
      default:
        return 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900 dark:border-t-gray-700';
    }
  })();
</script>

<div
  bind:this={triggerElement}
  class="relative inline-block"
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  on:focus={handleFocus}
  on:blur={handleBlur}
  role="tooltip"
>
  <!-- Trigger content (slot) -->
  <slot />

  <!-- Tooltip -->
  {#if showTooltip && text}
    <div
      bind:this={tooltipElement}
      class="absolute z-50 px-3 py-2 text-xs sm:text-sm font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg whitespace-nowrap pointer-events-none {positionClasses}"
      role="tooltip"
      aria-hidden={!showTooltip}
    >
      {text}
      <!-- Arrow -->
      <div class="absolute w-0 h-0 border-4 {arrowClasses}"></div>
    </div>
  {/if}
</div>
