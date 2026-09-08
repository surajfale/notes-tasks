<script lang="ts">
  import { personaStore } from '$lib/stores/persona';
  import type { UiPersona } from '$lib/types/user';

  // Fired after a persona is chosen and the backend sync has been kicked
  // off — used by the onboarding flow to dismiss itself. Settings doesn't
  // need it.
  export let onChosen: (() => void) | undefined = undefined;

  let current: UiPersona = 'focus';
  personaStore.subscribe((value) => {
    current = value;
  });

  let choosing: UiPersona | null = null;

  const OPTIONS: {
    value: UiPersona;
    name: string;
    tagline: string;
    swatches: string[];
  }[] = [
    {
      value: 'focus',
      name: 'Focus',
      tagline: 'Minimal, dense, quiet. Keyboard shortcuts front and center.',
      swatches: ['#f7f7f8', '#6b6b76', '#27272e']
    },
    {
      value: 'vivid',
      name: 'Vivid',
      tagline: 'Bold, colorful, rounded. Lists get their own personality.',
      swatches: ['#f8f6ff', '#7566bb', '#2e2750']
    },
    {
      value: 'terminal',
      name: 'Terminal',
      tagline: 'Dark, monospace, sharp corners. Cmd/Ctrl+K to do anything.',
      swatches: ['#576080', '#1c1f2c', '#0b0e14']
    }
  ];

  async function choose(value: UiPersona) {
    if (choosing) return;
    choosing = value;
    try {
      await personaStore.choose(value);
      onChosen?.();
    } finally {
      choosing = null;
    }
  }
</script>

<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
  {#each OPTIONS as option}
    <button
      type="button"
      on:click={() => choose(option.value)}
      disabled={choosing !== null}
      class="text-left p-4 rounded-lg border-2 transition-colors duration-150 disabled:opacity-60
             {current === option.value
               ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
               : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'}"
      aria-pressed={current === option.value}
    >
      <div class="flex items-center justify-between mb-2">
        <span class="font-semibold text-stone-900 dark:text-stone-100">{option.name}</span>
        {#if current === option.value}
          <svg class="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
        {:else if choosing === option.value}
          <span class="w-4 h-4 border-2 border-stone-300 border-t-primary-500 rounded-full animate-spin flex-shrink-0"></span>
        {/if}
      </div>
      <div class="flex gap-1.5 mb-2">
        {#each option.swatches as color}
          <span class="w-4 h-4 rounded-full border border-black/10" style="background-color: {color}"></span>
        {/each}
      </div>
      <p class="text-xs text-stone-500 dark:text-stone-400 leading-snug">{option.tagline}</p>
    </button>
  {/each}
</div>
