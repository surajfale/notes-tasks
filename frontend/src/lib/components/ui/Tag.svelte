<script lang="ts">
  import { getTagColor } from '$lib/utils/tagColors';

  export let tag: string;
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let clickable: boolean = false;
  export let selected: boolean = false;

  $: colors = getTagColor(tag);
  
  $: sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  }[size];
</script>

{#if clickable}
  <button
    type="button"
    class="inline-flex items-center rounded-md font-medium transition-all
           {colors.bg} {colors.text} {sizeClasses}
           cursor-pointer hover:opacity-80 hover:scale-105
           {selected ? `ring-2 ${colors.border}` : ''}"
    on:click
  >
    #{tag}
  </button>
{:else}
  <span
    class="inline-flex items-center rounded-md font-medium transition-all
           {colors.bg} {colors.text} {sizeClasses}
           {selected ? `ring-2 ${colors.border}` : ''}"
  >
    #{tag}
  </span>
{/if}
