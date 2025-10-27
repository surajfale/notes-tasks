<script lang="ts">
  export let content: string = '';
  export let maxLength: number = 0; // 0 means no truncation
  export let className: string = '';

  // Simple markdown to HTML converter
  function markdownToHtml(markdown: string): string {
    if (!markdown) return '';

    let html = markdown;

    // Truncate if needed
    if (maxLength > 0 && html.length > maxLength) {
      html = html.substring(0, maxLength) + '...';
    }

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
    html = html.replace(/`(.+?)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-xs font-mono">$1</code>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary-600 dark:text-primary-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');

    // Unordered lists
    html = html.replace(/^\- (.+)$/gim, '<li class="ml-4">$1</li>');
    html = html.replace(/(<li class="ml-4">.*?<\/li>)/gs, '<ul class="list-disc list-inside space-y-0.5 my-1">$1</ul>');

    // Ordered lists
    html = html.replace(/^\d+\. (.+)$/gim, '<li class="ml-4">$1</li>');
    html = html.replace(/(<li class="ml-4">.*?<\/li>)/gs, '<ol class="list-decimal list-inside space-y-0.5 my-1">$1</ol>');

    // Line breaks
    html = html.replace(/\n/g, '<br>');

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
</style>
