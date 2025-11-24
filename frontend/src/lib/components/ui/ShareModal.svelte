<script lang="ts">
  import { onMount } from 'svelte';
  import Modal from './Modal.svelte';
  import Button from './Button.svelte';
  import NotePreview from '$lib/components/notes/NotePreview.svelte';
  import type { Note } from '$lib/types/note';
  import { formatNoteForWhatsApp, shareText, shareImage } from '$lib/utils/share';
  import { 
    elementToBlob, 
    generateNoteImageFilename, 
    getCurrentTheme,
    getThemeBackgroundColor 
  } from '$lib/utils/imageGenerator';

  export let open: boolean = false;
  export let note: Note;
  export let onClose: () => void;

  let previewElement: HTMLElement;
  let sharingText = false;
  let sharingImage = false;
  let error = '';

  $: formattedText = formatNoteForWhatsApp(note.title, note.body, note.tags);

  async function handleShareAsText() {
    sharingText = true;
    error = '';
    
    try {
      await shareText(formattedText, note.title);
      // Close modal after successful share
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      error = err.message || 'Failed to share as text';
      console.error('Share text error:', err);
    } finally {
      sharingText = false;
    }
  }

  async function handleShareAsImage() {
    if (!previewElement) {
      error = 'Preview not ready. Please try again.';
      return;
    }

    sharingImage = true;
    error = '';

    try {
      const theme = getCurrentTheme();
      const backgroundColor = getThemeBackgroundColor(theme);

      // Generate image from preview element
      const blob = await elementToBlob(previewElement, {
        backgroundColor,
        width: 1200,
        quality: 0.95,
        pixelRatio: 2
      });

      const filename = generateNoteImageFilename(note.title);

      // Share or download the image
      await shareImage(blob, filename, note.title);

      // Close modal after successful share
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      const message = err.message || 'Failed to generate or share image';

      // Don't treat download/clipboard instructions as errors
      if (message.includes('downloaded') || message.includes('copied to clipboard') || message.includes('Share cancelled')) {
        error = message;
        // Auto-close modal after showing success message
        if (message.includes('downloaded') || message.includes('copied to clipboard')) {
          setTimeout(() => {
            onClose();
          }, 3000);
        }
      } else {
        error = message;
        console.error('Share image error:', err);
      }
    } finally {
      sharingImage = false;
    }
  }

  function handleCloseModal() {
    if (!sharingText && !sharingImage) {
      onClose();
    }
  }
</script>

<Modal bind:open title="Share Note" onClose={handleCloseModal} size="lg">
  <div class="space-y-6">
    <!-- Preview Section -->
    <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-[400px] overflow-y-auto">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Preview
      </h3>
      <div bind:this={previewElement}>
        <NotePreview {note} forExport={true} />
      </div>
    </div>

    <!-- Share Options -->
    <div class="space-y-4">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Share via WhatsApp
      </h3>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Share as Text Button -->
        <button
          type="button"
          on:click={handleShareAsText}
          disabled={sharingText || sharingImage}
          class="flex flex-col items-center justify-center gap-3 p-6 rounded-lg border-2 border-gray-300 dark:border-gray-600
                 bg-white dark:bg-gray-900 hover:border-primary-500 dark:hover:border-primary-400
                 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all
                 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg class="w-12 h-12 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div class="text-center">
            <div class="font-semibold text-gray-900 dark:text-gray-100">
              {sharingText ? 'Sharing...' : 'Share as Text'}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Formatted plain text
            </div>
          </div>
        </button>

        <!-- Share as Image Button -->
        <button
          type="button"
          on:click={handleShareAsImage}
          disabled={sharingText || sharingImage}
          class="flex flex-col items-center justify-center gap-3 p-6 rounded-lg border-2 border-gray-300 dark:border-gray-600
                 bg-white dark:bg-gray-900 hover:border-primary-500 dark:hover:border-primary-400
                 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all
                 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg class="w-12 h-12 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div class="text-center">
            <div class="font-semibold text-gray-900 dark:text-gray-100">
              {sharingImage ? 'Generating...' : 'Share as Image'}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Beautiful PNG card
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- Text Preview (collapsible) -->
    <details class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <summary class="cursor-pointer text-sm font-semibold text-gray-700 dark:text-gray-300 select-none">
        View Text Format
      </summary>
      <pre class="mt-3 text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words font-mono bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700">{formattedText}</pre>
    </details>

    <!-- Error/Info Message -->
    {#if error}
      {#if error.includes('downloaded') || error.includes('copied to clipboard') || error.includes('Share cancelled')}
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p class="text-sm text-blue-800 dark:text-blue-200">✓ {error}</p>
        </div>
      {:else}
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p class="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      {/if}
    {/if}

    <!-- Help Text -->
    <div class="text-xs text-gray-500 dark:text-gray-400 space-y-1">
      <p>💡 <strong>Tip:</strong> On mobile, you can choose WhatsApp or other apps to share.</p>
      <p>🖥️ On desktop, the note will open in WhatsApp Web or be downloaded.</p>
    </div>
  </div>

  <svelte:fragment slot="footer">
    <div class="flex justify-end">
      <Button
        type="button"
        variant="secondary"
        on:click={handleCloseModal}
        disabled={sharingText || sharingImage}
      >
        Close
      </Button>
    </div>
  </svelte:fragment>
</Modal>

<style>
  details summary {
    list-style: none;
  }
  
  details summary::-webkit-details-marker {
    display: none;
  }
  
  details summary::after {
    content: ' ▼';
    font-size: 0.75rem;
  }
  
  details[open] summary::after {
    content: ' ▲';
  }
</style>
