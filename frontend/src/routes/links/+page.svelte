<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { linksStore } from '$lib/stores/links';
  import { listsStore } from '$lib/stores/lists';
  import LinkCard from '$lib/components/links/LinkCard.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Tag from '$lib/components/ui/Tag.svelte';
  import { LoadingOverlay, ErrorMessage, PageHeader, EmptyState } from '$lib/components/ui';
  import type { Link, LinkFilters } from '$lib/types/link';

  // Filter state
  let selectedListId = '';
  let showArchived = false;
  let selectedTags: string[] = [];
  let searchQuery = '';
  let searchDebounceTimer: ReturnType<typeof setTimeout>;
  let showFilters = false;

  // Count of active filters beyond search, shown as a badge on the Filters toggle
  $: activeFilterCount = (selectedListId ? 1 : 0) + (showArchived ? 1 : 0) + selectedTags.length;

  // Read listId from URL parameters
  $: {
    const listIdParam = $page.url.searchParams.get('listId');
    if (listIdParam && listIdParam !== selectedListId) {
      selectedListId = listIdParam;
      if (typeof window !== 'undefined') {
        loadLinks();
      }
    }
  }

  // Get all unique tags from links
  $: allTags = Array.from(
    new Set((Array.isArray($linksStore.items) ? $linksStore.items : []).flatMap(link => link.tags || []))
  ).sort();

  // Load links and lists on mount
  onMount(async () => {
    try {
      await Promise.all([
        listsStore.loadAll(),
        loadLinks()
      ]);
    } catch (error) {
      console.error('Failed to load data on mount:', error);
    }
  });

  // Load links with current filters
  async function loadLinks() {
    const filters: LinkFilters = {};

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

    await linksStore.loadAll(filters);
  }

  // Handle filter changes
  function handleListFilterChange() {
    loadLinks();
  }

  function handleArchiveFilterChange() {
    showArchived = !showArchived;
    loadLinks();
  }

  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      selectedTags = selectedTags.filter(t => t !== tag);
    } else {
      selectedTags = [...selectedTags, tag];
    }
    loadLinks();
  }

  function clearTagFilters() {
    selectedTags = [];
    loadLinks();
  }

  // Debounced search
  function handleSearchInput() {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      loadLinks();
    }, 300);
  }

  function handleCreateLink() {
    goto('/links/new');
  }

  function handleEditLink(event: CustomEvent<Link>) {
    goto(`/links/${event.detail._id}`);
  }

  // Clear filters
  function clearAllFilters() {
    selectedListId = '';
    showArchived = false;
    selectedTags = [];
    searchQuery = '';
    loadLinks();
  }

  $: hasActiveFilters = selectedListId || showArchived || selectedTags.length > 0 || searchQuery;
</script>

<svelte:head>
  <title>Links</title>
</svelte:head>

<div class="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
  <PageHeader
    title="Links"
    description="{$linksStore.items.length} {$linksStore.items.length === 1 ? 'link' : 'links'}"
  >
    <svelte:fragment slot="actions">
      <!-- Hidden on mobile: the floating create button already covers this there. -->
      <Button variant="primary" on:click={handleCreateLink} fullWidth={false} class="hidden md:inline-flex">
        Create Link
      </Button>
    </svelte:fragment>
  </PageHeader>

  <!-- Search + filters toggle -->
  <div class="flex gap-3 mb-4">
    <div class="flex-1">
      <Input
        type="search"
        placeholder="Search links..."
        bind:value={searchQuery}
        on:input={handleSearchInput}
      />
    </div>
    <button
      type="button"
      on:click={() => (showFilters = !showFilters)}
      aria-expanded={showFilters}
      class="flex items-center gap-2 px-4 min-h-[44px] rounded-lg border text-sm font-medium transition-colors flex-shrink-0
             {showFilters || activeFilterCount > 0
               ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
               : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'}"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
      </svg>
      <span class="hidden sm:inline">Filters</span>
      {#if activeFilterCount > 0}
        <span class="flex items-center justify-center w-5 h-5 rounded-full bg-primary-600 text-white text-xs font-semibold">
          {activeFilterCount}
        </span>
      {/if}
    </button>
  </div>

  {#if showFilters}
  <div class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-6 mb-6 sm:mb-8">
    <div class="flex flex-col gap-4">
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
            <!-- svelte-ignore a11y-label-has-associated-control -->
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
  {/if}

  <!-- Error state -->
  {#if $linksStore.error}
    <ErrorMessage
      title="Failed to Load Links"
      message={$linksStore.error}
      showRetry={true}
      on:retry={loadLinks}
    />
  {:else if $linksStore.isLoading}
    <LoadingOverlay text="Loading links..." />
  {:else if $linksStore.items.length === 0}
    <EmptyState
      title="No links found"
      description={hasActiveFilters ? 'Try adjusting your filters' : 'Get started by creating a new link'}
    >
      <svelte:fragment slot="icon">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
      </svelte:fragment>
      {#if !hasActiveFilters}
        <Button variant="primary" on:click={handleCreateLink}>
          Create Link
        </Button>
      {/if}
    </EmptyState>
  {:else}
    <!-- Links grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {#each Array.isArray($linksStore.items) ? $linksStore.items : [] as link (link._id)}
        <LinkCard {link} on:edit={handleEditLink} />
      {/each}
    </div>
  {/if}
</div>
