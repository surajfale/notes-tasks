<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Link } from '$lib/types/link';
  import Tag from '$lib/components/ui/Tag.svelte';
  import PendingBadge from '$lib/components/sync/PendingBadge.svelte';
  import { linksStore } from '$lib/stores/links';
  import { listsStore } from '$lib/stores/lists';
  import { isLinkPending } from '$lib/stores/syncStatus';
  import '$lib/components/tactile/neumorphic.css';

  export let link: Link;

  const dispatch = createEventDispatcher();

  $: list = link.listId ? $listsStore.items.find(l => l._id === link.listId) : null;

  // Check if this link has pending changes
  $: hasPendingChanges = isLinkPending(link._id);

  // Google's favicon service; falls back to a chain-link glyph when the URL
  // can't be parsed or the favicon itself 404s (many sites have none).
  function getFaviconUrl(url: string): string | null {
    try {
      return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;
    } catch {
      return null;
    }
  }

  let faviconError = false;
  let imageError = false;
  $: faviconUrl = getFaviconUrl(link.url);
  // Reset error flags whenever the underlying source changes so a previous
  // failure doesn't stick around after editing the link's URL.
  $: faviconUrl, (faviconError = false);
  $: link.image, (imageError = false);

  function handleCardClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('.tag-container')) {
      return;
    }
    window.open(link.url, '_blank', 'noopener,noreferrer');
  }

  async function handleDelete(e: Event) {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this link?')) {
      await linksStore.delete(link._id);
    }
  }

  async function toggleArchive(e: Event) {
    e.stopPropagation();
    await linksStore.update(link._id, { isArchived: !link.isArchived });
  }

  function handleEdit(e: Event) {
    e.stopPropagation();
    dispatch('edit', link);
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="group relative cursor-pointer {link.isArchived ? 'neu-pressed' : 'neu-raised neu-interactive'}"
  on:click={handleCardClick}
  on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && window.open(link.url, '_blank', 'noopener,noreferrer')}
  role="button"
  tabindex="0"
>
  <div class="p-4 sm:p-6 flex flex-col gap-3 h-full">
    <!-- Header: favicon avatar + title/url -->
    <div class="flex items-start gap-3">
      <div class="neu-raised-sm w-11 h-11 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {#if faviconUrl && !faviconError}
          <img
            src={faviconUrl}
            alt=""
            class="w-5 h-5 object-contain"
            on:error={() => (faviconError = true)}
          />
        {:else}
          <svg class="w-5 h-5 accent-links-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
        {/if}
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2">
          <h3 class="font-serif text-base font-semibold text-stone-900 dark:text-stone-100 line-clamp-2">
            {link.title}
          </h3>
          <PendingBadge show={$hasPendingChanges} size="sm" />
        </div>
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          class="text-sm text-primary-600 dark:text-primary-400 hover:underline truncate block"
          title={link.url}
          on:click|stopPropagation
        >
          {link.url}
        </a>
      </div>
    </div>

    <!-- Preview image -->
    {#if link.image && !imageError}
      <div class="neu-raised-sm overflow-hidden aspect-video">
        <img
          src={link.image}
          alt=""
          class="w-full h-full object-cover"
          on:error={() => (imageError = true)}
        />
      </div>
    {/if}

    <!-- Description -->
    {#if link.description}
      <p class="text-sm text-stone-600 dark:text-stone-400 line-clamp-3">
        {link.description}
      </p>
    {/if}

    <!-- Tags & list badge -->
    {#if (link.tags && link.tags.length > 0) || list}
      <div class="flex flex-wrap items-center gap-2 tag-container">
        {#if list}
          <span
            class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap"
            style="background-color: {list.color}20; color: {list.color}"
          >
            {list.emoji ? `${list.emoji} ` : ''}{list.title}
          </span>
        {/if}
        {#if link.tags && link.tags.length > 0}
          {#each link.tags as tag}
            <Tag {tag} size="sm" />
          {/each}
        {/if}
      </div>
    {/if}

    <!-- Actions: full-opacity on touch devices, hover/focus-revealed on pointer devices -->
    <div class="flex items-center gap-1 mt-auto pt-2 -mx-2 border-t border-stone-100 dark:border-stone-800
                opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
      <button
        on:click={handleEdit}
        class="text-sm py-1.5 px-2 min-h-[36px] rounded-md text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
      >
        Edit
      </button>
      <button
        on:click={toggleArchive}
        class="text-sm py-1.5 px-2 min-h-[36px] rounded-md text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
      >
        {link.isArchived ? 'Unarchive' : 'Archive'}
      </button>
      <button
        on:click={handleDelete}
        class="text-sm py-1.5 px-2 min-h-[36px] rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      >
        Delete
      </button>

      {#if link.isArchived}
        <span class="ml-auto text-xs text-stone-400 dark:text-stone-500 px-2">
          Archived
        </span>
      {/if}
    </div>
  </div>
</div>
