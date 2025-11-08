<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import type { List, CreateListData, UpdateListData } from '$lib/types/list';
  import { validateListForm } from '$lib/utils/validation';

  export let open = false;
  export let list: List | null = null;
  export let isSubmitting = false;

  const dispatch = createEventDispatcher<{
    submit: CreateListData | UpdateListData;
    close: void;
  }>();

  // Form fields
  let title = '';
  let color = '#3b82f6'; // Default blue
  let emoji = '';
  let formError = '';

  // Predefined color palette
  const colorPalette = [
    '#ef4444', // red
    '#f97316', // orange
    '#f59e0b', // amber
    '#eab308', // yellow
    '#84cc16', // lime
    '#22c55e', // green
    '#10b981', // emerald
    '#14b8a6', // teal
    '#06b6d4', // cyan
    '#0ea5e9', // sky
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#a855f7', // purple
    '#d946ef', // fuchsia
    '#ec4899', // pink
    '#f43f5e', // rose
    '#64748b'  // slate
  ];

  // Common emojis for lists
  const emojiOptions = [
    '📝', '✅', '📌', '⭐', '🎯', '💡', '📚', '🏠', '💼', '🎨',
    '🎵', '🏃', '🍔', '✈️', '💰', '🎓', '🔧', '🎮', '📱', '🌟'
  ];

  // Update form when list prop changes
  $: if (list) {
    title = list.title;
    color = list.color;
    emoji = list.emoji || '';
  } else {
    title = '';
    color = '#3b82f6';
    emoji = '';
  }

  $: isEditing = !!list;

  function validateForm(): boolean {
    const result = validateListForm({ title, color });
    
    if (!result.isValid) {
      // Combine all errors into a single message
      formError = Object.values(result.errors).join(', ');
      return false;
    }
    
    formError = '';
    return true;
  }

  function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    const data: CreateListData | UpdateListData = {
      title: title.trim(),
      color,
      emoji: emoji || undefined
    };

    dispatch('submit', data);
  }

  function handleClose() {
    formError = '';
    dispatch('close');
  }

  function selectColor(selectedColor: string) {
    color = selectedColor;
  }

  function selectEmoji(selectedEmoji: string) {
    emoji = selectedEmoji;
  }

  function clearEmoji() {
    emoji = '';
  }
</script>

<Modal 
  bind:open 
  title={isEditing ? 'Edit List' : 'Create List'}
  onClose={handleClose}
>
  <form on:submit|preventDefault={handleSubmit} class="space-y-6">
    <!-- Title -->
    <Input
      label="Title"
      type="text"
      bind:value={title}
      placeholder="Enter list title"
      required
      disabled={isSubmitting}
    />

    <!-- Emoji Selector -->
    <div>
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Emoji (optional)
      </label>
      <div class="flex items-center gap-2 mb-3">
        <div 
          class="w-12 h-12 rounded-lg flex items-center justify-center text-2xl border-2 border-gray-300 dark:border-gray-600"
          style="background-color: {color}20"
        >
          {#if emoji}
            {emoji}
          {:else}
            <span class="text-gray-400">?</span>
          {/if}
        </div>
        {#if emoji}
          <button
            type="button"
            on:click={clearEmoji}
            class="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
          >
            Clear
          </button>
        {/if}
      </div>
      <div class="grid grid-cols-10 gap-2">
        {#each emojiOptions as emojiOption}
          <button
            type="button"
            on:click={() => selectEmoji(emojiOption)}
            class="w-10 h-10 rounded-lg flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors {emoji === emojiOption ? 'bg-gray-200 dark:bg-gray-600 ring-2 ring-primary-500' : ''}"
          >
            {emojiOption}
          </button>
        {/each}
      </div>
    </div>

    <!-- Color Picker -->
    <div>
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Color
      </label>
      <div class="grid grid-cols-9 gap-2">
        {#each colorPalette as colorOption}
          <button
            type="button"
            on:click={() => selectColor(colorOption)}
            class="w-10 h-10 rounded-lg transition-all {color === colorOption ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-gray-100 scale-110' : 'hover:scale-105'}"
            style="background-color: {colorOption}"
            aria-label="Select color {colorOption}"
          />
        {/each}
      </div>
    </div>

    <!-- Error message -->
    {#if formError}
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
        <p class="text-sm text-red-800 dark:text-red-200">{formError}</p>
      </div>
    {/if}
  </form>

  <svelte:fragment slot="footer">
    <div class="flex items-center justify-end gap-3">
      <Button variant="secondary" on:click={handleClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button variant="primary" on:click={handleSubmit} disabled={isSubmitting}>
        {#if isSubmitting}
          Saving...
        {:else}
          {isEditing ? 'Save Changes' : 'Create List'}
        {/if}
      </Button>
    </div>
  </svelte:fragment>
</Modal>
