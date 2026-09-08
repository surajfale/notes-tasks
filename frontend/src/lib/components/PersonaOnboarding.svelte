<script lang="ts">
  import { personaStore } from '$lib/stores/persona';
  import PersonaPicker from '$lib/components/settings/PersonaPicker.svelte';

  let skipping = false;

  async function skip() {
    if (skipping) return;
    skipping = true;
    try {
      // "Skip" just confirms the default (Focus) — this also flips
      // personaOnboarded server-side so the overlay won't show again.
      await personaStore.choose('focus');
    } finally {
      skipping = false;
    }
  }
</script>

<!-- Full-screen, blocking: shown once per account until a persona is chosen
     or skipped (User.personaOnboarded). Closes itself reactively — see
     +layout.svelte's `needsPersonaOnboarding`, which flips false as soon as
     PersonaPicker's choose() updates the current user. -->
<div class="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/60 backdrop-blur-sm p-4">
  <div class="w-full max-w-lg bg-stone-50 dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-xl">
    <h1 class="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1.5">
      How do you like to work?
    </h1>
    <p class="text-sm text-stone-500 dark:text-stone-400 mb-5">
      Pick a style for Notes &amp; Tasks — you can change this anytime in Settings.
    </p>

    <PersonaPicker />

    <div class="mt-5 text-center">
      <button
        type="button"
        on:click={skip}
        disabled={skipping}
        class="text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 underline underline-offset-2 disabled:opacity-50"
      >
        {skipping ? 'Setting up…' : 'Skip for now, use the default'}
      </button>
    </div>
  </div>
</div>
