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
      }
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
    expect(state.accentColor).toBe('#6750A4');
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

  it('should set accent color', async () => {
    const { themeStore } = await import('./theme');
    
    themeStore.setAccentColor('#FF0000');
    const state = get(themeStore);
    expect(state.accentColor).toBe('#FF0000');
  });

  it('should persist theme mode to localStorage', async () => {
    const { themeStore } = await import('./theme');
    
    themeStore.setMode('dark');
    expect(localStorageMock.getItem('theme-mode')).toBe('dark');
  });

  it('should persist accent color to localStorage', async () => {
    const { themeStore } = await import('./theme');
    
    themeStore.setAccentColor('#00FF00');
    expect(localStorageMock.getItem('accent-color')).toBe('#00FF00');
  });

  it('should reset to defaults', async () => {
    const { themeStore } = await import('./theme');
    
    themeStore.setMode('dark');
    themeStore.setAccentColor('#FF0000');
    
    themeStore.reset();
    const state = get(themeStore);
    
    expect(state.mode).toBe('light');
    expect(state.accentColor).toBe('#6750A4');
  });

  it('should load stored theme mode on initialize', async () => {
    localStorageMock.setItem('theme-mode', 'dark');
    localStorageMock.setItem('accent-color', '#123456');
    
    const { themeStore } = await import('./theme');
    themeStore.initialize();
    
    const state = get(themeStore);
    expect(state.mode).toBe('dark');
    expect(state.accentColor).toBe('#123456');
  });
});
