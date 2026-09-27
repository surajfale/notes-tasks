<script lang="ts">
  import { themeStore, THEME_PALETTES, PALETTE_OPTIONS } from '$lib/stores/theme';
  import '$lib/components/tactile/neumorphic.css';
</script>

<!-- Color theme picker: each option previews its own brand gradient. Purely
     cosmetic and stored per device (stores/theme.ts), independent of the
     light/dark toggle. -->
<div class="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Color theme">
  {#each PALETTE_OPTIONS as value}
    {@const option = THEME_PALETTES[value]}
    {@const selected = $themeStore.palette === value}
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      on:click={() => themeStore.setPalette(value)}
      class="text-left p-4 transition-all duration-150
             {selected ? 'neu-pressed' : 'neu-raised-sm neu-interactive'}"
    >
      <div
        class="h-10 rounded-lg mb-3"
        style="background-image: linear-gradient(135deg, {option.gradient.join(', ')})"
        aria-hidden="true"
      ></div>
      <div class="flex items-center justify-between mb-1">
        <span class="font-semibold text-stone-900 dark:text-stone-100">{option.label}</span>
        {#if selected}
          <svg class="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
        {/if}
      </div>
      <p class="text-xs text-stone-500 dark:text-stone-400 leading-snug">{option.description}</p>
    </button>
  {/each}
</div>
