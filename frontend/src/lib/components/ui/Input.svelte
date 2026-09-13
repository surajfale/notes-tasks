<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import '$lib/components/tactile/neumorphic.css';

  export let type: 'text' | 'email' | 'password' | 'number' | 'date' | 'search' | 'url' = 'text';
  export let value = '';
  export let label = '';
  export let placeholder = '';
  export let error = '';
  export let hint = '';
  export let required = false;
  export let disabled = false;
  export let id = '';
  export let name = '';
  export let autocomplete: HTMLInputAttributes['autocomplete'] = undefined;

  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  // Touch-friendly input sizing: min-height 44px for mobile (Apple HIG recommendation).
  // neu-pressed gives the inset "carved into the surface" look shared with the
  // tactile textarea/preview toggle in TactileContentDrawer; error state overrides
  // it with a visible red ring since a subtle shadow alone doesn't read as an error.
  $: inputClasses = `w-full px-4 py-3 min-h-[44px] text-base rounded-2xl transition-shadow duration-200
             neu-pressed
             ${error ? 'ring-2 ring-red-500' : ''}
             text-stone-900 dark:text-stone-100
             placeholder-stone-400 dark:placeholder-stone-500
             focus:outline-none focus-visible:ring-2 ${error ? 'focus-visible:ring-red-500' : 'focus-visible:ring-primary-500'}
             disabled:opacity-50 disabled:cursor-not-allowed`;
</script>

<div class="w-full">
  {#if label}
    <label
      for={inputId}
      class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2"
    >
      {label}
      {#if required}
        <span class="text-red-500">*</span>
      {/if}
    </label>
  {/if}

  {#if type === 'text'}
    <input
      type="text"
      {name}
      {placeholder}
      {required}
      {disabled}
      {autocomplete}
      id={inputId}
      bind:value
      class={inputClasses}
      on:input
      on:change
      on:blur
      on:focus
    />
  {:else if type === 'email'}
    <input
      type="email"
      {name}
      {placeholder}
      {required}
      {disabled}
      {autocomplete}
      id={inputId}
      bind:value
      class={inputClasses}
      on:input
      on:change
      on:blur
      on:focus
    />
  {:else if type === 'password'}
    <input
      type="password"
      {name}
      {placeholder}
      {required}
      {disabled}
      {autocomplete}
      id={inputId}
      bind:value
      class={inputClasses}
      on:input
      on:change
      on:blur
      on:focus
    />
  {:else if type === 'number'}
    <input
      type="number"
      {name}
      {placeholder}
      {required}
      {disabled}
      {autocomplete}
      id={inputId}
      bind:value
      class={inputClasses}
      on:input
      on:change
      on:blur
      on:focus
    />
  {:else if type === 'date'}
    <input
      type="date"
      {name}
      {placeholder}
      {required}
      {disabled}
      {autocomplete}
      id={inputId}
      bind:value
      class={inputClasses}
      on:input
      on:change
      on:blur
      on:focus
    />
  {:else if type === 'search'}
    <input
      type="search"
      {name}
      {placeholder}
      {required}
      {disabled}
      {autocomplete}
      id={inputId}
      bind:value
      class={inputClasses}
      on:input
      on:change
      on:blur
      on:focus
    />
  {:else if type === 'url'}
    <input
      type="url"
      {name}
      {placeholder}
      {required}
      {disabled}
      {autocomplete}
      id={inputId}
      bind:value
      class={inputClasses}
      on:input
      on:change
      on:blur
      on:focus
    />
  {/if}

  {#if error}
    <p class="mt-2 text-sm text-red-600 dark:text-red-400">
      {error}
    </p>
  {:else if hint}
    <p class="mt-2 text-sm text-stone-500 dark:text-stone-400">
      {hint}
    </p>
  {/if}
</div>
