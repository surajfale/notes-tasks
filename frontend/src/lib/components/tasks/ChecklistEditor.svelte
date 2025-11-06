<script lang="ts">
  import type { ChecklistItem } from '$lib/types/task';
  import Button from '$lib/components/ui/Button.svelte';

  export let items: ChecklistItem[] = [];
  export let disabled = false;
  export let markdownDescription: string = '';

  let newItemText = '';

  function addItem() {
    if (!newItemText.trim() || newItemText.length > 255) return;

    const newItem: ChecklistItem = {
      text: newItemText.trim(),
      isCompleted: false,
      order: items.length,
    };

    items = [...items, newItem];
    syncToMarkdown();
    newItemText = '';
  }

  function removeItem(index: number) {
    items = items.filter((_, i) => i !== index);
    // Reorder remaining items
    items = items.map((item, i) => ({ ...item, order: i }));
    syncToMarkdown();
  }

  function toggleItem(index: number) {
    items = items.map((item, i) =>
      i === index ? { ...item, isCompleted: !item.isCompleted } : item
    );
    syncToMarkdown();
  }

  let lastSyncedMarkdown = '';
  let isSyncing = false;

  // Sync checklist items to markdown format
  function syncToMarkdown() {
    if (isSyncing) return;
    
    isSyncing = true;
    
    if (items.length === 0) {
      markdownDescription = '';
      lastSyncedMarkdown = '';
      isSyncing = false;
      return;
    }

    const markdownLines = items.map(item => {
      const checkbox = item.isCompleted ? '[x]' : '[ ]';
      const text = item.isCompleted ? `~~${item.text}~~` : item.text;
      return `- ${checkbox} ${text}`;
    });

    markdownDescription = markdownLines.join('\n');
    lastSyncedMarkdown = markdownDescription;
    isSyncing = false;
  }

  // Parse markdown to checklist items
  function parseMarkdownToChecklist(markdown: string) {
    if (isSyncing) return;
    if (markdown === lastSyncedMarkdown) return;
    
    isSyncing = true;
    
    if (!markdown || markdown.trim().length === 0) {
      items = [];
      lastSyncedMarkdown = '';
      isSyncing = false;
      return;
    }

    const lines = markdown.split('\n');
    const parsedItems: ChecklistItem[] = [];

    for (const line of lines) {
      // Match markdown checkbox format: - [ ] text or - [x] ~~text~~
      const match = line.match(/^-\s*\[([ xX])\]\s*(.+)$/);
      if (match) {
        const isCompleted = match[1].toLowerCase() === 'x';
        let text = match[2].trim();

        // Remove strikethrough markdown if present
        text = text.replace(/^~~(.+)~~$/, '$1');

        // Enforce 255 character limit
        if (text.length > 0 && text.length <= 255) {
          parsedItems.push({
            text: text.substring(0, 255),
            isCompleted,
            order: parsedItems.length,
          });
        }
      }
    }

    if (parsedItems.length > 0) {
      items = parsedItems;
      lastSyncedMarkdown = markdown;
    }
    
    isSyncing = false;
  }

  // Watch for external markdown changes and sync to checklist
  $: if (markdownDescription && markdownDescription !== lastSyncedMarkdown) {
    parseMarkdownToChecklist(markdownDescription);
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    items = newItems.map((item, i) => ({ ...item, order: i }));
  }

  function moveDown(index: number) {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    items = newItems.map((item, i) => ({ ...item, order: i }));
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      addItem();
    }
  }

  $: completedCount = items.filter(item => item.isCompleted).length;
  $: totalCount = items.length;
  $: progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
      Checklist Items
    </label>
    {#if totalCount > 0}
      <span class="text-sm text-gray-500 dark:text-gray-400">
        {completedCount} / {totalCount} completed
      </span>
    {/if}
  </div>

  <!-- Progress bar -->
  {#if totalCount > 0}
    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
      <div
        class="bg-primary-500 h-2 rounded-full transition-all duration-300"
        style="width: {progress}%"
      ></div>
    </div>
  {/if}

  <!-- Add new item -->
  <div class="flex gap-2">
    <input
      type="text"
      bind:value={newItemText}
      on:keydown={handleKeyDown}
      placeholder="Add checklist item (max 255 chars)"
      maxlength="255"
      {disabled}
      class="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
             bg-white dark:bg-black 
             text-gray-900 dark:text-gray-100
             placeholder-gray-400 dark:placeholder-gray-500
             focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
             disabled:opacity-50 disabled:cursor-not-allowed"
    />
    <Button
      type="button"
      variant="secondary"
      on:click={addItem}
      disabled={disabled || !newItemText.trim() || newItemText.length > 255}
    >
      Add
    </Button>
  </div>

  {#if newItemText.length > 0}
    <p class="text-xs text-gray-500 dark:text-gray-400">
      {newItemText.length} / 255 characters
    </p>
  {/if}

  <!-- Checklist items -->
  {#if items.length > 0}
    <div class="space-y-2 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
      {#each items as item, index (item.order)}
        <div class="flex items-start gap-2 group">
          <!-- Checkbox -->
          <input
            type="checkbox"
            checked={item.isCompleted}
            on:change={() => toggleItem(index)}
            {disabled}
            class="mt-1 w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded
                   focus:ring-primary-500 focus:ring-2
                   disabled:opacity-50 disabled:cursor-not-allowed"
          />

          <!-- Text -->
          <span
            class="flex-1 text-sm {item.isCompleted
              ? 'line-through text-gray-500 dark:text-gray-400'
              : 'text-gray-900 dark:text-gray-100'}"
          >
            {item.text}
          </span>

          <!-- Actions -->
          <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              on:click={() => moveUp(index)}
              disabled={disabled || index === 0}
              class="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
                     disabled:opacity-30 disabled:cursor-not-allowed"
              title="Move up"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd"/>
              </svg>
            </button>
            <button
              type="button"
              on:click={() => moveDown(index)}
              disabled={disabled || index === items.length - 1}
              class="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
                     disabled:opacity-30 disabled:cursor-not-allowed"
              title="Move down"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </button>
            <button
              type="button"
              on:click={() => removeItem(index)}
              {disabled}
              class="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300
                     disabled:opacity-50 disabled:cursor-not-allowed"
              title="Remove"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <p class="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">
      No checklist items yet. Add items above or use AI to generate them.
    </p>
  {/if}
</div>
