<script lang="ts">
  import { onMount } from 'svelte';

  export let value: string = '';
  export let placeholder: string = 'Enter text...';
  export let label: string = '';
  export let error: string = '';
  export let rows: number = 10;
  // showPreview is kept for external reference
  export const showPreview: boolean = false;
  export let disabled: boolean = false;
  export let maxLength: number | undefined = undefined;
  export let showCharCount: boolean = false;

  // AI Enhancement props
  export let showAiControls: boolean = false;
  export let onEnhance: (() => void) | null = null;
  export let onRevert: (() => void) | null = null;
  export let enhancing: boolean = false;
  export let hasEnhanced: boolean = false;
  export let selectedTone: 'concise' | 'detailed' | 'professional' | 'casual' = 'casual';

  let textareaElement: HTMLTextAreaElement;
  // Existing content (editing a note/task) opens read-first in Preview;
  // an empty draft (creating new) opens in Write since there's nothing to
  // preview yet. One-time initial value — switching tabs afterwards is a
  // deliberate user action, not something we override reactively.
  let activeTab: 'write' | 'preview' = value.trim().length > 0 ? 'preview' : 'write';
  // Secondary formatting (headings, numbered list, link, code) is tucked
  // behind this toggle by default — a handful of always-visible icon
  // buttons with hover-only tooltips is meaningless on a touch screen
  // (tooltips don't fire on tap), so the toolbar leads with only the
  // three most-used actions and lets people opt into the rest.
  let showMoreFormatting = false;
  const textareaId = `markdown-editor-${Math.random().toString(36).substr(2, 9)}`;

  $: charCount = value.length;
  $: isOverLimit = maxLength !== undefined && charCount > maxLength;

  // Markdown formatting functions
  function insertFormatting(before: string, after: string = '') {
    if (!textareaElement) return;

    const start = textareaElement.selectionStart;
    const end = textareaElement.selectionEnd;
    const selectedText = value.substring(start, end);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);

    value = beforeText + before + selectedText + after + afterText;

    // Set cursor position after formatting
    setTimeout(() => {
      const newPos = start + before.length + selectedText.length;
      textareaElement.focus();
      textareaElement.setSelectionRange(newPos, newPos);
    }, 0);
  }

  function makeBold() {
    insertFormatting('**', '**');
  }

  function makeItalic() {
    insertFormatting('*', '*');
  }

  function makeHeading(level: number) {
    const prefix = '#'.repeat(level) + ' ';
    insertFormatting(prefix);
  }

  function makeBulletList() {
    insertFormatting('- ');
  }

  function makeNumberedList() {
    insertFormatting('1. ');
  }

  function makeLink() {
    insertFormatting('[', '](url)');
  }

  function makeCode() {
    insertFormatting('`', '`');
  }

  // Handle Enter key for list continuation
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      const textarea = event.target as HTMLTextAreaElement;
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = value.substring(0, cursorPos);
      const textAfterCursor = value.substring(cursorPos);

      // Get the current line
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines[lines.length - 1];

      // Check if current line is a bullet list item
      const bulletMatch = currentLine.match(/^(\s*)- (.*)$/);
      if (bulletMatch) {
        const indent = bulletMatch[1];
        const content = bulletMatch[2];

        // If the line is empty (just "- "), end the list
        if (content.trim() === '') {
          event.preventDefault();
          // Remove the empty bullet and add a new line
          const newValue = textBeforeCursor.slice(0, -2) + '\n' + textAfterCursor;
          value = newValue;
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = cursorPos - 1;
          }, 0);
          return;
        }

        // Continue the bullet list
        event.preventDefault();
        const newValue = textBeforeCursor + '\n' + indent + '- ' + textAfterCursor;
        value = newValue;
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = cursorPos + indent.length + 3;
        }, 0);
        return;
      }

      // Check if current line is a numbered list item
      const numberMatch = currentLine.match(/^(\s*)(\d+)\. (.*)$/);
      if (numberMatch) {
        const indent = numberMatch[1];
        const currentNumber = parseInt(numberMatch[2]);
        const content = numberMatch[3];

        // If the line is empty (just "1. "), end the list
        if (content.trim() === '') {
          event.preventDefault();
          // Remove the empty number and add a new line
          const removeLength = indent.length + numberMatch[2].length + 2;
          const newValue = textBeforeCursor.slice(0, -removeLength) + '\n' + textAfterCursor;
          value = newValue;
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = cursorPos - removeLength + 1;
          }, 0);
          return;
        }

        // Continue the numbered list with incremented number
        event.preventDefault();
        const nextNumber = currentNumber + 1;
        const newValue = textBeforeCursor + '\n' + indent + nextNumber + '. ' + textAfterCursor;
        value = newValue;
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = cursorPos + indent.length + nextNumber.toString().length + 3;
        }, 0);
        return;
      }
    }
  }

  // Convert markdown table to HTML
  function convertTableToHtml(tableRows: string[]): string {
    if (tableRows.length < 2) return tableRows.join('\n');

    let html = '<table class="min-w-full border-collapse border border-stone-300 dark:border-stone-600 my-4">';

    for (let i = 0; i < tableRows.length; i++) {
      const row = tableRows[i];

      // Skip separator row (contains only |, -, and spaces)
      if (row.match(/^[\|\s\-:]+$/)) continue;

      // Split by | and filter empty cells at start/end
      const cells = row.split('|').map(cell => cell.trim()).filter((cell, idx, arr) => {
        // Keep all cells except first and last if they're empty (from leading/trailing |)
        return !(idx === 0 && cell === '') && !(idx === arr.length - 1 && cell === '');
      });

      // First row is header
      if (i === 0) {
        html += '<thead class="bg-stone-100 dark:bg-stone-800"><tr>';
        cells.forEach(cell => {
          html += `<th class="border border-stone-300 dark:border-stone-600 px-4 py-2 text-left font-semibold">${cell}</th>`;
        });
        html += '</tr></thead><tbody>';
      } else {
        html += '<tr class="hover:bg-stone-50 dark:hover:bg-stone-900">';
        cells.forEach(cell => {
          html += `<td class="border border-stone-300 dark:border-stone-600 px-4 py-2">${cell}</td>`;
        });
        html += '</tr>';
      }
    }

    html += '</tbody></table>';
    return html;
  }

  // Simple markdown to HTML converter
  function markdownToHtml(markdown: string): string {
    if (!markdown) return '';

    let html = markdown;

    // Escape HTML
    html = html.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;');

    // Process tables first (before other formatting)
    const lines = html.split('\n');
    const processedLines: string[] = [];
    let inTable = false;
    let tableRows: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check if line is a table row (contains |)
      if (line.includes('|')) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        tableRows.push(line);

        // Check if next line is not a table row or is the last line
        const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
        if (!nextLine.includes('|') || i === lines.length - 1) {
          // Process the complete table
          processedLines.push(convertTableToHtml(tableRows));
          inTable = false;
          tableRows = [];
        }
      } else {
        processedLines.push(line);
      }
    }

    html = processedLines.join('\n');

    // Headers (must be before bold)
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>');

    // Strikethrough (must be before bold)
    html = html.replace(/~~(.+?)~~/g, '<del class="line-through text-stone-500 dark:text-stone-400">$1</del>');

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');

    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');

    // Inline code
    html = html.replace(/`(.+?)`/g, '<code class="bg-stone-100 dark:bg-stone-700 px-1 py-0.5 rounded text-sm font-mono">$1</code>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary-600 dark:text-primary-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');

    // Process lists line by line to maintain proper structure
    const finalLines = html.split('\n');
    const finalProcessedLines: string[] = [];
    let inUnorderedList = false;
    let inOrderedList = false;

    for (let i = 0; i < finalLines.length; i++) {
      const line = finalLines[i];
      const trimmedLine = line.trim();

      // Skip if line is already HTML (table)
      if (trimmedLine.startsWith('<table') || trimmedLine.startsWith('</table>')) {
        if (inUnorderedList) {
          finalProcessedLines.push('</ul>');
          inUnorderedList = false;
        }
        if (inOrderedList) {
          finalProcessedLines.push('</ol>');
          inOrderedList = false;
        }
        finalProcessedLines.push(line);
        continue;
      }

      // Check for unordered list item
      if (trimmedLine.match(/^- (.+)$/)) {
        const content = trimmedLine.substring(2);
        if (!inUnorderedList) {
          finalProcessedLines.push('<ul class="list-disc list-inside space-y-1 my-2">');
          inUnorderedList = true;
        }
        if (inOrderedList) {
          finalProcessedLines.push('</ol>');
          inOrderedList = false;
          finalProcessedLines.push('<ul class="list-disc list-inside space-y-1 my-2">');
          inUnorderedList = true;
        }
        finalProcessedLines.push(`<li class="ml-4">${content}</li>`);
      }
      // Check for ordered list item
      else if (trimmedLine.match(/^\d+\. (.+)$/)) {
        const content = trimmedLine.replace(/^\d+\. /, '');
        if (!inOrderedList) {
          finalProcessedLines.push('<ol class="list-decimal list-inside space-y-1 my-2">');
          inOrderedList = true;
        }
        if (inUnorderedList) {
          finalProcessedLines.push('</ul>');
          inUnorderedList = false;
          finalProcessedLines.push('<ol class="list-decimal list-inside space-y-1 my-2">');
          inOrderedList = true;
        }
        finalProcessedLines.push(`<li class="ml-4">${content}</li>`);
      }
      // Regular line
      else {
        if (inUnorderedList) {
          finalProcessedLines.push('</ul>');
          inUnorderedList = false;
        }
        if (inOrderedList) {
          finalProcessedLines.push('</ol>');
          inOrderedList = false;
        }
        finalProcessedLines.push(line);
      }
    }

    // Close any open lists
    if (inUnorderedList) {
      finalProcessedLines.push('</ul>');
    }
    if (inOrderedList) {
      finalProcessedLines.push('</ol>');
    }

    html = finalProcessedLines.join('<br>');

    return html;
  }

  $: previewHtml = markdownToHtml(value);
