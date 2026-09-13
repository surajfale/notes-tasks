/**
 * UI Persona Store
 *
 * The persona ("focus" | "vivid" | "terminal") drives the app's whole visual
 * identity as one unit: neutral palette / font pairing / radius-shadow
 * treatment (app.css, via a `data-persona` attribute on <html>) AND accent
 * color (theme.ts's --primary-* shades) together, plus gating persona-specific
 * features (Focus shortcuts, Vivid celebrations, Terminal command palette).
 * Accent used to be a separate, freely-chosen axis (a Settings color picker)
 * layered independently on top of whichever persona was active — collapsed
 * into PERSONA_ACCENTS below so each of the 3 personas is one complete,
 * curated look rather than persona-shape × arbitrary-accent producing
 * combinations nobody validated. theme.ts's light/dark mode is still the one
 * remaining independent axis. Persisted on the User document on the backend
 * so it follows the account across devices; localStorage is only a fast-paint
 * cache to avoid a flash of the default persona before /auth/me resolves.
 */

import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { authRepository } from '$lib/repositories/auth.repository';
import { authStore } from './auth';
import { themeStore } from './theme';
import type { UiPersona } from '$lib/types/user';

const PERSONA_KEY = 'ui-persona';
const VALID_PERSONAS: UiPersona[] = ['focus', 'vivid', 'terminal'];
const DEFAULT_PERSONA: UiPersona = 'focus';

/**
 * Each persona's one curated accent — picked from real, validated palette
 * matches (ui-ux-pro-max skill data) rather than an arbitrary hex:
 * - focus: amber, matching the "Notes & Writing App" reference palette and
 *   the app's own accent-links hue.
 * - vivid: rose, a bold pink duotone against Vivid's violet-tinted neutral
 *   base (the "Creative Agency" pairing) — its boldest, most "Vivid" option.
 * - terminal: matrix green, the closest thing to a canonical terminal accent
 *   (appeared in 3 of 4 dark developer-tool palettes queried).
 */
const PERSONA_ACCENTS: Record<UiPersona, string> = {
  focus: '#D97706',
  vivid: '#DB2777',
  terminal: '#22C55E'
};

function isValidPersona(value: unknown): value is UiPersona {
  return typeof value === 'string' && (VALID_PERSONAS as string[]).includes(value);
}

function getStoredPersona(): UiPersona {
  if (!browser) return DEFAULT_PERSONA;
  const stored = localStorage.getItem(PERSONA_KEY);
  return isValidPersona(stored) ? stored : DEFAULT_PERSONA;
}

function applyPersonaToDocument(persona: UiPersona): void {
  if (!browser) return;
  document.documentElement.setAttribute('data-persona', persona);
  themeStore.setAccentColor(PERSONA_ACCENTS[persona]);
}

function createPersonaStore() {
  const initial = getStoredPersona();
  const { subscribe, set } = writable<UiPersona>(initial);

  if (browser) {
    applyPersonaToDocument(initial);
  }

  return {
    subscribe,

    /**
     * Sync the store from the authenticated user's saved persona.
     * Call whenever the current user changes (login, app init, logout).
     */
    syncFromUser(persona: UiPersona | null | undefined): void {
      const resolved = isValidPersona(persona) ? persona : DEFAULT_PERSONA;
      set(resolved);
      applyPersonaToDocument(resolved);
      if (browser) localStorage.setItem(PERSONA_KEY, resolved);
    },

    /**
     * User explicitly picks a persona (onboarding or Settings). Applies
     * immediately and persists to localStorage, then syncs to the backend
     * so the choice follows the account across devices.
     */
    async choose(persona: UiPersona): Promise<void> {
      set(persona);
      applyPersonaToDocument(persona);
      if (browser) localStorage.setItem(PERSONA_KEY, persona);

      try {
        const { user } = await authRepository.updatePersona(persona);
        authStore.updateUser(user);
      } catch (error) {
        // Keep the optimistic local choice even if the sync call fails —
        // the next syncFromUser()/choose() call will reconcile it.
        console.error('Failed to sync persona to server:', error);
      }
    }
  };
}

export const personaStore = createPersonaStore();
export const PERSONA_OPTIONS = VALID_PERSONAS;
export { DEFAULT_PERSONA, PERSONA_ACCENTS };
