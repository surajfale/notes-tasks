<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { notesStore } from '$lib/stores/notes';
  import { listsStore } from '$lib/stores/lists';
  import NoteCard from '$lib/components/notes/NoteCard.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Tag from '$lib/components/ui/Tag.svelte';
  import { LoadingOverlay, ErrorMessage } from '$lib/components/ui';
  import type { NoteFilters } from '$lib/types/note';

  // Filter state
  let selectedListId = '';
  let showArchived = false;
  let selectedTags: string[] = [];
  let searchQuery = '';
  let searchDebounceTimer: ReturnType<typeof setTimeout>;

  // Read listId from URL parameters
  $: {
    const listIdParam = $page.url.searchParams.get('listId');
    if (listIdParam && listIdParam !== selectedListId) {
      selectedListId = listIdParam;
      if (typeof window !== 'undefined') {
        loadNotes();
      }
    }
  }

  // Get all unique tags from notes
  $: allTags = Array.from(
    new Set((Array.isArray($notesStore.items) ? $notesStore.items : []).flatMap(note => note.tags || []))
  ).sort();

  // Load notes and lists on mount
  onMount(async () => {
    try {
      await Promise.all([
        listsStore.loadAll(),
        loadNotes()
      ]);
    } catch (error) {
      console.error('Failed to load data on mount:', error);
    }
  });

  // Load notes with current filters
  async function loadNotes() {
    const filters: NoteFilters = {};

    if (selectedListId) {
      filters.listId = selectedListId;
    }

    if (showArchived) {
      filters.isArchived = true;
    } else {
      filters.isArchived = false;
    }

    if (selectedTags.length > 0) {
      filters.tags = selectedTags;
    }

    if (searchQuery.trim()) {
      filters.search = searchQuery.trim();
    }

    await notesStore.loadAll(filters);
  }

  // Handle filter changes
  function handleListFilterChange() {
    loadNotes();
  }

  function handleArchiveFilterChange() {
    showArchived = !showArchived;
    loadNotes();
  }

  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      selectedTags = selectedTags.filter(t => t !== tag);
    } else {
      selectedTags = [...selectedTags, tag];
    }
    loadNotes();
  }

  function clearTagFilters() {
    selectedTags = [];
    loadNotes();
  }

  // Debounced search
  function handleSearchInput() {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      loadNotes();
    }, 300);
  }

  function handleCreateNote() {
    goto('/notes/new');
  }

  // Clear filters
  function clearAllFilters() {
    selectedListId = '';
    showArchived = false;
    selectedTags = [];
    searchQuery = '';
    loadNotes();
  }

  $: hasActiveFilters = selectedListId || showArchived || selectedTags.length > 0 || searchQuery;
</script>

<svelte:head>
  <title>Notes</title>
</svelte:head>

<div class="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
    <div>
      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Notes</h1>
      <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
        {$notesStore.items.length} {$notesStore.items.length === 1 ? 'note' : 'notes'}
      </p>
    </div>
    <Button variant="primary" on:click={handleCreateNote} fullWidth={false}>
      <span class="hidden sm:inline">Create Note</span>
      <span class="sm:hidden">+ New</span>
    </Button>
  </div>

  <!-- Filters -->
  <div class="bg-white dark:bg-gray-950 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 p-4 sm:p-6 mb-6 sm:mb-8">
    <div class="flex flex-col gap-4">
      <!-- Search -->
      <div class="w-full">
        <Input
          type="search"
          placeholder="Search notes..."
          bind:value={searchQuery}
          on:input={handleSearchInput}
        />
      </div>

      <!-- Filter controls row -->
      <div class="flex flex-col sm:flex-row sm:flex-wrap gap-4 items-stretch sm:items-center">
        <!-- List filter -->
        <div class="flex-1 min-w-full sm:min-w-[200px]">
          <label for="list-filter" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Filter by List
          </label>
          <select
            id="list-filter"
            bind:value={selectedListId}
            on:change={handleListFilterChange}
            class="w-full px-4 py-3 min-h-[44px] text-base rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-black text-gray-900 dark:text-gray-100
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Lists</option>
            {#each Array.isArray($listsStore.items) ? $listsStore.items : [] as list}
              <option value={list._id}>
                {list.emoji ? `${list.emoji} ` : ''}{list.title}
              </option>
            {/each}
          </select>
        </div>

        <!-- Archive filter -->
        <div class="flex items-center gap-2 min-h-[44px]">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              on:change={handleArchiveFilterChange}
              class="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Show Archived
            </span>
          </label>
        </div>

        <!-- Clear filters -->
        {#if hasActiveFilters}
          <button
            on:click={clearAllFilters}
            class="text-sm sm:text-base text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium min-h-[44px] px-4"
          >
            Clear Filters
          </button>
        {/if}
      </div>

      <!-- Tag filters -->
      {#if allTags.length > 0}
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Filter by Tags
            </label>
            {#if selectedTags.length > 0}
              <button
                on:click={clearTagFilters}
                class="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Clear tags
              </button>
            {/if}
          </div>
          <div class="flex flex-wrap gap-2">
            {#each allTags as tag}
              <Tag 
                {tag} 
                size="md" 
                clickable={true}
                selected={selectedTags.includes(tag)}
                on:click={() => toggleTag(tag)}
              />
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Error message -->
  {#if $notesStore.error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
      <p class="text-red-800 dark:text-red-200">{$notesStore.error}</p>
    </div>
  {/if}

  <!-- Error state -->
  {#if $notesStore.error}
    <ErrorMessage
      title="Failed to Load Notes"
      message={$notesStore.error}
      showRetry={true}
      on:retry={loadNotes}
    />
  {:else if $notesStore.isLoading}
    <LoadingOverlay text="Loading notes..." />
  {:else if $notesStore.items.length === 0}
    <!-- Empty state -->
    <div class="text-center py-12">
      <svg
        class="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No notes found</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {hasActiveFilters ? 'Try adjusting your filters' : 'Get started by creating a new note'}
      </p>
      {#if !hasActiveFilters}
        <div class="mt-6">
          <Button variant="primary" on:click={handleCreateNote}>
            Create Note
          </Button>
        </div>
      {/if}
    </div>
  {:else}
    <!-- Notes grid - single column on mobile, 2 on tablet, 3 on desktop -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {#each Array.isArray($notesStore.items) ? $notesStore.items : [] as note (note._id)}
        <NoteCard {note} />
      {/each}
    </div>
  {/if}
</div>
