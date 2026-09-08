<script lang="ts">
  import { goto } from '$app/navigation';
  import { themeStore } from '$lib/stores/theme';
  import { tick } from 'svelte';

  // Terminal persona only — toggled by Cmd/Ctrl+K in +layout.svelte's
  // handleGlobalKeydown.
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
    { id: 'new-note', label: 'New note', hint: 'goto /notes/new', run: () => goto('/notes/new') },
    { id: 'new-task', label: 'New task', hint: 'goto /tasks/new', run: () => goto('/tasks/new') },
    { id: 'goto-home', label: 'Go to home', hint: 'goto /', run: () => goto('/') },
    { id: 'goto-notes', label: 'Go to notes', hint: 'goto /notes', run: () => goto('/notes') },
    { id: 'goto-tasks', label: 'Go to tasks', hint: 'goto /tasks', run: () => goto('/tasks') },
    { id: 'goto-lists', label: 'Go to lists', hint: 'goto /lists', run: () => goto('/lists') },
    { id: 'goto-links', label: 'Go to links', hint: 'goto /links', run: () => goto('/links') },
    { id: 'goto-settings', label: 'Go to settings', hint: 'goto /settings', run: () => goto('/settings') },
    { id: 'toggle-theme', label: 'Toggle light/dark', hint: 'themeStore.toggleMode()', run: () => themeStore.toggleMode() }
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
    class="fixed inset-0 z-[70] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
    on:click={close}
    on:keydown={(e) => e.key === 'Escape' && close()}
    role="button"
    tabindex="0"
    aria-label="Close command palette"
  >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="w-full max-w-lg mx-4 rounded border border-[#232a38] bg-[#11151d] shadow-2xl font-mono text-sm overflow-hidden"
      on:click|stopPropagation
    >
      <div class="flex items-center gap-2 px-3 py-2.5 border-b border-[#232a38]">
        <span class="text-[#ffb454]">❯</span>
        <input
          bind:this={inputEl}
          bind:value={query}
          on:keydown={handleKeydown}
          type="text"
          placeholder="Type a command…"
          class="flex-1 bg-transparent outline-none text-[#e4e8f1] placeholder-[#6f7994]"
          aria-label="Command palette input"
        />
        <kbd class="text-[10px] text-[#6f7994] border border-[#232a38] rounded px-1 py-0.5">esc</kbd>
      </div>

      <ul class="max-h-72 overflow-y-auto py-1" role="listbox">
        {#each filtered as command, i}
          <li role="option" aria-selected={i === activeIndex}>
            <button
              type="button"
              class="w-full flex items-center justify-between gap-3 px-3 py-2 text-left
                     {i === activeIndex ? 'bg-[#ffb454]/10 text-[#ffb454]' : 'text-[#e4e8f1] hover:bg-[#1c212c]'}"
              on:click={() => run(command)}
              on:mouseenter={() => (activeIndex = i)}
            >
              <span>{command.label}</span>
              <span class="text-[11px] text-[#6f7994]">{command.hint}</span>
            </button>
          </li>
        {:else}
          <li class="px-3 py-4 text-[#6f7994] text-center">No matching command</li>
        {/each}
      </ul>
    </div>
  </div>
{/if}
