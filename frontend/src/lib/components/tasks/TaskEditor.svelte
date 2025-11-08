<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import MarkdownEditor from '$lib/components/ui/MarkdownEditor.svelte';
  import ListSelector from '$lib/components/lists/ListSelector.svelte';
  import ChecklistEditor from '$lib/components/tasks/ChecklistEditor.svelte';
  import DueDatePicker from '$lib/components/ui/DueDatePicker.svelte';
  import NotificationPreferences from '$lib/components/tasks/NotificationPreferences.svelte';

  import { listsStore } from '$lib/stores/lists';
  import { aiRepository } from '$lib/repositories/ai.repository';
  import type { Task, CreateTaskData, UpdateTaskData, TaskPriority, ChecklistItem, NotificationTiming } from '$lib/types/task';
  import { validateTaskForm, validateNotificationPreferences } from '$lib/utils/validation';
  import { formatDateForInput, parseDateInput } from '$lib/utils/date';

  export let task: Task | null = null;
  export let isSubmitting = false;
  export let apiError: string = '';
  export let onRetry: (() => void) | null = null;

  const dispatch = createEventDispatcher<{
    submit: CreateTaskData | UpdateTaskData;
    cancel: void;
  }>();

  // Form state
  let title = task?.title || '';
  let description = task?.description || '';
  let dueAtDate: Date | null = task?.dueAt ? parseDateInput(task.dueAt) : null;
  let priority: TaskPriority = task?.priority || 2;
  let listId = task?.listId || '';
  let checklistItems: ChecklistItem[] = task?.checklistItems || [];
  
  // Notification state - handle missing fields gracefully
  // Default to disabled notifications for tasks without notification fields
  let notificationEnabled = task?.notificationEnabled ?? false;
  let notificationTimings: NotificationTiming[] = Array.isArray(task?.notificationTimings) 
    ? task.notificationTimings 
    : [];

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
    
    // Validate notification preferences
    const notificationError = validateNotificationPreferences(
      notificationEnabled,
      notificationTimings,
      dueAtDate
    );
    
    if (notificationError) {
      errors = { ...errors, notifications: notificationError };
      return false;
    }
    
    return result.isValid;
  }

  function handleDueDateChange(date: Date | null) {
    dueAtDate = date;
    
    // If due date is cleared, disable notifications
    if (!date) {
      notificationEnabled = false;
      notificationTimings = [];
    }
  }

  function handleNotificationEnabledChange(enabled: boolean) {
    notificationEnabled = enabled;
    if (!enabled) {
      notificationTimings = [];
    }
    clearError('notifications');
  }

  function handleNotificationTimingsChange(timings: NotificationTiming[]) {
    notificationTimings = timings;
    clearError('notifications');
  }

  function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    // Convert date to ISO format at noon UTC to avoid timezone issues
    let dueAtISO: string | undefined = undefined;
    if (dueAtDate) {
      const dateObj = new Date(Date.UTC(
        dueAtDate.getFullYear(),
        dueAtDate.getMonth(),
        dueAtDate.getDate(),
        12, 0, 0
      ));
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
      notificationEnabled,
      notificationTimings,
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
    const preservedDueAt = dueAtDate;
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
      dueAtDate = preservedDueAt;
      priority = preservedPriority;
      listId = preservedListId;
      
      hasEnhanced = true;

    } catch (error: any) {
      // Restore original content on error
      title = originalTitle;
      description = originalDescription;
      dueAtDate = preservedDueAt;
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
  {#if apiError}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6" role="alert">
      <div class="flex items-start gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div class="flex-1">
          <p class="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">Failed to save task</p>
          <p class="text-sm text-red-700 dark:text-red-300">{apiError}</p>
          {#if onRetry}
            <button
              type="button"
              on:click={onRetry}
              class="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-md transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry
            </button>
          {/if}
        </div>
      </div>
    </div>
  {/if}

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
    <DueDatePicker
      value={dueAtDate}
      on:change={(e) => handleDueDateChange(e.detail)}
      disabled={enhancing}
      error={errors.dueAt}
    />

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

  <!-- Notification Preferences -->
  <div role="region" aria-labelledby="notification-section-label">
    <h2 id="notification-section-label" class="sr-only">Email Notification Preferences</h2>
    <NotificationPreferences
      dueDate={dueAtDate}
      enabled={notificationEnabled}
      selectedTimings={notificationTimings}
      on:enabledChange={(e) => handleNotificationEnabledChange(e.detail)}
      on:timingsChange={(e) => handleNotificationTimingsChange(e.detail)}
      disabled={enhancing || isSubmitting}
      error={errors.notifications}
    />
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
