/**
 * Account sync for the color theme.
 *
 * themeStore (theme.ts) owns applying the theme and caching it per device;
 * this module keeps that in step with the account's `themePalette` so the
 * choice follows the user across devices. Light/dark mode is deliberately
 * NOT synced — it stays per device.
 *
 * Offline-first, like the rest of the app: a choice applies locally at once
 * and is recorded as "pending" (tagged with the user's id, so it can never
 * leak into a different account on a shared device) until the server
 * confirms it. While a choice is pending, it wins over whatever the server
 * last returned, and it's re-sent on the next sync (app load / login) —
 * so a change made offline isn't reverted by the server's older value.
 */

import { get } from 'svelte/store';
import { browser } from '$app/environment';
import { authRepository } from '$lib/repositories/auth.repository';
import { authStore } from './auth';
import { themeStore, THEME_PALETTES, type ThemePalette } from './theme';
import type { User } from '$lib/types/user';

const PENDING_KEY = 'theme-palette-pending';

interface PendingChoice {
  userId: string;
  palette: ThemePalette;
}

// Palette whose save request is currently in flight, to avoid re-sending the
// same choice when the user object changes mid-request.
let inFlight: ThemePalette | null = null;

function isPalette(value: unknown): value is ThemePalette {
  return typeof value === 'string' && value in THEME_PALETTES;
}

function readPending(userId: string): ThemePalette | null {
  if (!browser) return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(PENDING_KEY) ?? 'null') as PendingChoice | null;
    return parsed && parsed.userId === userId && isPalette(parsed.palette) ? parsed.palette : null;
  } catch {
    return null;
  }
}

function writePending(choice: PendingChoice | null): void {
  if (!browser) return;
  if (choice) localStorage.setItem(PENDING_KEY, JSON.stringify(choice));
  else localStorage.removeItem(PENDING_KEY);
}

async function pushToServer(userId: string, palette: ThemePalette): Promise<void> {
  inFlight = palette;
  try {
    await authRepository.updateTheme(palette);
    // Only settle if this is still the latest choice: with rapid clicks an
    // older request can finish after a newer one, and must not win.
    if (readPending(userId) === palette) {
      writePending(null);
      authStore.updateUser({ themePalette: palette });
    }
  } catch (error) {
    // Stay pending; the next syncThemeFromUser() retries it.
    console.error('Failed to save color theme to your account:', error);
  } finally {
    if (inFlight === palette) inFlight = null;
  }
}

/**
 * The user explicitly picks a color theme (Settings, command palette).
 * Applies immediately; saves to the account when signed in.
 */
export async function chooseThemePalette(palette: ThemePalette): Promise<void> {
  themeStore.setPalette(palette);

  const user = get(authStore).user;
  if (!user) return;

  writePending({ userId: user._id, palette });
  await pushToServer(user._id, palette);
}

/**
 * Reconcile the device with the signed-in account. Call whenever the current
 * user changes (app load, login, profile refresh).
 */
export function syncThemeFromUser(user: User | null): void {
  if (!user) return;

  const pending = readPending(user._id);
  if (pending) {
    if (pending === user.themePalette) {
      writePending(null);
    } else {
      themeStore.setPalette(pending);
      if (inFlight !== pending) void pushToServer(user._id, pending);
      return;
    }
  }

  if (isPalette(user.themePalette) && user.themePalette !== get(themeStore).palette) {
    themeStore.setPalette(user.themePalette);
  }
}
