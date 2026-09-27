import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

vi.mock('$app/environment', () => ({ browser: true }));

const updateTheme = vi.fn();
vi.mock('$lib/repositories/auth.repository', () => ({
  authRepository: {
    updateTheme: (...args: unknown[]) => updateTheme(...args),
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    register: vi.fn()
  }
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
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
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });
Object.defineProperty(globalThis, 'document', {
  value: {
    documentElement: {
      classList: { add: vi.fn(), remove: vi.fn() },
      style: { setProperty: vi.fn() },
      setAttribute: vi.fn()
    }
  }
});
Object.defineProperty(globalThis, 'window', {
  value: { matchMedia: vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn() }) }
});

const USER = { _id: 'u1', username: 'ada', email: 'ada@example.com', displayName: 'Ada', createdAt: '', updatedAt: '' };
const PENDING_KEY = 'theme-palette-pending';

// Fresh module instances per test: themeSync keeps an in-flight guard in
// module scope, and theme/auth stores are singletons.
async function load() {
  const { authStore } = await import('./auth');
  const { themeStore } = await import('./theme');
  const sync = await import('./themeSync');
  return { authStore, themeStore, ...sync };
}

describe('themeSync', () => {
  beforeEach(() => {
    localStorageMock.clear();
    updateTheme.mockReset();
    vi.resetModules();
  });

  async function loadSignedIn(user = USER) {
    const mods = await load();
    // Seed the auth store with a signed-in user via its login flow.
    const repo = await import('$lib/repositories/auth.repository');
    (repo.authRepository.login as ReturnType<typeof vi.fn>).mockResolvedValue({ token: 't', user });
    await mods.authStore.login(user.username, 'x');
    return mods;
  }

  it('applies locally without calling the API when signed out', async () => {
    const { themeStore, chooseThemePalette } = await load();

    await chooseThemePalette('ember');

    expect(get(themeStore).palette).toBe('ember');
    expect(updateTheme).not.toHaveBeenCalled();
    expect(localStorageMock.getItem(PENDING_KEY)).toBeNull();
  });

  it('saves to the account and clears the pending marker on success', async () => {
    const { themeStore, authStore, chooseThemePalette } = await loadSignedIn();
    updateTheme.mockResolvedValue({ user: { ...USER, themePalette: 'lagoon' } });

    await chooseThemePalette('lagoon');

    expect(updateTheme).toHaveBeenCalledWith('lagoon');
    expect(get(themeStore).palette).toBe('lagoon');
    expect(get(authStore).user?.themePalette).toBe('lagoon');
    expect(localStorageMock.getItem(PENDING_KEY)).toBeNull();
  });

  it('keeps the choice pending (and applied) when the save fails, e.g. offline', async () => {
    const { themeStore, chooseThemePalette } = await loadSignedIn();
    updateTheme.mockRejectedValue(new Error('offline'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await chooseThemePalette('ember');

    expect(get(themeStore).palette).toBe('ember');
    expect(JSON.parse(localStorageMock.getItem(PENDING_KEY)!)).toEqual({ userId: 'u1', palette: 'ember' });
  });

  it("adopts the account's theme on sync when nothing is pending", async () => {
    const { themeStore, syncThemeFromUser } = await load();

    syncThemeFromUser({ ...USER, themePalette: 'lagoon' });

    expect(get(themeStore).palette).toBe('lagoon');
    expect(updateTheme).not.toHaveBeenCalled();
  });

  it('does not let the server revert a pending offline choice; re-sends it instead', async () => {
    const { themeStore, syncThemeFromUser } = await load();
    localStorageMock.setItem(PENDING_KEY, JSON.stringify({ userId: 'u1', palette: 'ember' }));
    updateTheme.mockResolvedValue({ user: { ...USER, themePalette: 'ember' } });

    syncThemeFromUser({ ...USER, themePalette: 'aurora' });

    expect(get(themeStore).palette).toBe('ember');
    expect(updateTheme).toHaveBeenCalledWith('ember');
  });

  it('clears the pending marker once the server already has it', async () => {
    const { syncThemeFromUser } = await load();
    localStorageMock.setItem(PENDING_KEY, JSON.stringify({ userId: 'u1', palette: 'ember' }));

    syncThemeFromUser({ ...USER, themePalette: 'ember' });

    expect(localStorageMock.getItem(PENDING_KEY)).toBeNull();
    expect(updateTheme).not.toHaveBeenCalled();
  });

  it("ignores another account's pending choice on a shared device", async () => {
    const { themeStore, syncThemeFromUser } = await load();
    localStorageMock.setItem(PENDING_KEY, JSON.stringify({ userId: 'someone-else', palette: 'ember' }));

    syncThemeFromUser({ ...USER, themePalette: 'lagoon' });

    expect(get(themeStore).palette).toBe('lagoon');
    expect(updateTheme).not.toHaveBeenCalled();
  });

  it('never lets an older, slower save win over a newer choice', async () => {
    const { themeStore, authStore, chooseThemePalette } = await loadSignedIn();
    let resolveEmber!: () => void;
    updateTheme
      .mockImplementationOnce(() => new Promise<void>((r) => (resolveEmber = r)))
      .mockResolvedValueOnce({ user: { ...USER, themePalette: 'lagoon' } });

    const slowEmber = chooseThemePalette('ember');
    await chooseThemePalette('lagoon');
    resolveEmber();
    await slowEmber;

    expect(get(themeStore).palette).toBe('lagoon');
    expect(get(authStore).user?.themePalette).toBe('lagoon');
    expect(localStorageMock.getItem(PENDING_KEY)).toBeNull();
  });
});
