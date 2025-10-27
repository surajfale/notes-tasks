<script lang="ts">
  import { themeStore } from '$lib/stores/theme';
  import { browser } from '$app/environment';
  
  let showDebug = false;
  let cssVars: Record<string, string> = {};
  
  function getCSSVariables() {
    if (!browser) return;
    
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    cssVars = {
      '--accent-color': computedStyle.getPropertyValue('--accent-color').trim(),
      '--primary-50': computedStyle.getPropertyValue('--primary-50').trim(),
      '--primary-100': computedStyle.getPropertyValue('--primary-100').trim(),
      '--primary-200': computedStyle.getPropertyValue('--primary-200').trim(),
      '--primary-300': computedStyle.getPropertyValue('--primary-300').trim(),
      '--primary-400': computedStyle.getPropertyValue('--primary-400').trim(),
      '--primary-500': computedStyle.getPropertyValue('--primary-500').trim(),
      '--primary-600': computedStyle.getPropertyValue('--primary-600').trim(),
      '--primary-700': computedStyle.getPropertyValue('--primary-700').trim(),
      '--primary-800': computedStyle.getPropertyValue('--primary-800').trim(),
      '--primary-900': computedStyle.getPropertyValue('--primary-900').trim(),
    };
  }
  
  $: if (showDebug && browser) {
    getCSSVariables();
  }
</script>

<!-- Debug toggle button (bottom right corner) -->
<button
  on:click={() => {
    showDebug = !showDebug;
    if (showDebug) getCSSVariables();
  }}
  class="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 shadow-lg hover:scale-110 transition-transform"
  title="Toggle theme debug"
>
  🎨
</button>

{#if showDebug}
  <div class="fixed bottom-20 right-4 z-50 w-80 max-h-96 overflow-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl p-4">
    <h3 class="text-lg font-bold mb-2">Theme Debug</h3>
    
    <div class="mb-4">
      <p class="text-sm font-medium mb-1">Current Theme:</p>
      <p class="text-xs">Mode: {$themeStore.mode}</p>
      <p class="text-xs">Accent: {$themeStore.accentColor}</p>
    </div>
    
    <div class="mb-4">
      <p class="text-sm font-medium mb-2">CSS Variables:</p>
      <div class="space-y-1 text-xs font-mono">
        {#each Object.entries(cssVars) as [key, value]}
          <div class="flex items-center gap-2">
            <span class="text-gray-600 dark:text-gray-400">{key}:</span>
            <span class="flex-1">{value || '(not set)'}</span>
            {#if key !== '--accent-color' && value}
              <div class="w-6 h-6 rounded border border-gray-300" style="background-color: rgb({value})"></div>
            {:else if key === '--accent-color' && value}
              <div class="w-6 h-6 rounded border border-gray-300" style="background-color: {value}"></div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
    
    <div>
      <p class="text-sm font-medium mb-2">Tailwind Primary Colors:</p>
      <div class="grid grid-cols-5 gap-1">
        <div class="w-full h-8 bg-primary-50 rounded" title="primary-50"></div>
        <div class="w-full h-8 bg-primary-100 rounded" title="primary-100"></div>
        <div class="w-full h-8 bg-primary-200 rounded" title="primary-200"></div>
        <div class="w-full h-8 bg-primary-300 rounded" title="primary-300"></div>
        <div class="w-full h-8 bg-primary-400 rounded" title="primary-400"></div>
        <div class="w-full h-8 bg-primary-500 rounded" title="primary-500"></div>
        <div class="w-full h-8 bg-primary-600 rounded" title="primary-600"></div>
        <div class="w-full h-8 bg-primary-700 rounded" title="primary-700"></div>
        <div class="w-full h-8 bg-primary-800 rounded" title="primary-800"></div>
        <div class="w-full h-8 bg-primary-900 rounded" title="primary-900"></div>
      </div>
    </div>
    
    <button
      on:click={() => showDebug = false}
      class="mt-4 w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
    >
      Close
    </button>
  </div>
{/if}
