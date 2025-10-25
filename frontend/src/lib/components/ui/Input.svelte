<script lang="ts">
  export let type: 'text' | 'email' | 'password' | 'number' | 'date' | 'search' = 'text';
  export let value = '';
  export let label = '';
  export let placeholder = '';
  export let error = '';
  export let hint = '';
  export let required = false;
  export let disabled = false;
  export let id = '';
  export let name = '';

  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  // Touch-friendly input sizing: min-height 44px for mobile (Apple HIG recommendation)
  $: inputClasses = `w-full px-4 py-3 min-h-[44px] text-base rounded-lg border transition-colors duration-200
             ${error 
               ? 'border-red-500 focus:border-red-600 focus:ring-red-500' 
               : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500'}
             bg-white dark:bg-gray-800 
             text-gray-900 dark:text-gray-100
             placeholder-gray-400 dark:placeholder-gray-500
             focus:outline-none focus:ring-2 focus:ring-offset-0
             disabled:opacity-50 disabled:cursor-not-allowed`;
</script>

<div class="w-full">
  {#if label}
    <label
      for={inputId}
      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
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
    <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
      {hint}
    </p>
  {/if}
</div>
