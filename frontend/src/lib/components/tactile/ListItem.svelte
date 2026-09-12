<script lang="ts">
  /**
   * The lists counterpart to TaskItem/NoteItem — same card shell, drag
   * handle, pin toggle and Preview/Edit/AI drawer (for the description),
   * plus a color-swatch picker unique to lists: each list carries its own
   * accent color (mirroring the real List model's `color` field), chosen
   * from a small funky palette rather than the fixed per-type gradients.
   */
  import { slide } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import TactilePinButton from './TactilePinButton.svelte';
  import TactileContentDrawer from './TactileContentDrawer.svelte';
  import { triggerHaptic } from '$lib/utils/audioFeedback';
  import { LIST_SWATCHES, type TactileList } from '$lib/types/tactileList';
  import './neumorphic.css';

  interface Props {
    list: TactileList;
    isDragging?: boolean;
    dragOffsetY?: number;
    onTogglePinned: (id: string, pinned: boolean) => void;
    onDescriptionChange: (id: string, description: string) => void;
    onColorChange: (id: string, color: string) => void;
    onDragHandlePointerDown: (e: PointerEvent) => void;
  }

  let {
    list,
    isDragging = false,
    dragOffsetY = 0,
    onTogglePinned,
    onDescriptionChange,
    onColorChange,
    onDragHandlePointerDown
  }: Props = $props();

  let isExpanded = $state(false);

  // svelte-ignore state_referenced_locally
  let localDescription = $state(list.description);
  // svelte-ignore state_referenced_locally
  const descriptionFieldId = `list-description-${list.id}`;

  function handleDescriptionChange(value: string) {
    localDescription = value;
    onDescriptionChange(list.id, value);
  }

  function selectColor(color: string) {
    if (color === list.color) return;
    triggerHaptic(8);
    onColorChange(list.id, color);
  }
</script>

<div
  class="group relative flex items-start gap-3 border-l-4 p-3 transition-colors duration-300
         neu-raised {isDragging ? 'neu-dragging' : ''}
         {list.pinned ? 'list-pinned-tint border-l-emerald-500 dark:border-l-emerald-400' : 'border-l-transparent'}"
  style="
    transform: translateY({dragOffsetY}px) scale({isDragging ? 1.02 : 1}) rotate({isDragging ? 1 : 0}deg);
    transition: {isDragging ? 'none' : 'transform 200ms ease, box-shadow 200ms ease'};
    z-index: {isDragging ? 10 : 1};
  "
>
  <!-- Drag handle: pointer-driven only — same known accessibility gap as
       TaskQuickNoteList/NoteQuickList. -->
  <button
    type="button"
    aria-label={`Drag to reorder "${list.title}"`}
    class="mt-0.5 flex h-6 w-4 shrink-0 cursor-grab items-center justify-center rounded text-zinc-300
           opacity-0 transition-opacity duration-150 hover:text-zinc-500 focus-visible:opacity-100
           group-hover:opacity-100 active:cursor-grabbing dark:text-zinc-700 dark:hover:text-zinc-400"
    style="touch-action: none;"
    onpointerdown={onDragHandlePointerDown}
  >
    <svg viewBox="0 0 10 16" class="h-4 w-4" fill="currentColor" aria-hidden="true">
      <circle cx="2.5" cy="2.5" r="1.25" />
      <circle cx="7.5" cy="2.5" r="1.25" />
      <circle cx="2.5" cy="8" r="1.25" />
      <circle cx="7.5" cy="8" r="1.25" />
      <circle cx="2.5" cy="13.5" r="1.25" />
      <circle cx="7.5" cy="13.5" r="1.25" />
    </svg>
  </button>

  <div class="pt-0.5">
    <TactilePinButton
      pinned={list.pinned}
      accent="lists"
      label={list.pinned ? `Unfavorite "${list.title}"` : `Favorite "${list.title}"`}
      onToggle={(next) => onTogglePinned(list.id, next)}
    />
  </div>

  <div class="min-w-0 flex-1">
    <button
      type="button"
      class="flex w-full items-center gap-2 rounded text-left focus-visible:outline-none focus-visible:ring-2
             focus-visible:ring-zinc-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
      aria-expanded={isExpanded}
      aria-controls={descriptionFieldId}
      onclick={() => (isExpanded = !isExpanded)}
    >
      <span
        class="h-3 w-3 shrink-0 rounded-full ring-2 ring-white/60 dark:ring-black/30"
        style="background-color: {list.color}"
        aria-hidden="true"
      ></span>
      <span class="text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {list.title}
      </span>
    </button>
    {#if !isExpanded && localDescription}
      <p class="mt-0.5 truncate pl-5 text-xs text-zinc-500 dark:text-zinc-400">{localDescription}</p>
    {/if}

    {#if isExpanded}
      <div transition:slide={{ duration: 220, easing: cubicOut }} class="overflow-hidden pt-2">
        <p class="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Color</p>
        <div class="mb-3 flex flex-wrap gap-2">
          {#each LIST_SWATCHES as swatch}
            <button
              type="button"
              onclick={() => selectColor(swatch)}
              aria-label={`Set list color to ${swatch}`}
              aria-pressed={list.color === swatch}
              class="h-6 w-6 rounded-full transition-transform active:scale-90
                     {list.color === swatch ? 'ring-2 ring-offset-2 ring-zinc-900 dark:ring-zinc-100 dark:ring-offset-zinc-950' : ''}"
              style="background-color: {swatch}"
            ></button>
          {/each}
        </div>

        <TactileContentDrawer
          value={localDescription}
          onChange={handleDescriptionChange}
          kind="list"
          accent="lists"
          placeholder="What belongs in this list?"
          fieldId={descriptionFieldId}
        />
      </div>
    {/if}
  </div>
</div>