</script>

<div class="space-y-2">
  {#if label}
    <label for={textareaId} class="block text-sm font-medium text-stone-700 dark:text-stone-300">
      {label}
    </label>
  {/if}

  <!-- Toolbar -->
  <div class="border border-stone-300 dark:border-stone-600 rounded-t-lg bg-stone-50 dark:bg-stone-900 p-2">
    <div class="flex items-center gap-1 flex-wrap">
      <!-- Tab switcher -->
      <div class="flex gap-1 mr-2 border-r border-stone-300 dark:border-stone-600 pr-2">
        <button
          type="button"
          on:click={() => activeTab = 'write'}
          disabled={disabled}
          class="px-3 py-1.5 min-h-[36px] text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed {activeTab === 'write' ? 'bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-medium' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'}"
        >
          Write
        </button>
        <button
          type="button"
          on:click={() => activeTab = 'preview'}
          disabled={disabled}
          class="px-3 py-1.5 min-h-[36px] text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed {activeTab === 'preview' ? 'bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-medium' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'}"
        >
          Preview
        </button>
      </div>

      {#if activeTab === 'write'}
        <!-- AI Enhancement Controls: one clearly-labeled action instead of
             an icon-only button — icon-only controls lean on hover
             tooltips, which never fire on a touch screen. -->
        {#if showAiControls && onEnhance}
          <button
            type="button"
            on:click={onEnhance}
            disabled={disabled || enhancing || !value || value.trim().length === 0}
            class="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-sm font-medium rounded-md
                   text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30
                   hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if enhancing}
              <svg class="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Enhancing…
            {:else}
              <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z"/>
              </svg>
              Enhance
            {/if}
          </button>

          {#if hasEnhanced && onRevert}
            <button
              type="button"
              on:click={onRevert}
              disabled={disabled}
              class="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] text-sm rounded-md border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ↶ Revert
            </button>
          {/if}

          <select
            bind:value={selectedTone}
            disabled={disabled || enhancing}
            aria-label="Enhancement tone"
            class="text-xs px-1.5 py-1 rounded border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 text-stone-500 dark:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="casual">Casual</option>
            <option value="professional">Professional</option>
            <option value="concise">Concise</option>
            <option value="detailed">Detailed</option>
          </select>

          <div class="w-px h-6 bg-stone-300 dark:bg-stone-600 mx-1"></div>
        {/if}

        <!-- Core formatting: the three most-used actions, always visible -->
        <button
          type="button"
          on:click={makeBold}
          disabled={disabled}
          aria-label="Bold"
          class="p-2.5 min-h-[40px] min-w-[40px] text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Bold"
        >
          <svg class="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path d="M11 5H7v10h4c2.21 0 4-1.79 4-4s-1.79-4-4-4zm-1 6H9V7h1c1.1 0 2 .9 2 2s-.9 2-2 2z"/>
          </svg>
        </button>

        <button
          type="button"
          on:click={makeItalic}
          disabled={disabled}
          aria-label="Italic"
          class="p-2.5 min-h-[40px] min-w-[40px] text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Italic"
        >
          <svg class="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/>
          </svg>
        </button>

        <button
          type="button"
          on:click={makeBulletList}
          disabled={disabled}
          aria-label="Bullet list"
          class="p-2.5 min-h-[40px] min-w-[40px] text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Bullet list"
        >
          <svg class="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 100 4 2 2 0 000-4zm0 6a2 2 0 100 4 2 2 0 000-4zm0 6a2 2 0 100 4 2 2 0 000-4zm4-11h10v2H8V5zm0 6h10v2H8v-2zm0 6h10v2H8v-2z"/>
          </svg>
        </button>

        <!-- Everything else (headings, numbered list, link, code) lives
             behind this toggle — decluttered by default on every screen
             size, not just mobile. -->
        <button
          type="button"
          on:click={() => (showMoreFormatting = !showMoreFormatting)}
          disabled={disabled}
          aria-expanded={showMoreFormatting}
          aria-label={showMoreFormatting ? 'Fewer formatting options' : 'More formatting options'}
          class="p-2.5 min-h-[40px] min-w-[40px] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                 {showMoreFormatting
                   ? 'bg-stone-200 dark:bg-stone-600 text-stone-900 dark:text-stone-100'
                   : 'text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-600'}"
          title={showMoreFormatting ? 'Fewer options' : 'More formatting'}
        >
          <svg class="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M4 10a2 2 0 114 0 2 2 0 01-4 0zm6 0a2 2 0 114 0 2 2 0 01-4 0zm6 0a2 2 0 114 0 2 2 0 01-4 0z"/>
          </svg>
        </button>
      {/if}
    </div>

    {#if activeTab === 'write' && showMoreFormatting}
      <div class="flex items-center gap-1 flex-wrap mt-2 pt-2 border-t border-stone-200 dark:border-stone-700">
        <button
          type="button"
          on:click={() => makeHeading(1)}
          disabled={disabled}
          class="px-2.5 py-1.5 min-h-[40px] text-sm font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Heading 1"
        >
          H1
        </button>

        <button
          type="button"
          on:click={() => makeHeading(2)}
          disabled={disabled}
          class="px-2.5 py-1.5 min-h-[40px] text-sm font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Heading 2"
        >
          H2
        </button>

        <button
          type="button"
          on:click={() => makeHeading(3)}
          disabled={disabled}
          class="px-2.5 py-1.5 min-h-[40px] text-sm font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Heading 3"
        >
          H3
        </button>

        <div class="w-px h-6 bg-stone-300 dark:bg-stone-600 mx-1"></div>

        <button
          type="button"
          on:click={makeNumberedList}
          disabled={disabled}
          aria-label="Numbered list"
          class="p-2.5 min-h-[40px] min-w-[40px] text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Numbered list"
        >
          <svg class="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4h1v4H3V4zm0 6h1v4H3v-4zm0 6h1v4H3v-4zm4-11h12v2H7V5zm0 6h12v2H7v-2zm0 6h12v2H7v-2z"/>
          </svg>
        </button>

        <div class="w-px h-6 bg-stone-300 dark:bg-stone-600 mx-1"></div>

        <button
          type="button"
          on:click={makeLink}
          disabled={disabled}
          aria-label="Link"
          class="p-2.5 min-h-[40px] min-w-[40px] text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Link"
        >
          <svg class="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"/>
          </svg>
        </button>

        <button
          type="button"
          on:click={makeCode}
          disabled={disabled}
          aria-label="Inline code"
          class="p-2.5 min-h-[40px] min-w-[40px] text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Inline code"
        >
          <svg class="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>
    {/if}
  </div>

  <!-- Editor/Preview area -->
  <div class="relative">
    {#if activeTab === 'write'}
      <textarea
        id={textareaId}
        bind:this={textareaElement}
        bind:value
        {placeholder}
        {rows}
        {disabled}
        maxlength={maxLength}
        class="w-full px-4 py-3 rounded-b-lg border border-t-0 border-stone-300 dark:border-stone-600 transition-colors
               {error
                 ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                 : 'focus:border-primary-500 focus:ring-primary-500'}
               bg-stone-50 dark:bg-stone-950
               text-stone-900 dark:text-stone-100
               placeholder-stone-400 dark:placeholder-stone-500
               focus:outline-none focus:ring-2 focus:ring-offset-0
               disabled:opacity-50 disabled:cursor-not-allowed
               font-sans text-base leading-relaxed"
        on:input
        on:keydown={handleKeyDown}
      />
    {:else}
      <div class="w-full px-4 py-3 rounded-b-lg border border-t-0 border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-950 min-h-[200px]">
        {#if value.trim()}
          <div class="prose prose-sm dark:prose-invert max-w-none text-stone-900 dark:text-stone-100">
            {@html previewHtml}
          </div>
        {:else}
          <p class="text-stone-400 dark:text-stone-500 italic">Nothing to preview</p>
        {/if}
      </div>
    {/if}
  </div>

  {#if error}
    <p class="text-sm text-red-600 dark:text-red-400">{error}</p>
  {/if}

  <!-- Character count -->
  {#if showCharCount && maxLength !== undefined}
    <div class="text-xs text-right" class:text-red-600={isOverLimit} class:dark:text-red-400={isOverLimit} class:text-stone-500={!isOverLimit} class:dark:text-stone-400={!isOverLimit}>
      {charCount} / {maxLength} characters
    </div>
  {/if}
</div>
