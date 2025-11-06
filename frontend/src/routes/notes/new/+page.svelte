<script lang="ts">
  import { goto } from '$app/navigation';
  import { notesStore } from '$lib/stores/notes';
  import { listsStore } from '$lib/stores/lists';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import MarkdownEditor from '$lib/components/ui/MarkdownEditor.svelte';
  import ListSelector from '$lib/components/lists/ListSelector.svelte';

  import { onMount } from 'svelte';
  import { validateNoteForm } from '$lib/utils/validation';
  import { aiRepository } from '$lib/repositories/ai.repository';

  let title = '';
  let body = '';
  let tagsInput = '';
  let listId = '';
  let isSubmitting = false;
  let enhancing = false;
  let enhanceError = '';
  let selectedTone: 'concise' | 'detailed' | 'professional' | 'casual' = 'casual';
  let originalBody = '';
  let hasEnhanced = false;
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

      await notesStore.create({
        title: title.trim(),
        body: body.trim(),
        tags,
        listId: listId || undefined
      });

      // Redirect to notes list on success
      goto('/notes');
    } catch (error) {
      console.error('Failed to create note:', error);
    } finally {
      isSubmitting = false;
    }
  }

  function handleCancel() {
    goto('/notes');
  }

  async function handleEnhance() {
    if (!body || body.trim().length === 0) {
      return;
    }

    enhancing = true;
    enhanceError = '';

    try {
      // Save original content before enhancing
      originalBody = body;
      const enhancedContent = await aiRepository.enhanceContent(body, 'note', selectedTone);
      body = enhancedContent;
      hasEnhanced = true;
    } catch (error: any) {
      enhanceError = error.message || 'Failed to enhance content';
      console.error('AI enhancement error:', error);
    } finally {
      enhancing = false;
    }
  }

  function handleRevert() {
    if (originalBody) {
      body = originalBody;
      hasEnhanced = false;
      enhanceError = '';
    }
  }
</script>

<div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
  <div class="mb-6">
    <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Create Note</h1>
    <p class="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">Add a new note to your collection</p>
  </div>

  <form on:submit={handleSubmit} class="space-y-6">
    <div class="bg-white dark:bg-black rounded-lg shadow-md p-4 sm:p-6 space-y-6">
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
        bind:selectedTone
        placeholder="Enter note content... Supports **bold**, *italic*, # headings, - lists, and more"
        rows={12}
        disabled={enhancing}
        showAiControls={true}
        onEnhance={handleEnhance}
        onRevert={handleRevert}
        {enhancing}
        {hasEnhanced}
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
    </div>

    {#if enhanceError}
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p class="text-red-800 dark:text-red-200">{enhanceError}</p>
      </div>
    {/if}

    {#if $notesStore.error}
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p class="text-red-800 dark:text-red-200">{$notesStore.error}</p>
      </div>
    {/if}

    <div class="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 sm:justify-end">
      <Button
        type="button"
        variant="secondary"
        on:click={handleCancel}
        disabled={isSubmitting}
        fullWidth={false}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        variant="primary"
        disabled={isSubmitting}
        fullWidth={false}
      >
        {isSubmitting ? 'Creating...' : 'Create Note'}
      </Button>
    </div>
  </form>
</div>
