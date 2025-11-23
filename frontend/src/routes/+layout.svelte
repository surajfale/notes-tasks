<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto, beforeNavigate } from '$app/navigation';
  import { authStore, isAuthenticated, currentUser } from '$lib/stores/auth';
  import { themeStore } from '$lib/stores/theme';
  import { listsStore } from '$lib/stores/lists';
  import { isPublicRoute, isAuthOnlyRoute } from '../hooks.client';
  import OfflineIndicator from '$lib/components/sync/OfflineIndicator.svelte';
  import SyncStatusIndicator from '$lib/components/sync/SyncStatusIndicator.svelte';
  import ThemeColorManager from '$lib/components/ThemeColorManager.svelte';
  import { ErrorBoundary, DisclaimerBanner } from '$lib/components/ui';
  
  // Reactive state
  let sidebarOpen = false;
  let isMobile = false;
  let listsLoaded = false;
  
  // Subscribe to stores
  $: user = $currentUser;
  $: authenticated = $isAuthenticated;
  $: theme = $themeStore;
  $: lists = Array.isArray($listsStore.items) ? $listsStore.items : [];
  
  // Check if current route is active
  function isActive(path: string): boolean {
    // Special case for home - only match exact path
    if (path === '/') {
      return $page.url.pathname === '/';
    }
    // For other routes, match exact path or sub-paths
    return $page.url.pathname === path || $page.url.pathname.startsWith(path + '/');
  }
  
  // Toggle sidebar on mobile
  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }
  
  // Close sidebar when clicking outside on mobile
  function closeSidebar() {
    if (isMobile) {
      sidebarOpen = false;
    }
  }
  
  // Handle logout
  async function handleLogout() {
    authStore.logout();
    listsStore.reset();
    goto('/login');
  }
  
  // Check if we're on mobile
  function checkMobile() {
    isMobile = window.innerWidth < 768;
    if (!isMobile) {
      sidebarOpen = true; // Always open on desktop
    }
  }
  
  // Load lists when authenticated (only once)
  $: if (authenticated && !listsLoaded) {
    listsLoaded = true;
    listsStore.loadAll();
  }
  
  // Reset flag when user logs out
  $: if (!authenticated) {
    listsLoaded = false;
  }
  
  // Navigation guard - protect routes based on authentication status
  // Requirements: 8.2, 8.4
  beforeNavigate(({ to, cancel }) => {
    if (!to) return;
    
    const targetPath = to.url.pathname;
    const authState = $authStore;
    const isUserAuthenticated = authState.user !== null;
    const isLoading = authState.isLoading;
    
    // Don't redirect while authentication is still loading
    if (isLoading) {
      return;
    }
    
    // If user is authenticated and trying to access login/register
    // Redirect them to home page
    if (isUserAuthenticated && isAuthOnlyRoute(targetPath)) {
      cancel();
      goto('/');
      return;
    }
    
    // If user is not authenticated and trying to access protected route
    // Redirect them to login page
    if (!isUserAuthenticated && !isPublicRoute(targetPath)) {
      cancel();
      goto('/login');
      return;
    }
  });
  
  onMount(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  });
  
  // Check if current page is a public route
  $: isCurrentPagePublic = isPublicRoute($page.url.pathname);

</script>

