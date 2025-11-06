<script lang="ts">
  export let onClick: () => void;
  export let disabled: boolean = false;
  export let loading: boolean = false;
  
  function handleClick() {
    if (!disabled && !loading) {
      onClick();
    }
  }
</script>

<button
  class="lightning-button"
  class:disabled
  class:loading
  on:click={handleClick}
  disabled={disabled || loading}
  title="Enhance with AI"
  aria-label="Enhance content with AI"
  type="button"
>
  {#if loading}
    <span class="spinner" aria-hidden="true">⚡</span>
  {:else}
    <span aria-hidden="true">⚡</span>
  {/if}
</button>

<style>
  .lightning-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    min-height: 44px;
    min-width: 44px;
    background-color: var(--accent-color, #6366f1);
    color: white;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    font-size: 1.25rem;
    transition: all 0.2s ease-in-out;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }
  
  .lightning-button:hover:not(.disabled):not(.loading) {
    background-color: var(--accent-color-dark, #4f46e5);
    transform: scale(1.05);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  
  .lightning-button:active:not(.disabled):not(.loading) {
    transform: scale(0.95);
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }
  
  .lightning-button:focus-visible {
    outline: 2px solid var(--accent-color, #6366f1);
    outline-offset: 2px;
  }
  
  .lightning-button.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: #9ca3af;
  }
  
  .lightning-button.loading {
    cursor: wait;
  }
  
  .spinner {
    display: inline-block;
    animation: pulse 1s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(0.9);
    }
  }
  
  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .lightning-button {
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3);
    }
    
    .lightning-button:hover:not(.disabled):not(.loading) {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
    }
  }
</style>
