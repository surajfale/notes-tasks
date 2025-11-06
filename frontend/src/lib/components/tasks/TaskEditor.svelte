<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import MarkdownEditor from '$lib/components/ui/MarkdownEditor.svelte';
  import ListSelector from '$lib/components/lists/ListSelector.svelte';
  import ChecklistEditor from '$lib/components/tasks/ChecklistEditor.svelte';

  import { listsStore } from '$lib/stores/lists';
  import { aiRepository } from '$lib/repositories/ai.repository';
  import type { Task, CreateTaskData, UpdateTaskData, TaskPriority, ChecklistItem } from '$lib/types/task';
  import { validateTaskForm } from '$lib/utils/validation';
  import { formatDateForInput } from '$lib/utils/date';

  export let task: Task | null = null;
  export let isSubmitting = false;

  const dispatch = createEventDispatcher<{
    submit: CreateTaskData | UpdateTaskData;
    cancel: void;
  }>();

  // Form state
  let title = task?.title || '';
  let description = task?.description || '';
  let dueAt = formatDateForInput(task?.dueAt);
  let priority: TaskPriority = task?.priority || 2;
  let listId = task?.listId || '';
  let checklistItems: ChecklistItem[] = task?.checklistItems || [];

  // AI enhancement state
  let enhancing = false;
  let enhanceError = '';
  let selectedTone: 'concise' | 'detailed' | 'professional' | 'casual' = 'casual';
  let originalTitle = '';
  let originalDescription = '';
  let hasEnhanced = false;

  // Validation errors
  let errors: Record<string, string> = {};

  function validateForm(): boolean {
    const result = validateTaskForm({ title, description });
    errors = result.errors;
    return result.isValid;
  }

  function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    // Convert date string to ISO format at noon UTC to avoid timezone issues
    let dueAtISO: string | undefined = undefined;
    if (dueAt) {
      // Parse the date as local and set to noon to avoid timezone shifts
      const [year, month, day] = dueAt.split('-').map(Number);
      const dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      dueAtISO = dateObj.toISOString();
    }

    const data: CreateTaskData | UpdateTaskData = {
      title: title.trim(),
      description: description.trim(),
      priority,
      listId: listId || undefined,
      dueAt: dueAtISO,
      checklistItems: checklistItems.map((item, index) => ({
        text: item.text,
        isCompleted: item.isCompleted,
        order: index,
      })),
    };

    dispatch('submit', data);
  }

  function handleCancel() {
    dispatch('cancel');
  }

  // Clear error when field is modified
  function clearError(field: string) {
    if (errors[field]) {
      const { [field]: _, ...rest } = errors;
      errors = rest;
    }
  }

  // AI Enhancement
  async function handleEnhance() {
    // Check if there's content to enhance
    if ((!title || title.trim().length === 0) && (!description || description.trim().length === 0)) {
      return;
    }

    // Save original content before enhancing
    originalTitle = title;
    originalDescription = description;
    
    // Preserve current values
    const preservedDueAt = dueAt;
    const preservedPriority = priority;
    const preservedListId = listId;

    enhancing = true;
    enhanceError = '';

    try {
      // Combine title and description for AI processing
      const content = `Title: ${title}\n\nDescription: ${description || ''}`;

      const enhancedContent = await aiRepository.enhanceContent(content, 'task', selectedTone);

      // Parse enhanced content back into title and description
      const lines = enhancedContent.split('\n');
      
      // Extract title
      const titleMatch = lines[0].match(/^Title:\s*(.+)$/i);
      if (titleMatch && titleMatch[1].trim()) {
        title = titleMatch[1].trim();
      }

      // Extract description (everything after "Description:" line)
      const descIndex = lines.findIndex(line => line.match(/^Description:/i));
      if (descIndex !== -1) {
        // Get all lines after the Description: line
        const descLines = lines.slice(descIndex + 1);
        description = descLines.join('\n').trim();
      } else {
        // If no Description: marker found, use everything after the first line
        description = lines.slice(1).join('\n').trim();
      }

      // Preserve task priority, due date, and list assignment
      dueAt = preservedDueAt;
      priority = preservedPriority;
      listId = preservedListId;
      
      hasEnhanced = true;

    } catch (error: any) {
      // Restore original content on error
      title = originalTitle;
      description = originalDescription;
      dueAt = preservedDueAt;
      priority = preservedPriority;
      listId = preservedListId;

      enhanceError = error.message || 'Failed to enhance content';
      console.error('AI enhancement error:', error);
    } finally {
      enhancing = false;
    }
  }

  function handleRevert() {
    if (originalTitle || originalDescription) {
      title = originalTitle;
      description = originalDescription;
      hasEnhanced = false;
      enhanceError = '';
    }
  }

  // Parse checklist items from markdown
  function parseChecklistFromMarkdown(markdown: string): ChecklistItem[] {
    const lines = markdown.split('\n');
    const items: ChecklistItem[] = [];
    
    for (const line of lines) {
      // Match markdown checkbox format: - [ ] or - [x]
      const match = line.match(/^-\s*\[([ xX])\]\s*(.+)$/);
      if (match) {
        const isCompleted = match[1].toLowerCase() === 'x';
        const text = match[2].trim();
        
        // Enforce 255 character limit
        if (text.length > 0 && text.length <= 255) {
          items.push({
            text: text.substring(0, 255),
            isCompleted,
            order: items.length,
          });
        }
      }
    }
    
    return items;
  }

  // Separate handler for description-only enhancement
  async function handleEnhanceDescription() {
    if (!description || description.trim().length === 0) {
      return;
    }

    originalDescription = description;
    const originalChecklist = [...checklistItems];
    
    enhancing = true;
    enhanceError = '';

    try {
      const enhancedContent = await aiRepository.enhanceContent(description, 'task', selectedTone);
      
      // Parse checklist items from the enhanced content
      const parsedItems = parseChecklistFromMarkdown(enhancedContent);
      
      if (parsedItems.length > 0) {
        // AI generated checklist items
        checklistItems = parsedItems;
        description = enhancedContent; // Keep the full markdown for reference
      } else {
        // No checklist found, just update description
        description = enhancedContent;
      }
      
      hasEnhanced = true;
    } catch (error: any) {
      description = originalDescription;
      checklistItems = originalChecklist;
      enhanceError = error.message || 'Failed to enhance content';
      console.error('AI enhancement error:', error);
    } finally {
      enhancing = false;
    }
  }

  // Check if enhancement button should be disabled
  $: enhanceDisabled = (!title || title.trim().length === 0) && (!description || description.trim().length === 0);
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-6">
  {#if enhanceError}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
      <p class="text-sm text-red-800 dark:text-red-200">{enhanceError}</p>
    </div>
  {/if}

  <!-- Title -->
  <Input
    label="Title"
    type="text"
    bind:value={title}
    error={errors.title}
    placeholder="Enter task title"
    required
    disabled={enhancing}
    on:input={() => clearError('title')}
  />

  <!-- Description with Markdown Editor -->
  <MarkdownEditor
    label="Description"
    bind:value={description}
    bind:selectedTone
    placeholder="Enter task description... Supports **bold**, *italic*, # headings, - lists, and more"
    rows={6}
    error={errors.description}
    disabled={enhancing}
    showAiControls={true}
    onEnhance={handleEnhanceDescription}
    onRevert={handleRevert}
    {enhancing}
    {hasEnhanced}
    on:input={() => clearError('description')}
  />

  <!-- Due Date and Priority Row -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Due Date -->
    <div>
      <label for="dueAt" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Due Date
      </label>
      <input
        id="dueAt"
        type="date"
        bind:value={dueAt}
        disabled={enhancing}
        class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
               bg-white dark:bg-black 
               text-gray-900 dark:text-gray-100
               focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
               disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>

    <!-- Priority -->
    <div>
      <label for="priority" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Priority
      </label>
      <select
        id="priority"
        bind:value={priority}
        disabled={enhancing}
        class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
               bg-white dark:bg-black 
               text-gray-900 dark:text-gray-100
               focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
               disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value={1}>Low Priority</option>
        <option value={2}>Normal Priority</option>
        <option value={3}>High Priority</option>
      </select>
    </div>
  </div>

  <!-- Checklist Items -->
  <ChecklistEditor
    bind:items={checklistItems}
    bind:markdownDescription={description}
    disabled={isSubmitting || enhancing}
  />

  <!-- List Assignment -->
  <ListSelector
    bind:value={listId}
    label="List (Optional)"
    placeholder="No List"
    disabled={isSubmitting || enhancing}
  />

  <!-- Form Actions -->
  <div class="flex gap-4 pt-4">
    <Button
      type="submit"
      variant="primary"
      disabled={isSubmitting || enhancing}
      fullWidth
    >
      {isSubmitting ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
    </Button>
    <Button
      type="button"
      variant="secondary"
      on:click={handleCancel}
      disabled={isSubmitting || enhancing}
    >
      Cancel
    </Button>
  </div>
</form>
