import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type ThemeMode = 'light' | 'dark';

/**
 * The three selectable color themes. Each is a neutral scale + a three-stop
 * brand gradient, defined in app.css under `[data-theme='...']`; this map
 * only carries what JS needs: a display label, the gradient stops (for
 * swatches), and the flat accent used to generate `--primary-*` shades.
 * The accent is picked per theme for text contrast rather than taken from a
 * gradient stop (e.g. ember's orange stop is too light for primary text).
 */
import type { ThemePalette } from '$lib/types/theme';

export type { ThemePalette };

export const THEME_PALETTES: Record<
  ThemePalette,
  { label: string; description: string; accent: string; gradient: [string, string, string] }
> = {
  aurora: {
    label: 'Aurora',
    description: 'Indigo to pink on cool ink.',
    accent: '#7C3AED',
    gradient: ['#6366F1', '#A855F7', '#EC4899']
  },
  ember: {
    label: 'Ember',
    description: 'Amber to rose on warm graphite.',
    accent: '#EA580C',
    gradient: ['#F59E0B', '#F97316', '#E11D48']
  },
  lagoon: {
    label: 'Lagoon',
    description: 'Mint to blue on slate.',
    accent: '#0284C7',
    gradient: ['#10B981', '#06B6D4', '#3B82F6']
  }
};

export const PALETTE_OPTIONS = Object.keys(THEME_PALETTES) as ThemePalette[];
export const DEFAULT_PALETTE: ThemePalette = 'aurora';

export interface ThemeState {
  mode: ThemeMode;
  palette: ThemePalette;
  /** Derived from `palette`; kept on the state for consumers like ThemeColorManager. */
  accentColor: string;
}

const THEME_MODE_KEY = 'theme-mode';
const THEME_PALETTE_KEY = 'theme-palette';
// Keys from the retired persona/accent-picker system, cleared on init.
const LEGACY_KEYS = ['accent-color', 'ui-persona'];

function isPalette(value: unknown): value is ThemePalette {
  return typeof value === 'string' && value in THEME_PALETTES;
}

// Helper functions for localStorage
function getStoredThemeMode(): ThemeMode {
  if (!browser) return 'light';

  const stored = localStorage.getItem(THEME_MODE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  // Check system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
}

function getStoredPalette(): ThemePalette {
  if (!browser) return DEFAULT_PALETTE;
  const stored = localStorage.getItem(THEME_PALETTE_KEY);
  return isPalette(stored) ? stored : DEFAULT_PALETTE;
}

function setStoredThemeMode(mode: ThemeMode): void {
  if (!browser) return;
  localStorage.setItem(THEME_MODE_KEY, mode);
}

function setStoredPalette(palette: ThemePalette): void {
  if (!browser) return;
  localStorage.setItem(THEME_PALETTE_KEY, palette);
}

// Helper function to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}

// Helper function to mix colors (for generating shades)
function mixColors(color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }, weight: number): string {
  const w1 = weight;
  const w2 = 1 - w1;
  const r = Math.round(color1.r * w1 + color2.r * w2);
  const g = Math.round(color1.g * w1 + color2.g * w2);
  const b = Math.round(color1.b * w1 + color2.b * w2);
  return `${r} ${g} ${b}`;
}

// Apply theme to document
function applyThemeToDocument(mode: ThemeMode, palette: ThemePalette): void {
  if (!browser) return;

  // Apply theme mode class to html element
  const html = document.documentElement;
  html.classList.remove('light', 'dark');
  html.classList.add(mode);
  html.setAttribute('data-theme', palette);

  // Convert accent color to RGB
  const accentColor = THEME_PALETTES[palette].accent;
  const rgb = hexToRgb(accentColor);
  if (!rgb) return;

  // Generate color shades by mixing with white and black
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };

  // Set CSS custom properties for all primary color shades
  html.style.setProperty('--accent-color', accentColor);
  html.style.setProperty('--primary-50', mixColors(rgb, white, 0.1));
  html.style.setProperty('--primary-100', mixColors(rgb, white, 0.2));
  html.style.setProperty('--primary-200', mixColors(rgb, white, 0.4));
  html.style.setProperty('--primary-300', mixColors(rgb, white, 0.6));
  html.style.setProperty('--primary-400', mixColors(rgb, white, 0.8));
  html.style.setProperty('--primary-500', `${rgb.r} ${rgb.g} ${rgb.b}`);
  html.style.setProperty('--primary-600', mixColors(rgb, black, 0.9));
  html.style.setProperty('--primary-700', mixColors(rgb, black, 0.8));
  html.style.setProperty('--primary-800', mixColors(rgb, black, 0.7));
  html.style.setProperty('--primary-900', mixColors(rgb, black, 0.6));
}

function stateFor(mode: ThemeMode, palette: ThemePalette): ThemeState {
  return { mode, palette, accentColor: THEME_PALETTES[palette].accent };
}

function createThemeStore() {
  // Initialize with stored values
  const initialMode = getStoredThemeMode();
  const initialPalette = getStoredPalette();

  const { subscribe, set, update } = writable<ThemeState>(stateFor(initialMode, initialPalette));

  // Apply initial theme
  if (browser) {
    applyThemeToDocument(initialMode, initialPalette);
  }

  return {
    subscribe,

    /**
     * Initialize theme from localStorage and apply to document
     * Should be called on app startup
     */
    initialize(): void {
      if (browser) LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));

      const mode = getStoredThemeMode();
      const palette = getStoredPalette();

      set(stateFor(mode, palette));
      applyThemeToDocument(mode, palette);
    },

    /**
     * Toggle between light and dark mode
     */
    toggleMode(): void {
      update((state) => {
        const newMode: ThemeMode = state.mode === 'light' ? 'dark' : 'light';
        setStoredThemeMode(newMode);
        applyThemeToDocument(newMode, state.palette);
        return stateFor(newMode, state.palette);
      });
    },

    /**
     * Set theme mode explicitly
     */
    setMode(mode: ThemeMode): void {
      update((state) => {
        setStoredThemeMode(mode);
        applyThemeToDocument(mode, state.palette);
        return stateFor(mode, state.palette);
      });
    },

    /**
     * Apply a color theme and cache it on this device. For a user's choice,
     * call themeSync.ts's chooseThemePalette() instead, which also saves it
     * to their account.
     */
    setPalette(palette: ThemePalette): void {
      update((state) => {
        setStoredPalette(palette);
        applyThemeToDocument(state.mode, palette);
        return stateFor(state.mode, palette);
      });
    },

    /**
     * Reset theme to defaults
     */
    reset(): void {
      const mode: ThemeMode = 'light';

      setStoredThemeMode(mode);
      setStoredPalette(DEFAULT_PALETTE);
      applyThemeToDocument(mode, DEFAULT_PALETTE);

      set(stateFor(mode, DEFAULT_PALETTE));
    }
  };
}

export const themeStore = createThemeStore();

// Listen for system theme changes
if (browser && window.matchMedia) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  mediaQuery.addEventListener('change', (e) => {
    // Only auto-switch if user hasn't explicitly set a preference
    const storedMode = localStorage.getItem(THEME_MODE_KEY);
    if (!storedMode) {
      themeStore.setMode(e.matches ? 'dark' : 'light');
    }
  });
}
