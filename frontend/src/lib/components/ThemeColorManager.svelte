<script lang="ts">
  import { onMount } from 'svelte';
  import { themeStore } from '$lib/stores/theme';
  import { browser } from '$app/environment';

  // Update theme-color meta tag when theme changes
  $: if (browser) {
    updateThemeColor($themeStore.mode, $themeStore.accentColor);
  }

  function updateThemeColor(mode: 'light' | 'dark', accentColor: string) {
    if (!browser) return;

    // Get or create theme-color meta tag
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }

    // Set color based on theme mode
    // In dark mode, use a darker version of the accent color
    // In light mode, use the accent color directly
    const color = mode === 'dark' ? darkenColor(accentColor, 0.3) : accentColor;
    metaThemeColor.setAttribute('content', color);
  }

  function darkenColor(hex: string, amount: number): string {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Darken
    const newR = Math.round(r * (1 - amount));
    const newG = Math.round(g * (1 - amount));
    const newB = Math.round(b * (1 - amount));
    
    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  onMount(() => {
    // Initialize theme color on mount
    updateThemeColor($themeStore.mode, $themeStore.accentColor);
  });
</script>

<!-- This component has no visual output, it just manages the theme-color meta tag -->
