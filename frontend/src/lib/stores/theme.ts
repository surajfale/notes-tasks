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

// Apply theme to document
function applyThemeToDocument(mode: ThemeMode, accentColor: string): void {
  if (!browser) return;
  
  // Apply theme mode class to html element
  const html = document.documentElement;
  html.classList.remove('light', 'dark');
  html.classList.add(mode);
  
  // Apply accent color as CSS custom property
  html.style.setProperty('--accent-color', accentColor);
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
