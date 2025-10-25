<script lang="ts">
  import { page } from '$app/stores';

  export let open = true;
  export let onClose: (() => void) | undefined = undefined;

  interface NavItem {
    label: string;
    href: string;
    icon: string;
  }

  export let items: NavItem[] = [];

  function isActive(href: string): boolean {
    return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
  }

  function handleNavClick() {
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768 && onClose) {
      onClose();
    }
  }
</script>

<!-- Mobile backdrop -->
{#if open}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
    on:click={onClose}
    role="presentation"
  />
{/if}

<!-- Sidebar -->
<aside
  class="fixed top-0 left-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50 transition-transform duration-300 ease-in-out
         {open ? 'translate-x-0' : '-translate-x-full'}
         w-64 md:translate-x-0"
>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
      <slot name="header">
        <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
          Notes & Tasks
        </h1>
      </slot>
      
      {#if onClose}
        <button
          type="button"
          class="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          on:click={onClose}
          aria-label="Close sidebar"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      {/if}
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto px-4 py-4">
      <ul class="space-y-2">
        {#each items as item}
          <li>
            <a
              href={item.href}
              class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200
                     {isActive(item.href)
                       ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium'
                       : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}"
              on:click={handleNavClick}
            >
              <span class="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          </li>
        {/each}
      </ul>

      {#if $$slots.lists}
        <div class="mt-6">
          <slot name="lists" />
        </div>
      {/if}
    </nav>

    <!-- Footer -->
    {#if $$slots.footer}
      <div class="px-4 py-4 border-t border-gray-200 dark:border-gray-800">
        <slot name="footer" />
      </div>
    {/if}
  </div>
</aside>
