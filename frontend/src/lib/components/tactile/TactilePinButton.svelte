<script lang="ts">
  /**
   * The notes counterpart to TactileCheckbox — same press-spring physics
   * and draw-in icon reveal, applied to a pin/star toggle instead of a
   * completion checkmark (notes don't have a "done" state, but deserve the
   * same tactile feel). Space toggles; Enter is blocked here for the same
   * reason as TactileCheckbox (reserved for NoteItem's title button).
   */
  import { spring } from 'svelte/motion';
  import { draw } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { playCompletionClick, triggerHaptic } from '$lib/utils/audioFeedback';

  interface Props {
    pinned: boolean;
    disabled?: boolean;
    label: string;
    onToggle: (next: boolean) => void;
  }

  let { pinned, disabled = false, label, onToggle }: Props = $props();

  let isPressed = $state(false);

  // Same tuning as TactileCheckbox — the two should feel identical to the
  // hand, since that consistency of physics IS the "shared style."
  const pressScale = spring(1, { stiffness: 0.5, damping: 0.65 });

  $effect(() => {
    pressScale.set(isPressed && !disabled ? 0.9 : 1);
  });

  function commitToggle() {
    if (disabled) return;
    const next = !pinned;
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
      e.preventDefault();
      if (!disabled) isPressed = true;
    } else if (e.key === 'Enter') {
      // Reserved for NoteItem's title button (Enter = open the editor).
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
  role="switch"
  aria-checked={pinned}
  aria-label={label}
  disabled={disabled}
  class="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2
         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2
         focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900
         transition-colors duration-150
         {pinned
    ? 'border-zinc-900 bg-zinc-900 dark:border-zinc-100 dark:bg-zinc-100'
    : 'border-zinc-300 bg-white hover:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-zinc-400'}
         {disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}"
  style="transform: scale({$pressScale})"
  onpointerdown={handlePointerDown}
  onpointerup={handlePointerUp}
  onpointerleave={handlePointerUp}
  onkeydown={handleKeydown}
  onkeyup={handleKeyup}
  onclick={commitToggle}
>
  {#if pinned}
    <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 text-white dark:text-zinc-900" fill="none" aria-hidden="true">
      <path
        d="M11.48 3.5a.56.56 0 011.04 0l2.12 5.11a.56.56 0 00.48.35l5.52.44c.5.04.7.66.32.99l-4.2 3.6a.56.56 0 00-.19.56l1.29 5.39a.56.56 0 01-.84.6l-4.73-2.88a.56.56 0 00-.58 0L6.98 20.54a.56.56 0 01-.84-.6l1.29-5.39a.56.56 0 00-.19-.56l-4.2-3.6a.56.56 0 01.32-.99l5.52-.44a.56.56 0 00.48-.35l2.12-5.11z"
        stroke="currentColor"
        stroke-width="1.4"
        stroke-linejoin="round"
        in:draw={{ duration: 320, easing: cubicOut }}
      />
    </svg>
  {/if}
</button>