<!-- Main app container with theme classes -->
<div class="min-h-screen bg-background-light dark:bg-black text-gray-900 dark:text-gray-100">
  
  <!-- Theme Color Manager (updates meta theme-color dynamically) -->
  <ThemeColorManager />
  
  <!-- Disclaimer Banner (shown to all users) -->
  <DisclaimerBanner />
  
  <!-- Offline Indicator (shown globally when offline) -->
  <OfflineIndicator />
  
  <!-- Sync Status Indicator (shown when there are pending changes or sync errors) -->
  {#if authenticated && !isCurrentPagePublic}
    <SyncStatusIndicator />
  {/if}
  
  {#if authenticated && !isCurrentPagePublic}
    <!-- Authenticated layout with sidebar -->
    <div class="flex h-screen overflow-hidden">
      
      <!-- Mobile overlay -->
      {#if isMobile && sidebarOpen}
        <div 
          class="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          on:click={closeSidebar}
          on:keydown={(e) => e.key === 'Escape' && closeSidebar()}
          role="button"
          tabindex="0"
          aria-label="Close sidebar"
        ></div>
      {/if}
      
      <!-- Sidebar -->
      <aside 
        class="fixed md:static inset-y-0 left-0 z-30 w-64 bg-surface-light dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out {sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0"
      >
        <div class="flex flex-col h-full">
          
          <!-- App header -->
          <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <h1 class="text-xl font-bold text-primary-600 dark:text-primary-400">
              Notes & Tasks
            </h1>
          </div>
          
          <!-- User info -->
          {#if user}
            <div class="p-4 border-b border-gray-200 dark:border-gray-700">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.username ? user.username.charAt(0).toUpperCase() : '?'}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate">
                    {user.displayName || user.username || 'User'}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.username || ''}
                  </p>
                </div>
              </div>
            </div>
          {/if}
          
          <!-- Navigation links -->
          <nav class="flex-1 overflow-y-auto p-4 space-y-1">
            
            <!-- Home -->
            <a
              href="/"
              data-sveltekit-preload-data="hover"
              class="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors {isActive('/') ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}"
              on:click={closeSidebar}
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Home</span>
            </a>
            
            <!-- Notes -->
            <a
              href="/notes"
              data-sveltekit-preload-data="hover"
              class="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors {isActive('/notes') ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}"
              on:click={closeSidebar}
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Notes</span>
            </a>
            
            <!-- Tasks -->
            <a
              href="/tasks"
              data-sveltekit-preload-data="hover"
              class="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors {isActive('/tasks') ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}"
              on:click={closeSidebar}
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span>Tasks</span>
            </a>
            
            <!-- Lists section -->
            {#if Array.isArray(lists) && lists.length > 0}
              <div class="pt-4">
                <h3 class="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Lists
                </h3>
                {#each lists as list}
                  <div class="relative group">
                    <button
                      on:click={() => {
                        // Navigate to notes page with list filter by default
                        goto(`/notes?listId=${list._id}`);
                        closeSidebar();
                      }}
                      class="w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left {$page.url.searchParams.get('listId') === list._id ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}"
                    >
                      <span 
                        class="w-5 h-5 rounded flex items-center justify-center text-sm flex-shrink-0"
                        style="background-color: {list.color}20; color: {list.color}"
                      >
                        {list.emoji || '📋'}
                      </span>
                      <span class="truncate">{list.title}</span>
                    </button>
                    
                    <!-- Quick filter dropdown on hover -->
                    <div class="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div class="flex gap-1">
                        <button
                          on:click|stopPropagation={() => {
                            goto(`/notes?listId=${list._id}`);
                            closeSidebar();
                          }}
                          class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                          title="Filter notes"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        <button
                          on:click|stopPropagation={() => {
                            goto(`/tasks?listId=${list._id}`);
                            closeSidebar();
                          }}
                          class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                          title="Filter tasks"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
            
            <!-- Lists management -->
            <a
              href="/lists"
              data-sveltekit-preload-data="hover"
              class="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors {isActive('/lists') && !$page.url.pathname.includes('/lists/') ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}"
              on:click={closeSidebar}
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>Manage Lists</span>
            </a>
            
            <!-- Settings -->
            <a
              href="/settings"
              data-sveltekit-preload-data="hover"
              class="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors {isActive('/settings') ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}"
              on:click={closeSidebar}
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Settings</span>
            </a>
            
          </nav>
          
          <!-- Logout button -->
          <div class="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              on:click={handleLogout}
              class="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
          
        </div>
      </aside>
      
      <!-- Main content area -->
      <div class="flex-1 flex flex-col overflow-hidden">
        
        <!-- Mobile header with hamburger -->
        <header class="md:hidden bg-surface-light dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 p-4">
          <button
            on:click={toggleSidebar}
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle sidebar"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>
        
        <!-- Page content -->
        <main class="flex-1 overflow-y-auto">
          <ErrorBoundary>
            <slot />
          </ErrorBoundary>
        </main>
        
      </div>
      
    </div>
    
  {:else}
    <!-- Public layout (login/register pages) -->
    <ErrorBoundary>
      <slot />
    </ErrorBoundary>
  {/if}
  
</div>
