<script lang="ts">
  import { goto } from '$app/navigation';
  import { themeStore, THEME_PALETTES, PALETTE_OPTIONS } from '$lib/stores/theme';
  import '$lib/components/tactile/neumorphic.css';
  import { tick } from 'svelte';

  // Toggled by Cmd/Ctrl+K in +layout.svelte's handleGlobalKeydown.
  export let open = false;

  let query = '';
  let inputEl: HTMLInputElement | null = null;
  let activeIndex = 0;

  interface Command {
    id: string;
    label: string;
    hint: string;
    run: () => void;
  }

  const commands: Command[] = [
    { id: 'new-note', label: 'New note', hint: 'N', run: () => goto('/notes/new') },
    { id: 'new-task', label: 'New task', hint: 'T', run: () => goto('/tasks/new') },
    { id: 'goto-home', label: 'Go to home', hint: 'Page', run: () => goto('/') },
    { id: 'goto-notes', label: 'Go to notes', hint: 'Page', run: () => goto('/notes') },
    { id: 'goto-tasks', label: 'Go to tasks', hint: 'Page', run: () => goto('/tasks') },
    { id: 'goto-lists', label: 'Go to lists', hint: 'Page', run: () => goto('/lists') },
    { id: 'goto-links', label: 'Go to links', hint: 'Page', run: () => goto('/links') },
    { id: 'goto-settings', label: 'Go to settings', hint: 'Page', run: () => goto('/settings') },
    { id: 'toggle-theme', label: 'Toggle light/dark', hint: 'Theme', run: () => themeStore.toggleMode() },
    ...PALETTE_OPTIONS.map((palette) => ({
      id: `palette-${palette}`,
      label: `Color theme: ${THEME_PALETTES[palette].label}`,
      hint: 'Theme',
      run: () => themeStore.setPalette(palette)
    }))
  ];

  $: filtered = query.trim()
    ? commands.filter((c) => c.label.toLowerCase().includes(query.trim().toLowerCase()))
    : commands;

  $: if (activeIndex >= filtered.length) activeIndex = Math.max(0, filtered.length - 1);

  async function openPalette() {
    query = '';
    activeIndex = 0;
    await tick();
    inputEl?.focus();
  }

  $: if (open) openPalette();

  function close() {
    open = false;
  }

  function run(command: Command | undefined) {
    if (!command) return;
    command.run();
    close();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, filtered.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(filtered[activeIndex]);
    }
  }
</script>

{#if open}
  <div
    class="fixed inset-0 z-[70] flex items-start justify-center pt-[15vh] bg-stone-950/50 backdrop-blur-sm"
    on:click={close}
    on:keydown={(e) => e.key === 'Escape' && close()}
    role="button"
    tabindex="0"
    aria-label="Close command palette"
  >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="neu-raised w-full max-w-lg mx-4 text-sm overflow-hidden"
      on:click|stopPropagation
    >
      <div class="flex items-center gap-2 px-4 py-3 border-b border-stone-200 dark:border-stone-800">
        <svg class="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          bind:this={inputEl}
          bind:value={query}
          on:keydown={handleKeydown}
          type="text"
          placeholder="Type a command…"
          class="flex-1 bg-transparent outline-none text-stone-900 dark:text-stone-100 placeholder-stone-400"
          aria-label="Command palette input"
        />
        <kbd class="text-[10px] font-mono text-stone-500 border border-stone-300 dark:border-stone-700 rounded px-1 py-0.5">esc</kbd>
      </div>

      <ul class="max-h-72 overflow-y-auto p-1.5" role="listbox">
        {#each filtered as command, i}
          <li role="option" aria-selected={i === activeIndex}>
            <button
              type="button"
              class="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-left
                     {i === activeIndex ? 'neu-pressed nav-active text-primary-700 dark:text-primary-300' : 'text-stone-700 dark:text-stone-300'}"
              on:click={() => run(command)}
              on:mouseenter={() => (activeIndex = i)}
            >
              <span>{command.label}</span>
              <span class="text-[11px] text-stone-400 dark:text-stone-500">{command.hint}</span>
            </button>
          </li>
        {:else}
          <li class="px-3 py-4 text-stone-500 text-center">No matching command</li>
        {/each}
      </ul>
    </div>
  </div>
{/if}
