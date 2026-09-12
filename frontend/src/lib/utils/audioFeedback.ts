/**
 * Web Audio + haptics helper for the tactile task components
 * (lib/components/tactile/*). No audio assets — the completion sound is
 * synthesized on the fly with the Web Audio API.
 */

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

const MUTE_STORAGE_KEY = 'tactile-audio-muted';

function getStoredMute(): boolean {
  if (!browser) return false;
  return localStorage.getItem(MUTE_STORAGE_KEY) === 'true';
}

/** Reactive mute state, persisted per-browser. */
export const audioMuted = writable<boolean>(getStoredMute());

if (browser) {
  audioMuted.subscribe((value) => {
    localStorage.setItem(MUTE_STORAGE_KEY, String(value));
  });
}

export function toggleAudioMute(): void {
  audioMuted.update((value) => !value);
}

let sharedContext: AudioContext | null = null;

/** Lazily creates (and resumes) a single shared AudioContext. */
function getAudioContext(): AudioContext | null {
  if (!browser) return null;

  const AudioContextCtor =
    window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;

  if (!sharedContext) {
    sharedContext = new AudioContextCtor();
  }
  if (sharedContext.state === 'suspended') {
    // Browsers suspend contexts created outside a user gesture; resuming
    // here (called from a click/keydown handler) satisfies autoplay policy.
    void sharedContext.resume();
  }
  return sharedContext;
}

/**
 * Synthesizes a crisp ~15ms mechanical click/pop: a sine oscillator
 * sweeping 800Hz -> 1400Hz under a fast exponential gain decay. Respects
 * the `audioMuted` toggle. Safe to call from anywhere (no-ops silently if
 * Web Audio is unavailable).
 */
export function playCompletionClick(): void {
  if (get(audioMuted)) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const DURATION = 0.015; // 15ms
  const now = ctx.currentTime;

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(800, now);
  oscillator.frequency.exponentialRampToValueAtTime(1400, now + DURATION);

  // exponentialRamp can't target exactly 0 — 0.0001 reads as silence.
  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + DURATION);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(now);
  oscillator.stop(now + DURATION);
  oscillator.onended = () => {
    oscillator.disconnect();
    gain.disconnect();
  };
}

/** Short haptic pulse on devices that support it; a silent no-op elsewhere. */
export function triggerHaptic(durationMs = 12): void {
  if (!browser || !('vibrate' in navigator)) return;
  try {
    navigator.vibrate(durationMs);
  } catch {
    // Some browsers throw if invoked outside a direct user gesture — ignore.
  }
}
