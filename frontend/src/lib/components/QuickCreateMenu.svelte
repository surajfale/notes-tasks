<script lang="ts">
  import { goto } from '$app/navigation';

  export let onNavigate: (() => void) | undefined = undefined;
  // 'sidebar': full-width button used in the desktop sidebar.
  // 'fab': circular floating action button used on mobile.
  export let variant: 'sidebar' | 'fab' = 'sidebar';

  let open = false;
  let menuEl: HTMLDivElement | undefined;
  let triggerEl: HTMLButtonElement | undefined;

  const items = [
    {
      label: 'New Note',
      href: '/notes/new',
      path: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    },
    {
      label: 'New Task',
      href: '/tasks/new',
      path: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'
    },
    {
      label: 'New Link',
      href: '/links/new',
      path: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'
    }
  ];

  function toggle() {
    open = !open;
  }

  function select(href: string) {
    open = false;
    goto(href);
    onNavigate?.();
  }

  function handleWindowClick(event: MouseEvent) {
    if (!open) return;
    const target = event.target as Node;
    if (menuEl?.contains(target) || triggerEl?.contains(target)) return;
    open = false;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && open) {
      open = false;
      triggerEl?.focus();
    }
  }
</script>

<svelte:window on:click={handleWindowClick} on:keydown={handleKeydown} />

<div class="relative">
  {#if variant === 'fab'}
    <button
      bind:this={triggerEl}
      type="button"
      on:click={toggle}
      aria-haspopup="true"
      aria-expanded={open}
      aria-label="Create new"
      class="flex items-center justify-center w-14 h-14 rounded-full text-white
             bg-primary-600 hover:bg-primary-700 active:scale-95 shadow-lg shadow-primary-600/30
             transition-all duration-150"
    >
      <svg
        class="w-6 h-6 transition-transform duration-200 {open ? 'rotate-45' : ''}"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
    </button>
  {:else}
    <button
      bind:this={triggerEl}
      type="button"
      on:click={toggle}
      aria-haspopup="true"
      aria-expanded={open}
      class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium
             bg-primary-600 text-white hover:bg-primary-700 transition-colors duration-150"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      New
    </button>
  {/if}

  {#if open}
    <div
      bind:this={menuEl}
      role="menu"
      class="absolute z-40 w-56
             bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-lg
             py-1
             {variant === 'fab' ? 'bottom-16 right-0' : 'left-0 right-0 sm:right-auto mt-1.5'}"
    >
      {#each items as item}
        <button
          type="button"
          role="menuitem"
          on:click={() => select(item.href)}
          class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-300
                 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.path} />
          </svg>
          {item.label}
        </button>
      {/each}
    </div>
  {/if}
</div>
