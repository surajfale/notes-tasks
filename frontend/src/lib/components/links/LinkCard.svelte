<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Link } from '$lib/types/link';
  import Tag from '$lib/components/ui/Tag.svelte';
  import { linksStore } from '$lib/stores/links';
  import { listsStore } from '$lib/stores/lists';
  
  export let link: Link;
  
  const dispatch = createEventDispatcher();
  
  $: list = link.listId ? $listsStore.items.find(l => l._id === link.listId) : null;
  
  // Get favicon URL
  $: faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}&sz=32`;
  
  function handleCardClick(e: MouseEvent) {
    // Don't trigger if clicking on actions or tags
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.tag-container')) {
      return;
    }
    window.open(link.url, '_blank');
  }
  
  async function handleDelete() {
    if (confirm('Are you sure you want to delete this link?')) {
      await linksStore.delete(link._id);
    }
  }
  
  async function toggleArchive() {
    await linksStore.update(link._id, { isArchived: !link.isArchived });
  }
  
  function handleEdit() {
    // TODO: Implement edit functionality, maybe dispatch event to parent
    dispatch('edit', link);
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div 
  class="group relative bg-white dark:bg-gray-950 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 sm:p-5 hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full"
  on:click={handleCardClick}
>
  <!-- Header -->
  <div class="flex justify-between items-start mb-2">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex items-center gap-2">
      <img src={faviconUrl} alt="" class="w-4 h-4 flex-shrink-0" />
      {link.title}
    </h3>
    
    <!-- Actions dropdown (visible on hover/focus) -->
    <div class="relative opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
      <div class="flex items-center gap-1">
        <button
          on:click|stopPropagation={handleEdit}
          class="p-1.5 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Edit"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          on:click|stopPropagation={toggleArchive}
          class="p-1.5 text-gray-500 hover:text-yellow-600 dark:text-gray-400 dark:hover:text-yellow-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={link.isArchived ? "Unarchive" : "Archive"}
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {#if link.isArchived}
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            {:else}
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            {/if}
          </svg>
        </button>
        <button
          on:click|stopPropagation={handleDelete}
          class="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Delete"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>
  
  <!-- URL -->
  <div class="mb-4 flex-grow">
    <a 
      href={link.url} 
      target="_blank" 
      rel="noopener noreferrer"
      class="text-sm text-primary-600 dark:text-primary-400 hover:underline break-all block"
      on:click|stopPropagation
    >
      {link.url}
    </a>
  </div>

  <!-- Description & Image -->
  {#if link.description || link.image}
    <div class="mb-4">
      {#if link.image}
        <div class="mb-3 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 aspect-video">
          <img src={link.image} alt={link.title} class="w-full h-full object-cover" />
        </div>
      {/if}
      {#if link.description}
        <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-2">
          {link.description}
        </p>
      {/if}
    </div>
  {/if}
  
  <!-- Footer (Tags & List) -->
  <div class="flex flex-wrap items-center gap-2 mt-auto tag-container">
    {#if list}
      <div 
        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
        style="background-color: {list.color}20; color: {list.color}"
      >
        {list.emoji ? `${list.emoji} ` : ''}{list.title}
      </div>
    {/if}
    
    {#if link.tags && link.tags.length > 0}
      {#each link.tags as tag}
        <Tag {tag} size="sm" />
      {/each}
    {/if}
  </div>
</div>
