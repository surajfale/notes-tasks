<script lang="ts">
  import { onMount } from 'svelte';
  import { listsStore } from '$lib/stores/lists';
  import Button from '$lib/components/ui/Button.svelte';
  import ListCard from '$lib/components/lists/ListCard.svelte';
  import ListCreationModal from '$lib/components/lists/ListCreationModal.svelte';
  import { LoadingOverlay, ErrorMessage } from '$lib/components/ui';
  import type { List, CreateListData, UpdateListData } from '$lib/types/list';

  let showModal = false;
  let editingList: List | null = null;
  let isSubmitting = false;

  function openCreateModal() {
    editingList = null;
    showModal = true;
  }

  function openEditModal(list: List) {
    editingList = list;
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingList = null;
  }

  async function handleModalSubmit(event: CustomEvent<CreateListData | UpdateListData>) {
    isSubmitting = true;

    try {
      if (editingList) {
        await listsStore.update(editingList._id, event.detail);
      } else {
        await listsStore.create(event.detail as CreateListData);
      }

      closeModal();
    } catch (error: any) {
      console.error('Failed to save list:', error);
    } finally {
      isSubmitting = false;
    }
  }

  async function handleDelete(list: List) {
    try {
      await listsStore.delete(list._id);
    } catch (error: any) {
      console.error('Failed to delete list:', error);
    }
  }
</script>

<svelte:head>
  <title>Lists - Notes & Tasks</title>
</svelte:head>

<div class="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
    <div>
      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Lists</h1>
      <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
        Organize your notes and tasks into lists
      </p>
    </div>
    <Button variant="primary" on:click={openCreateModal} fullWidth={false}>
      <svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      <span class="hidden sm:inline">Create List</span>
      <span class="sm:hidden">New</span>
    </Button>
  </div>

  <!-- Error state -->
  {#if $listsStore.error}
    <ErrorMessage
      title="Failed to Load Lists"
      message={$listsStore.error}
      showRetry={true}
      on:retry={() => listsStore.loadAll()}
    />
  {:else if $listsStore.isLoading}
    <LoadingOverlay text="Loading lists..." />
  {:else if !Array.isArray($listsStore.items) || $listsStore.items.length === 0}
    <!-- Empty state -->
    <div class="text-center py-12">
      <svg class="w-24 h-24 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No lists yet</h3>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        Create your first list to organize your notes and tasks
      </p>
      <Button variant="primary" on:click={openCreateModal}>
        Create Your First List
      </Button>
    </div>
  {:else}
    <!-- Lists grid - single column on mobile, 2 on tablet, 3 on desktop -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {#each Array.isArray($listsStore.items) ? $listsStore.items : [] as list (list._id)}
        <ListCard 
          {list} 
          onEdit={openEditModal}
          onDelete={handleDelete}
        />
      {/each}
    </div>
  {/if}
</div>

<!-- Create/Edit List Modal -->
<ListCreationModal 
  bind:open={showModal}
  list={editingList}
  {isSubmitting}
  on:submit={handleModalSubmit}
  on:close={closeModal}
/>
