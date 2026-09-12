<script lang="ts">
  /**
   * A quick-view popup for reading or editing a note without leaving the
   * list page. Opens in Preview (reading) or Edit depending on how it was
   * triggered — NoteCard opens Preview on a card click, Edit on its Edit
   * button. Tags/list assignment stay on the full editor page (linked from
   * here) since this is meant to stay a fast reading/writing surface.
   */
  import Modal from '$lib/components/ui/Modal.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import MarkdownEditor from '$lib/components/ui/MarkdownEditor.svelte';
  import MarkdownRenderer from '$lib/components/ui/MarkdownRenderer.svelte';
  import Tag from '$lib/components/ui/Tag.svelte';
  import { notesStore } from '$lib/stores/notes';
  import { aiRepository } from '$lib/repositories/ai.repository';
  import type { Note } from '$lib/types/note';

  export let note: Note;
  export let open = false;
  export let initialMode: 'preview' | 'edit' = 'preview';
  export let onClose: () => void;

  let mode: 'preview' | 'edit' = initialMode;
  let title = note.title;
  let body = note.body;
  let isSaving = false;
  let saveError = '';
  let titleError = '';

  // AI enhancement state, same pattern as the full note editor pages.
  let enhancing = false;
  let enhanceError = '';
  let selectedTone: 'concise' | 'detailed' | 'professional' | 'casual' = 'casual';
  let originalBody = '';
  let hasEnhanced = false;

  // Reset local edit state whenever the modal is (re)opened, so stale
  // edits from a previously-viewed note don't leak into the next one.
  $: if (open) {
    mode = initialMode;
    title = note.title;
    body = note.body;
    saveError = '';
    titleError = '';
    enhanceError = '';
    hasEnhanced = false;
  }

  async function handleSave() {
    titleError = title.trim() ? '' : 'Title is required';
    if (titleError) return;

    isSaving = true;
    saveError = '';
    try {
      await notesStore.update(note._id, { title: title.trim(), body: body.trim() });
      mode = 'preview';
    } catch (error: any) {
      saveError = error.message || 'Failed to save note';
    } finally {
      isSaving = false;
    }
  }

  function handleCancelEdit() {
    title = note.title;
    body = note.body;
    saveError = '';
    titleError = '';
    mode = 'preview';
  }

  async function handleEnhance() {
    if (!body || body.trim().length === 0) return;

    originalBody = body;
    enhancing = true;
    enhanceError = '';
    try {
      body = await aiRepository.enhanceContent(body, 'note', selectedTone);
      hasEnhanced = true;
    } catch (error: any) {
      body = originalBody;
      enhanceError = error.message || 'Failed to enhance content';
    } finally {
      enhancing = false;
    }
  }

  function handleRevert() {
    if (originalBody) {
      body = originalBody;
      hasEnhanced = false;
    }
  }
</script>

<Modal {open} title={mode === 'edit' ? 'Edit Note' : note.title} {onClose} size="xl">
  {#if mode === 'preview'}
    <div class="flex flex-col gap-4">
      {#if note.tags && note.tags.length > 0}
        <div class="flex flex-wrap gap-2">
          {#each note.tags as tag}
            <Tag {tag} size="sm" />
          {/each}
        </div>
      {/if}
      {#if note.body}
        <MarkdownRenderer content={note.body} className="text-base leading-relaxed" />
      {:else}
        <p class="text-stone-400 dark:text-stone-500 italic">This note is empty.</p>
      {/if}
    </div>
  {:else}
    <div class="flex flex-col gap-4">
      {#if saveError}
        <p class="text-sm text-red-600 dark:text-red-400">{saveError}</p>
      {/if}
      <Input
        label="Title"
        type="text"
        bind:value={title}
        error={titleError}
        required
        disabled={isSaving}
      />
      <MarkdownEditor
        label="Body"
        bind:value={body}
        bind:selectedTone
        placeholder="Start writing..."
        rows={12}
        disabled={isSaving || enhancing}
        showAiControls={true}
        onEnhance={handleEnhance}
        onRevert={handleRevert}
        {enhancing}
        {hasEnhanced}
      />
      {#if enhanceError}
        <p class="text-sm text-red-600 dark:text-red-400">{enhanceError}</p>
      {/if}
      <a
        href="/notes/{note._id}"
        class="text-sm text-primary-600 dark:text-primary-400 hover:underline self-start"
      >
        Need to change tags or list? Open the full editor →
      </a>
    </div>
  {/if}

  <svelte:fragment slot="footer">
    {#if mode === 'preview'}
      <div class="flex justify-end gap-3">
        <Button variant="secondary" on:click={onClose}>Close</Button>
        <Button variant="primary" on:click={() => (mode = 'edit')}>Edit</Button>
      </div>
    {:else}
      <div class="flex justify-end gap-3">
        <Button variant="secondary" on:click={handleCancelEdit} disabled={isSaving}>Cancel</Button>
        <Button variant="primary" on:click={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    {/if}
  </svelte:fragment>
</Modal>
