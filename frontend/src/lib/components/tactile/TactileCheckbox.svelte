<script lang="ts">
  /**
   * A checkbox with real spring physics on press/release and a hand-drawn
   * SVG checkmark. WAI-ARIA checkbox pattern: Space toggles; Enter is
   * intentionally NOT wired here (in TaskItem, Enter opens the quick-note
   * drawer instead) — we preventDefault it so a focused checkbox doesn't
   * also fire the browser's native "Enter triggers click" behavior.
   *
   * Neumorphic: idle/pressed states use raised/inset shadow (neumorphic.css)
   * instead of a flat border; the checked state switches to the funky
   * per-content-type gradient + glow, since a persistent "on" state reads
   * better popped-forward than pressed-in.
   */
  import { spring } from 'svelte/motion';
  import { draw } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { playCompletionClick, triggerHaptic } from '$lib/utils/audioFeedback';
  import './neumorphic.css';

  interface Props {
    checked: boolean;
    disabled?: boolean;
    label: string;
    accent?: 'tasks' | 'notes' | 'lists';
    /** Checked-state glyph. 'terminal' swaps the drawn checkmark for a
     * monospace '×', matching the terminal persona's checkbox treatment
     * elsewhere in the app. */
    glyph?: 'check' | 'terminal';
    onToggle: (next: boolean) => void;
  }

  let { checked, disabled = false, label, accent = 'tasks', glyph = 'check', onToggle }: Props = $props();

  let isPressed = $state(false);

  // High stiffness + damping: a quick, slightly bouncy snap rather than a
  // loose wobble — the "realistic physics" the press/release should feel.
  const pressScale = spring(1, { stiffness: 0.5, damping: 0.65 });

  $effect(() => {
    pressScale.set(isPressed && !disabled ? 0.9 : 1);
  });

  function commitToggle() {
    if (disabled) return;
    const next = !checked;
    if (next) {
      playCompletionClick();
      triggerHaptic(12);
    }
    onToggle(next);
  }

  function handlePointerDown() {
    if (disabled) return;
    isPressed = true;
  }

  function handlePointerUp() {
    isPressed = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === ' ') {
      // Prevent page scroll and the native "fire click on keyup" default —
      // we drive the toggle ourselves so the press animation can bracket it.
      e.preventDefault();
      if (!disabled) isPressed = true;
    } else if (e.key === 'Enter') {
      // Not part of the checkbox keyboard pattern; let it bubble to
      // TaskItem's row handler (Enter = open the note drawer) without also
      // toggling completion here.
      e.preventDefault();
    }
  }

  function handleKeyup(e: KeyboardEvent) {
    if (e.key === ' ') {
      e.preventDefault();
      isPressed = false;
      commitToggle();
    }
  }
</script>

<button
  type="button"
  role="checkbox"
  aria-checked={checked}
  aria-label={label}
  disabled={disabled}
  class="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-xl
         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2
         focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900
         transition-shadow duration-200
         {checked ? `accent-${accent} accent-${accent}-glow` : isPressed ? 'neu-pressed' : 'neu-raised-sm'}
         {disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}"
  style="transform: scale({$pressScale})"
  onpointerdown={handlePointerDown}
  onpointerup={handlePointerUp}
  onpointerleave={handlePointerUp}
  onkeydown={handleKeydown}
  onkeyup={handleKeyup}
  onclick={commitToggle}
>
  {#if checked}
    {#if glyph === 'terminal'}
      <span class="font-mono text-xs leading-none text-white" aria-hidden="true">×</span>
    {:else}
      <svg viewBox="0 0 16 16" class="h-3.5 w-3.5 text-white" fill="none" aria-hidden="true">
        <path
          d="M3 8.5L6.5 12L13 4.5"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          in:draw={{ duration: 260, easing: cubicOut }}
        />
      </svg>
    {/if}
  {/if}
</button>
