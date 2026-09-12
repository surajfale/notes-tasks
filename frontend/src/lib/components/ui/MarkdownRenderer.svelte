<script lang="ts">
  export let content: string = '';
  export let maxLength: number = 0; // 0 means no truncation
  export let className: string = '';

  // Convert markdown table to HTML
  function convertTableToHtml(tableMarkdown: string): string {
    const lines = tableMarkdown.trim().split('\n');
    if (lines.length < 2) return tableMarkdown;

    // Parse table rows
    const rows = lines.map(line =>
      line.split('|')
        .map(cell => cell.trim())
        .filter(cell => cell.length > 0)
    );

    // Check if second line is separator
    const hasHeaderSeparator = lines[1] && lines[1].includes('---');

    if (!hasHeaderSeparator || rows.length < 2) {
      return tableMarkdown; // Not a valid table
    }

    // Build HTML table. Wrapped in a scrollable div — a table can't be
    // shrunk to fit a narrow (mobile) viewport, so without this wrapper a
    // table with more than a couple columns overflows the page horizontally
    // instead of scrolling within its own bounds.
    let tableHtml = '<div class="overflow-x-auto"><table class="min-w-full border-collapse border border-stone-300 dark:border-stone-600 my-4">';

    // Header row
    tableHtml += '<thead class="bg-stone-100 dark:bg-stone-800"><tr>';
    rows[0].forEach(cell => {
      tableHtml += `<th class="border border-stone-300 dark:border-stone-600 px-4 py-2 text-left font-semibold">${cell}</th>`;
    });
    tableHtml += '</tr></thead>';

    // Body rows (skip header and separator)
    tableHtml += '<tbody>';
    for (let i = 2; i < rows.length; i++) {
      tableHtml += '<tr class="hover:bg-stone-50 dark:hover:bg-stone-800">';
      rows[i].forEach(cell => {
        tableHtml += `<td class="border border-stone-300 dark:border-stone-600 px-4 py-2">${cell}</td>`;
      });
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table></div>';

    return tableHtml;
  }

  // Simple markdown to HTML converter
  function markdownToHtml(markdown: string): string {
    if (!markdown) return '';

    let html = markdown;

    // Truncate if needed
    if (maxLength > 0 && html.length > maxLength) {
      html = html.substring(0, maxLength) + '...';
    }

    // Process tables BEFORE escaping HTML (so we can inject HTML tags).
    // Each row must be followed by a newline OR be at the very end of the
    // string — without the `|$` alternative, a table with no trailing
    // newline (e.g. the last thing typed, before pressing Enter) would
    // lose its final row: it'd fall outside the match entirely and render
    // as raw "| a | b |" text instead of joining the table.
    const tableParts: string[] = [];
    html = html.replace(/(\|.+\|(?:[\r\n]+|$))+/g, (match) => {
      const placeholder = `__TABLE_${tableParts.length}__`;
      tableParts.push(convertTableToHtml(match));
      return placeholder;
    });

    // Escape HTML
    html = html.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;');

    // Headers (must be before bold)
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-base font-semibold mt-2 mb-1">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg font-semibold mt-2 mb-1">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold mt-2 mb-1">$1</h1>');

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');

    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');

    // Inline code
    html = html.replace(/`(.+?)`/g, '<code class="bg-stone-100 dark:bg-stone-700 px-1 py-0.5 rounded text-xs font-mono">$1</code>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary-600 dark:text-primary-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');

    // Process lists line by line to maintain proper structure
    const lines = html.split('\n');
    const processedLines: string[] = [];
    let inUnorderedList = false;
    let inOrderedList = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Check for unordered list item
      if (trimmedLine.match(/^- (.+)$/)) {
        const content = trimmedLine.substring(2);
        if (!inUnorderedList) {
          processedLines.push('<ul class="list-disc list-inside space-y-0.5 my-1">');
          inUnorderedList = true;
        }
        if (inOrderedList) {
          processedLines.push('</ol>');
          inOrderedList = false;
          processedLines.push('<ul class="list-disc list-inside space-y-0.5 my-1">');
          inUnorderedList = true;
        }
        processedLines.push(`<li class="ml-4">${content}</li>`);
      }
      // Check for ordered list item
      else if (trimmedLine.match(/^\d+\. (.+)$/)) {
        const content = trimmedLine.replace(/^\d+\. /, '');
        if (!inOrderedList) {
          processedLines.push('<ol class="list-decimal list-inside space-y-0.5 my-1">');
          inOrderedList = true;
        }
        if (inUnorderedList) {
          processedLines.push('</ul>');
          inUnorderedList = false;
          processedLines.push('<ol class="list-decimal list-inside space-y-0.5 my-1">');
          inOrderedList = true;
        }
        processedLines.push(`<li class="ml-4">${content}</li>`);
      }
      // Regular line
      else {
        if (inUnorderedList) {
          processedLines.push('</ul>');
          inUnorderedList = false;
        }
        if (inOrderedList) {
          processedLines.push('</ol>');
          inOrderedList = false;
        }
        processedLines.push(line);
      }
    }
    
    // Close any open lists
    if (inUnorderedList) {
      processedLines.push('</ul>');
    }
    if (inOrderedList) {
      processedLines.push('</ol>');
    }

    html = processedLines.join('<br>');

    // Restore tables from placeholders
    tableParts.forEach((tableHtml, index) => {
      html = html.replace(`__TABLE_${index}__`, tableHtml);
    });

    return html;
  }

  $: renderedHtml = markdownToHtml(content);
</script>

{#if content}
  <div class="markdown-content {className}">
    {@html renderedHtml}
  </div>
{/if}

<style>
  .markdown-content :global(a) {
    word-break: break-word;
  }

  .markdown-content :global(code) {
    word-break: break-word;
  }

  .markdown-content :global(table) {
    width: 100%;
    border-spacing: 0;
  }

  .markdown-content :global(table th),
  .markdown-content :global(table td) {
    word-break: break-word;
    max-width: 300px;
  }
</style>
