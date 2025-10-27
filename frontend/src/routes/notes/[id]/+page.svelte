<script lang="ts">
  import { goto } from '$app/navigation';
  import { notesStore } from '$lib/stores/notes';
  import { listsStore } from '$lib/stores/lists';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import MarkdownEditor from '$lib/components/ui/MarkdownEditor.svelte';
  import ListSelector from '$lib/components/lists/ListSelector.svelte';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import { validateNoteForm } from '$lib/utils/validation';
  import { formatRelativeDate, formatAbsoluteDateTime } from '$lib/utils/date';

  export let data: PageData;

  let title = data.note.title;
  let body = data.note.body;
  let tagsInput = data.note.tags.join(', ');
  let listId = data.note.listId || '';
  let isArchived = data.note.isArchived;
  let isSubmitting = false;
  let showDeleteModal = false;
  let isDeleting = false;
  let errors: { title?: string; body?: string } = {};

  $: lists = Array.isArray($listsStore.items) ? $listsStore.items : [];

  onMount(() => {
    // Load lists if not already loaded
    if (lists.length === 0) {
      listsStore.loadAll();
    }
  });

  function validateForm(): boolean {
    const result = validateNoteForm({ title, body });
    errors = result.errors;
    return result.isValid;
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    isSubmitting = true;

    try {
      // Parse tags from comma-separated input
      const tags = tagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      await notesStore.update(data.note._id, {
        title: title.trim(),
        body: body.trim(),
        tags,
        listId: listId || undefined
      });

      // Redirect to notes list on success
      goto('/notes');
    } catch (error) {
      console.error('Failed to update note:', error);
    } finally {
      isSubmitting = false;
    }
  }

  async function handleToggleArchive() {
    isSubmitting = true;
    try {
      await notesStore.toggleArchive(data.note._id, !isArchived);
      isArchived = !isArchived;
    } catch (error) {
      console.error('Failed to toggle archive:', error);
    } finally {
      isSubmitting = false;
    }
  }

  function openDeleteModal() {
    showDeleteModal = true;
  }

  function closeDeleteModal() {
    showDeleteModal = false;
  }

  async function handleDelete() {
    isDeleting = true;
    try {
      await notesStore.delete(data.note._id);
      goto('/notes');
    } catch (error) {
      console.error('Failed to delete note:', error);
      isDeleting = false;
      closeDeleteModal();
    }
  }

  function handleCancel() {
    goto('/notes');
  }
</script>

<div class="max-w-4xl mx-auto p-6">
  <div class="mb-6">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Edit Note</h1>
    <div class="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
      <span>Last updated {formatRelativeDate(data.note.updatedAt)}</span>
      <span class="text-gray-400 dark:text-gray-600">•</span>
      <span title={formatAbsoluteDateTime(data.note.createdAt)}>Created {formatRelativeDate(data.note.createdAt)}</span>
    </div>
  </div>

  <form on:submit={handleSubmit} class="space-y-6">
    <div class="bg-white dark:bg-black rounded-lg shadow-md p-6 space-y-6">
      <Input
        type="text"
        label="Title"
        bind:value={title}
        placeholder="Enter note title"
        required
        error={errors.title}
        disabled={isSubmitting}
      />

      <MarkdownEditor
        label="Body"
        bind:value={body}
        placeholder="Enter note content... Supports **bold**, *italic*, # headings, - lists, and more"
        rows={12}
      />

      <Input
        type="text"
        label="Tags"
        bind:value={tagsInput}
        placeholder="Enter tags separated by commas (e.g., work, important)"
        disabled={isSubmitting}
      />

      <ListSelector
        bind:value={listId}
        label="List (Optional)"
        placeholder="No list"
        disabled={isSubmitting}
      />

      <div class="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <input
          type="checkbox"
          id="isArchived"
          checked={isArchived}
          disabled={isSubmitting}
          class="w-5 h-5 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 focus:ring-2"
          on:change={handleToggleArchive}
        />
        <label
          for="isArchived"
          class="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Archived
        </label>
      </div>
    </div>

    {#if $notesStore.error}
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p class="text-red-800 dark:text-red-200">{$notesStore.error}</p>
      </div>
    {/if}

    <div class="flex gap-4 justify-between">
      <Button
        type="button"
        variant="danger"
        on:click={openDeleteModal}
        disabled={isSubmitting}
      >
        Delete
      </Button>
      
      <div class="flex gap-4">
        <Button
          type="button"
          variant="secondary"
          on:click={handleCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  </form>
</div>

<!-- Delete Confirmation Modal -->
<Modal
  bind:open={showDeleteModal}
  title="Delete Note"
  onClose={closeDeleteModal}
>
  <p class="text-gray-700 dark:text-gray-300">
    Are you sure you want to delete this note? This action cannot be undone.
  </p>
  
  <svelte:fragment slot="footer">
    <div class="flex gap-4 justify-end">
      <Button
        type="button"
        variant="secondary"
        on:click={closeDeleteModal}
        disabled={isDeleting}
      >
        Cancel
      </Button>
      <Button
        type="button"
        variant="danger"
        on:click={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? 'Deleting...' : 'Delete'}
      </Button>
    </div>
  </svelte:fragment>
</Modal>
