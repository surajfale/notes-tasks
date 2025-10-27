import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type ThemeMode = 'light' | 'dark';

export interface ThemeState {
  mode: ThemeMode;
  accentColor: string;
}

const THEME_MODE_KEY = 'theme-mode';
const ACCENT_COLOR_KEY = 'accent-color';
const DEFAULT_ACCENT_COLOR = '#6750A4'; // Material Design 3 primary purple

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

function getStoredAccentColor(): string {
  if (!browser) return DEFAULT_ACCENT_COLOR;
  
  const stored = localStorage.getItem(ACCENT_COLOR_KEY);
  return stored || DEFAULT_ACCENT_COLOR;
}

function setStoredThemeMode(mode: ThemeMode): void {
  if (!browser) return;
  localStorage.setItem(THEME_MODE_KEY, mode);
}

function setStoredAccentColor(color: string): void {
  if (!browser) return;
  localStorage.setItem(ACCENT_COLOR_KEY, color);
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
function applyThemeToDocument(mode: ThemeMode, accentColor: string): void {
  if (!browser) return;
  
  // Apply theme mode class to html element
  const html = document.documentElement;
  html.classList.remove('light', 'dark');
  html.classList.add(mode);
  
  // Convert accent color to RGB
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

function createThemeStore() {
  // Initialize with stored values
  const initialMode = getStoredThemeMode();
  const initialAccentColor = getStoredAccentColor();
  
  const { subscribe, set, update } = writable<ThemeState>({
    mode: initialMode,
    accentColor: initialAccentColor
  });
  
  // Apply initial theme
  if (browser) {
    applyThemeToDocument(initialMode, initialAccentColor);
  }
  
  return {
    subscribe,
    
    /**
     * Initialize theme from localStorage and apply to document
     * Should be called on app startup
     */
    initialize(): void {
      const mode = getStoredThemeMode();
      const accentColor = getStoredAccentColor();
      
      set({ mode, accentColor });
      applyThemeToDocument(mode, accentColor);
    },
    
    /**
     * Toggle between light and dark mode
     */
    toggleMode(): void {
      update(state => {
        const newMode: ThemeMode = state.mode === 'light' ? 'dark' : 'light';
        setStoredThemeMode(newMode);
        applyThemeToDocument(newMode, state.accentColor);
        return { ...state, mode: newMode };
      });
    },
    
    /**
     * Set theme mode explicitly
     */
    setMode(mode: ThemeMode): void {
      update(state => {
        setStoredThemeMode(mode);
        applyThemeToDocument(mode, state.accentColor);
        return { ...state, mode };
      });
    },
    
    /**
     * Set accent color
     */
    setAccentColor(color: string): void {
      update(state => {
        setStoredAccentColor(color);
        applyThemeToDocument(state.mode, color);
        return { ...state, accentColor: color };
      });
    },
    
    /**
     * Reset theme to defaults
     */
    reset(): void {
      const mode: ThemeMode = 'light';
      const accentColor = DEFAULT_ACCENT_COLOR;
      
      setStoredThemeMode(mode);
      setStoredAccentColor(accentColor);
      applyThemeToDocument(mode, accentColor);
      
      set({ mode, accentColor });
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
