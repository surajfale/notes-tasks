<script lang="ts">
  import { listsStore } from '$lib/stores/lists';
  import type { List } from '$lib/types/list';

  export let value: string | undefined = undefined;
  export let label: string = 'List';
  export let placeholder: string = 'Select a list';
  export let disabled: boolean = false;
  export let required: boolean = false;
  export let error: string | undefined = undefined;

  $: lists = Array.isArray($listsStore.items) ? $listsStore.items : [];

  function handleChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    value = target.value || undefined;
  }
</script>

<div class="w-full">
  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    {label}
    {#if required}
      <span class="text-error-500">*</span>
    {/if}
  </label>

  <div class="relative">
    <select
      bind:value
      on:change={handleChange}
      {disabled}
      {required}
      class="w-full px-4 py-2.5 pr-10 rounded-lg border {error
        ? 'border-error-500 focus:ring-error-500 focus:border-error-500'
        : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'} bg-white dark:bg-black text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
    >
      <option value="">{placeholder}</option>
      {#each lists as list (list._id)}
        <option value={list._id}>
          {list.emoji ? `${list.emoji} ` : ''}{list.title}
        </option>
      {/each}
    </select>

    <!-- Custom dropdown arrow -->
    <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
      <svg
        class="w-5 h-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </div>
  </div>

  <!-- Selected list preview -->
  {#if value && !error}
    {@const selectedList = lists.find(l => l._id === value)}
    {#if selectedList}
      <div class="mt-2 flex items-center gap-2 text-sm">
        <span
          class="w-6 h-6 rounded flex items-center justify-center text-xs"
          style="background-color: {selectedList.color}20; color: {selectedList.color}"
        >
          {selectedList.emoji || '📋'}
        </span>
        <span class="text-gray-600 dark:text-gray-400">
          {selectedList.title}
        </span>
      </div>
    {/if}
  {/if}

  <!-- Error message -->
  {#if error}
    <p class="mt-2 text-sm text-error-500">{error}</p>
  {/if}
</div>
