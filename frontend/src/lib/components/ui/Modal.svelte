<script lang="ts">
  export let open = false;
  export let title = '';
  export let onClose: (() => void) | undefined = undefined;
  export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  
  $: maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }[size];

  function handleClose() {
    if (onClose) {
      onClose();
    } else {
      open = false;
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && open) {
      handleClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
    on:click={handleBackdropClick}
    role="dialog"
    aria-modal="true"
    aria-labelledby={title ? 'modal-title' : undefined}
  >
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl {maxWidthClass} w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200"
      on:click|stopPropagation
      role="document"
    >
      {#if title}
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 id="modal-title" class="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <button
            type="button"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            on:click={handleClose}
            aria-label="Close modal"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      {/if}
      
      <div class="px-6 py-4 overflow-y-auto flex-1">
        <slot />
      </div>
      
      {#if $$slots.footer}
        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <slot name="footer" />
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes zoom-in {
    from {
      transform: scale(0.95);
    }
    to {
      transform: scale(1);
    }
  }

  .animate-in {
    animation: fade-in 0.2s ease-out, zoom-in 0.2s ease-out;
  }
</style>
