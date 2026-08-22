<script lang="ts">
  export let isActive: (path: string) => boolean;
  export let onMore: () => void;
  export let moreOpen = false;

  const items = [
    {
      label: 'Home',
      href: '/',
      path: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
    },
    {
      label: 'Notes',
      href: '/notes',
      path: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    },
    {
      label: 'Tasks',
      href: '/tasks',
      path: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'
    },
    {
      label: 'Links',
      href: '/links',
      path: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'
    }
  ];
</script>

<nav
  class="md:hidden fixed bottom-0 left-0 right-0 z-[45] bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800"
  style="padding-bottom: env(safe-area-inset-bottom, 0px)"
  aria-label="Primary"
>
  <div class="grid grid-cols-5">
    {#each items as item}
      <a
        href={item.href}
        data-sveltekit-preload-data="hover"
        class="flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-xs font-medium transition-colors
               {isActive(item.href) ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.path} />
        </svg>
        {item.label}
      </a>
    {/each}

    <button
      type="button"
      on:click={onMore}
      aria-expanded={moreOpen}
      class="flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-xs font-medium transition-colors
             {moreOpen ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
      More
    </button>
  </div>
</nav>
