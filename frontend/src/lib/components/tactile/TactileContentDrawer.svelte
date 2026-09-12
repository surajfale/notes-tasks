<script lang="ts">
  /**
   * The Preview/Edit/AI drawer shared by TaskItem, NoteItem, and ListItem's
   * expandable content area. Opens in Preview by default (rendered via the
   * app's real MarkdownRenderer — plain, dependency-free, safe to reuse
   * outside the store/repository layer) with a segmented toggle into Edit,
   * plus a simulated "AI tidy-up" — see mockAiEnhance.ts for why this isn't
   * a real backend call.
   */
  import MarkdownRenderer from '$lib/components/ui/MarkdownRenderer.svelte';
  import { mockEnhanceText } from '$lib/utils/mockAiEnhance';
  import './neumorphic.css';

  interface Props {
    value: string;
    onChange: (value: string) => void;
    kind: 'note' | 'task' | 'list';
    accent: 'tasks' | 'notes' | 'lists';
    placeholder?: string;
    fieldId: string;
  }

  let { value, onChange, kind, accent, placeholder = 'Write something…', fieldId }: Props = $props();

  let mode = $state<'preview' | 'edit'>('preview');
  let isEnhancing = $state(false);
  let justEnhanced = $state(false);

  async function handleEnhance() {
    if (isEnhancing) return;
    isEnhancing = true;
    try {
      const result = await mockEnhanceText(value, kind);
      onChange(result);
      mode = 'preview';
      justEnhanced = true;
      setTimeout(() => {
        justEnhanced = false;
      }, 900);
    } finally {
      isEnhancing = false;
    }
  }
</script>

<div id={fieldId} class="pt-1">
  <div class="mb-2 flex items-center justify-between gap-2">
    <div class="neu-pressed inline-flex gap-0.5 p-0.5">
      <button
        type="button"
        onclick={() => (mode = 'preview')}
        class="rounded-[10px] px-2.5 py-1 text-xs font-medium transition-colors
               {mode === 'preview' ? 'neu-raised-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'}"
      >
        Preview
      </button>
      <button
        type="button"
        onclick={() => (mode = 'edit')}
        class="rounded-[10px] px-2.5 py-1 text-xs font-medium transition-colors
               {mode === 'edit' ? 'neu-raised-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'}"
      >
        Edit
      </button>
    </div>

    <button
      type="button"
      onclick={handleEnhance}
      disabled={isEnhancing}
      title="Simulated AI cleanup for this demo — not a real model call"
      class="accent-{accent} flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white
             transition-transform active:scale-95 disabled:cursor-wait disabled:opacity-80"
    >
      {#if isEnhancing}
        <span class="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true"></span>
        Thinking…
      {:else}
        ✨ AI tidy-up
      {/if}
    </button>
  </div>

  <div
    class="relative overflow-hidden rounded-xl transition-shadow duration-300
           {isEnhancing ? 'tactile-ai-shimmer' : ''} {justEnhanced ? `accent-${accent}-glow` : ''}"
  >
    {#if mode === 'preview'}
      <div class="neu-pressed min-h-[3.5rem] px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-300">
        {#if value.trim()}
          <MarkdownRenderer content={value} />
        {:else}
          <p class="italic text-zinc-400 dark:text-zinc-600">Nothing here yet — switch to Edit or try AI tidy-up.</p>
        {/if}
      </div>
    {:else}
      <textarea
        {value}
        oninput={(e) => onChange(e.currentTarget.value)}
        {placeholder}
        rows="3"
        class="neu-pressed w-full resize-none px-3 py-2.5 text-sm text-zinc-700 placeholder-zinc-400
               focus-visible:outline-none dark:text-zinc-300 dark:placeholder-zinc-600"
      ></textarea>
    {/if}
  </div>
</div>
