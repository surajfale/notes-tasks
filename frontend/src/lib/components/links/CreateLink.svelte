<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { linksStore } from '$lib/stores/links';
  import { listsStore } from '$lib/stores/lists';
  import type { Link } from '$lib/types/link';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  
  const dispatch = createEventDispatcher();
  
  export let link: Link | null = null;
  
  let title = link?.title || '';
  let url = link?.url || '';
  let tagsInput = link?.tags?.join(', ') || '';
  let listId = link?.listId || '';
  let isSubmitting = false;
  let error = '';

  $: tags = tagsInput
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
  
  async function handleSubmit() {
    if (!title.trim() || !url.trim()) {
      error = 'Title and URL are required';
      return;
    }
    
    try {
      // Basic URL validation
      new URL(url);
    } catch (e) {
      error = 'Please enter a valid URL';
      return;
    }
    
    isSubmitting = true;
    error = '';
    
    try {
      if (link) {
        await linksStore.update(link._id, {
          title,
          url,
          tags,
          listId: listId || undefined
        });
      } else {
        await linksStore.create({
          title,
          url,
          tags,
          listId: listId || undefined
        });
      }
      dispatch('success');
      if (!link) resetForm();
    } catch (err: any) {
      error = err.message || 'Failed to create link';
    } finally {
      isSubmitting = false;
    }
  }
  
  function resetForm() {
    title = '';
    url = '';
    tagsInput = '';
    listId = '';
    error = '';
  }
  
  function handleCancel() {
    dispatch('cancel');
  }

  async function handleDelete() {
    if (!link) return;
    
    if (confirm('Are you sure you want to delete this link?')) {
      try {
        await linksStore.delete(link._id);
        dispatch('success');
      } catch (err: any) {
        error = err.message || 'Failed to delete link';
      }
    }
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-6">
  {#if error}
    <div class="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 rounded-lg text-sm">
      {error}
    </div>
  {/if}
  
  <Input
    label="Title"
    id="title"
    bind:value={title}
    placeholder="e.g. Google Search"
    required
  />
  
  <Input
    label="URL"
    id="url"
    type="url"
    bind:value={url}
    placeholder="https://example.com"
    required
  />
  
  <div>
    <label for="list" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      List (Optional)
    </label>
    <select
      id="list"
      bind:value={listId}
      class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
    >
      <option value="">No List</option>
      {#each Array.isArray($listsStore.items) ? $listsStore.items : [] as list}
        <option value={list._id}>
          {list.emoji ? `${list.emoji} ` : ''}{list.title}
        </option>
      {/each}
    </select>
  </div>
  
  <div>
    <Input
      label="Tags"
      id="tags"
      bind:value={tagsInput}
      placeholder="tag1, tag2, tag3"
      hint="Separate tags with commas"
    />
  </div>
  
  <div class="flex justify-between items-center pt-2">
    <div>
      {#if link}
        <Button type="button" variant="danger" on:click={handleDelete} disabled={isSubmitting}>
          Delete Link
        </Button>
      {/if}
    </div>
    <div class="flex gap-3">
      <Button type="button" variant="secondary" on:click={handleCancel} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button type="submit" variant="primary" loading={isSubmitting}>
        {link ? 'Update Link' : 'Create Link'}
      </Button>
    </div>
  </div>
</form>
