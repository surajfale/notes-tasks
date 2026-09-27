import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

// Mock browser environment
vi.mock('$app/environment', () => ({
  browser: true
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock
});

// Mock document
Object.defineProperty(globalThis, 'document', {
  value: {
    documentElement: {
      classList: {
        add: vi.fn(),
        remove: vi.fn()
      },
      style: {
        setProperty: vi.fn()
      },
      setAttribute: vi.fn()
    }
  }
});

// Mock window.matchMedia
Object.defineProperty(globalThis, 'window', {
  value: {
    matchMedia: vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn()
    })
  }
});

describe('themeStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    
    // Re-import to get fresh store instance
    vi.resetModules();
  });

  it('should initialize with default light mode', async () => {
    const { themeStore } = await import('./theme');
    const state = get(themeStore);

    expect(state.mode).toBe('light');
    expect(state.palette).toBe('aurora');
    expect(state.accentColor).toBe('#7C3AED');
  });

  it('should toggle between light and dark mode', async () => {
    const { themeStore } = await import('./theme');
    
    themeStore.toggleMode();
    let state = get(themeStore);
    expect(state.mode).toBe('dark');
    
    themeStore.toggleMode();
    state = get(themeStore);
    expect(state.mode).toBe('light');
  });

  it('should set mode explicitly', async () => {
    const { themeStore } = await import('./theme');
    
    themeStore.setMode('dark');
    let state = get(themeStore);
    expect(state.mode).toBe('dark');
    
    themeStore.setMode('light');
    state = get(themeStore);
    expect(state.mode).toBe('light');
  });

  it('should set palette and derive its accent color', async () => {
    const { themeStore } = await import('./theme');

    themeStore.setPalette('lagoon');
    const state = get(themeStore);
    expect(state.palette).toBe('lagoon');
    expect(state.accentColor).toBe('#0284C7');
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'lagoon');
  });

  it('should persist theme mode to localStorage', async () => {
    const { themeStore } = await import('./theme');

    themeStore.setMode('dark');
    expect(localStorageMock.getItem('theme-mode')).toBe('dark');
  });

  it('should persist palette to localStorage', async () => {
    const { themeStore } = await import('./theme');

    themeStore.setPalette('ember');
    expect(localStorageMock.getItem('theme-palette')).toBe('ember');
  });

  it('should reset to defaults', async () => {
    const { themeStore } = await import('./theme');

    themeStore.setMode('dark');
    themeStore.setPalette('ember');

    themeStore.reset();
    const state = get(themeStore);

    expect(state.mode).toBe('light');
    expect(state.palette).toBe('aurora');
  });

  it('should load stored theme mode on initialize', async () => {
    localStorageMock.setItem('theme-mode', 'dark');
    localStorageMock.setItem('theme-palette', 'lagoon');

    const { themeStore } = await import('./theme');
    themeStore.initialize();

    const state = get(themeStore);
    expect(state.mode).toBe('dark');
    expect(state.palette).toBe('lagoon');
  });

  it('should fall back to the default palette for an unknown stored value', async () => {
    localStorageMock.setItem('theme-palette', 'vivid');

    const { themeStore } = await import('./theme');
    themeStore.initialize();

    expect(get(themeStore).palette).toBe('aurora');
  });

  it('should clear retired persona/accent keys on initialize', async () => {
    localStorageMock.setItem('ui-persona', 'vivid');
    localStorageMock.setItem('accent-color', '#123456');

    const { themeStore } = await import('./theme');
    themeStore.initialize();

    expect(localStorageMock.getItem('ui-persona')).toBeNull();
    expect(localStorageMock.getItem('accent-color')).toBeNull();
  });
});
