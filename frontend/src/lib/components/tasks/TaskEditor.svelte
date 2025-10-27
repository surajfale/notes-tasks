<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import MarkdownEditor from '$lib/components/ui/MarkdownEditor.svelte';
  import ListSelector from '$lib/components/lists/ListSelector.svelte';
  import { listsStore } from '$lib/stores/lists';
  import type { Task, CreateTaskData, UpdateTaskData, TaskPriority } from '$lib/types/task';
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
      dueAt: dueAtISO
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
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-6">
  <!-- Title -->
  <Input
    label="Title"
    type="text"
    bind:value={title}
    error={errors.title}
    placeholder="Enter task title"
    required
    on:input={() => clearError('title')}
  />

  <!-- Description with Markdown Editor -->
  <MarkdownEditor
    label="Description"
    bind:value={description}
    placeholder="Enter task description... Supports **bold**, *italic*, # headings, - lists, and more"
    rows={6}
    error={errors.description}
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

  <!-- List Assignment -->
  <ListSelector
    bind:value={listId}
    label="List (Optional)"
    placeholder="No List"
    disabled={isSubmitting}
  />

  <!-- Form Actions -->
  <div class="flex gap-4 pt-4">
    <Button
      type="submit"
      variant="primary"
      disabled={isSubmitting}
      fullWidth
    >
      {isSubmitting ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
    </Button>
    <Button
      type="button"
      variant="secondary"
      on:click={handleCancel}
      disabled={isSubmitting}
    >
      Cancel
    </Button>
  </div>
</form>
