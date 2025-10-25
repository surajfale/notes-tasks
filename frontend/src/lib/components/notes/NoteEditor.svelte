<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { listsStore } from '$lib/stores/lists';
  import type { Note } from '$lib/types/note';

  export let note: Note | null = null;
  export let isSubmitting = false;

  const dispatch = createEventDispatcher<{
    submit: { title: string; body: string; tags: string[]; listId?: string };
    cancel: void;
  }>();

  // Form fields
  let title = note?.title || '';
  let body = note?.body || '';
  let tagsInput = note?.tags?.join(', ') || '';
  let listId = note?.listId || '';

  // Validation errors
  let titleError = '';

  // Parse tags from comma-separated input
  $: tags = tagsInput
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  function validateForm(): boolean {
    titleError = '';

    if (!title.trim()) {
      titleError = 'Title is required';
      return false;
    }

    return true;
  }

  function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    dispatch('submit', {
      title: title.trim(),
      body: body.trim(),
      tags,
      listId: listId || undefined
    });
  }

  function handleCancel() {
    dispatch('cancel');
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="flex flex-col gap-4">
  <!-- Title -->
  <Input
    label="Title"
    type="text"
    bind:value={title}
    error={titleError}
    placeholder="Enter note title"
    required
    disabled={isSubmitting}
  />

  <!-- Body -->
  <div class="flex flex-col gap-1">
    <label for="body" class="text-sm font-medium text-gray-700 dark:text-gray-300">
      Body
    </label>
    <textarea
      id="body"
      bind:value={body}
      placeholder="Enter note content"
      rows="10"
      disabled={isSubmitting}
      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
             focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
             disabled:opacity-50 disabled:cursor-not-allowed
             resize-y"
    />
  </div>

  <!-- Tags -->
  <Input
    label="Tags"
    type="text"
    bind:value={tagsInput}
    placeholder="tag1, tag2, tag3"
    disabled={isSubmitting}
    hint="Separate tags with commas"
  />

  <!-- List Selection -->
  <div class="flex flex-col gap-1">
    <label for="list" class="text-sm font-medium text-gray-700 dark:text-gray-300">
      List (Optional)
    </label>
    <select
      id="list"
      bind:value={listId}
      disabled={isSubmitting}
      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
             focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
             disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <option value="">No list</option>
      {#each $listsStore.items as list}
        <option value={list._id}>
          {#if list.emoji}{list.emoji} {/if}{list.title}
        </option>
      {/each}
    </select>
  </div>

  <!-- Actions -->
  <div class="flex items-center gap-3 pt-4">
    <Button type="submit" variant="primary" disabled={isSubmitting}>
      {isSubmitting ? 'Saving...' : note ? 'Update Note' : 'Create Note'}
    </Button>
    <Button type="button" variant="secondary" on:click={handleCancel} disabled={isSubmitting}>
      Cancel
    </Button>
  </div>
</form>
