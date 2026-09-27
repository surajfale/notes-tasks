<script lang="ts">
  /**
   * "Personal learning project" notice for the sign-in and sign-up pages.
   *
   * Deliberately informational only: nothing about the visitor (age,
   * consent, acknowledgement) is collected or stored. On sign-up the parent
   * page can require the acknowledgement checkbox before submitting, but
   * that state lives only in the page.
   */
  export let variant: 'login' | 'register' = 'login';
  /** Sign-up only: bound "I understand" checkbox (never sent to the server). */
  export let acknowledged = false;
  export let disabled = false;
</script>

<aside
  class="rounded-2xl border border-amber-200 dark:border-amber-800/70 bg-amber-50/80 dark:bg-amber-950/40 p-4 text-sm"
  aria-labelledby="personal-use-heading"
>
  <div class="flex gap-3">
    <svg class="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <div class="space-y-1.5">
      <p id="personal-use-heading" class="font-semibold text-amber-900 dark:text-amber-100">Personal learning project</p>
      {#if variant === 'login'}
        <p class="text-amber-800 dark:text-amber-200">
          This app is built for learning and personal use. It isn't a public service and isn't intended for children.
        </p>
      {:else}
        <p class="text-amber-800 dark:text-amber-200">
          This app is built for learning and personal use only. It isn't a public service, isn't intended for
          anyone else to use, and isn't intended for children.
        </p>
        <p class="text-amber-800 dark:text-amber-200">
          There's no guarantee of availability or that data will be kept, so please don't store anything
          sensitive or important.
        </p>
      {/if}
    </div>
  </div>

  {#if variant === 'register'}
    <label class="mt-3 flex items-start gap-2.5 cursor-pointer text-amber-900 dark:text-amber-100">
      <input
        type="checkbox"
        bind:checked={acknowledged}
        {disabled}
        class="mt-0.5 h-4 w-4 rounded border-amber-400 text-primary-600 focus:ring-2 focus:ring-primary-500"
      />
      <span>I understand this is a personal learning project, not a public service.</span>
    </label>
  {/if}
</aside>
