<script lang="ts">
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { RegisterData, RegistrationMode } from '$lib/types/user';
  import { validateRegisterForm } from '$lib/utils/validation';
  import { ErrorMessage, Button, Input, PersonalUseNotice } from '$lib/components/ui';
  import '$lib/components/tactile/neumorphic.css';

  // Form state
  let username = '';
  let email = '';
  let password = '';
  let confirmPassword = '';
  let displayName = '';
  let validationErrors: {
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    displayName?: string;
    inviteCode?: string;
  } = {};
  // Invite code (only asked for when sign-up is invite-only).
  let inviteCode = '';
  // null while loading; the server enforces this, the page only adapts to it.
  let registrationMode: RegistrationMode | null = null;
  let isSubmitting = false;
  // Personal-use acknowledgement: page-local only, never sent to the API.
  let acknowledged = false;

  // Subscribe to auth store for error messages
  let authError: string | null = null;
  let authLoading = false;

  const unsubscribe = authStore.subscribe(state => {
    authError = state.error;
    authLoading = state.isLoading;
  });

  onMount(() => {
    authStore.getRegistrationMode().then((mode) => (registrationMode = mode));
    return () => {
      unsubscribe();
    };
  });

  /**
   * Validate form fields
   */
  function validateForm(): boolean {
    const result = validateRegisterForm({
      username,
      email,
      password,
      confirmPassword,
      displayName
    });
    validationErrors = result.errors;
    if (registrationMode === 'invite' && !inviteCode.trim()) {
      validationErrors = { ...validationErrors, inviteCode: 'Enter the invite code you were given' };
      return false;
    }
    return result.isValid;
  }

  /**
   * Handle form submission
   */
  async function handleSubmit(event: Event) {
    event.preventDefault();
    if (!acknowledged) return;
    
    // Clear previous errors
    authStore.clearError();
    validationErrors = {};

    // Validate form
    if (!validateForm()) {
      return;
    }

    isSubmitting = true;

    try {
      const registerData: RegisterData = {
        username: username.trim(),
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        ...(registrationMode === 'invite' ? { inviteCode: inviteCode.trim() } : {})
      };

      const success = await authStore.register(registerData);
      
      if (success) {
        // Redirect to home page on successful registration
        goto('/');
      }
    } finally {
      isSubmitting = false;
    }
  }

  /**
   * Clear validation error when user starts typing
   */
  function clearFieldError(field: keyof typeof validationErrors) {
    validationErrors = { ...validationErrors, [field]: undefined };
    authStore.clearError();
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 px-4 sm:px-6 py-8 sm:py-12">
  <div class="max-w-md w-full space-y-6 sm:space-y-8">
    <!-- Header -->
    <div>
      <h1 class="font-serif text-2xl sm:text-3xl font-bold text-center text-stone-900 dark:text-stone-100">
        Create Account
      </h1>
      {#if registrationMode !== 'closed'}
        <p class="mt-2 text-center text-sm sm:text-base text-stone-600 dark:text-stone-400">
          Sign up to start organizing your notes and tasks
        </p>
      {/if}
    </div>

    {#if registrationMode === null}
      <div class="neu-raised p-8 flex justify-center" aria-busy="true">
        <div class="h-6 w-6 rounded-full border-2 border-stone-300 border-t-primary-600 animate-spin" aria-hidden="true"></div>
        <span class="sr-only">Loading…</span>
      </div>
    {:else if registrationMode === 'closed'}
      <!-- Sign-up is closed on the server (backend/src/config/registration.js) -->
      <div class="neu-raised p-6 sm:p-8 text-center space-y-4">
        <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100">Sign-up is closed</h2>
        <p class="text-sm text-stone-600 dark:text-stone-400">
          This is a personal learning project and isn't taking new accounts.
        </p>
        <a
          href="/login"
          class="inline-block font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
        >
          Already have an account? Sign in
        </a>
      </div>
    {:else}
    <!-- Registration Form -->
    <form
      on:submit={handleSubmit}
      class="neu-raised p-6 sm:p-8 space-y-6"
    >
      <div class="space-y-4">
        <Input
          id="username"
          name="username"
          type="text"
          label="Username"
          autocomplete="username"
          bind:value={username}
          on:input={() => clearFieldError('username')}
          disabled={isSubmitting || authLoading}
          error={validationErrors.username}
          placeholder="Choose a username"
        />

        <Input
          id="email"
          name="email"
          type="email"
          label="Email"
          autocomplete="email"
          bind:value={email}
          on:input={() => clearFieldError('email')}
          disabled={isSubmitting || authLoading}
          error={validationErrors.email}
          placeholder="your.email@example.com"
        />

        <Input
          id="displayName"
          name="displayName"
          type="text"
          label="Display Name"
          autocomplete="name"
          bind:value={displayName}
          on:input={() => clearFieldError('displayName')}
          disabled={isSubmitting || authLoading}
          error={validationErrors.displayName}
          placeholder="Your name"
        />

        <Input
          id="password"
          name="password"
          type="password"
          label="Password"
          autocomplete="new-password"
          bind:value={password}
          on:input={() => clearFieldError('password')}
          disabled={isSubmitting || authLoading}
          error={validationErrors.password}
          hint={validationErrors.password ? '' : 'Must be at least 8 characters with uppercase, lowercase, and numbers'}
          placeholder="Create a strong password"
        />

        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirm Password"
          autocomplete="new-password"
          bind:value={confirmPassword}
          on:input={() => clearFieldError('confirmPassword')}
          disabled={isSubmitting || authLoading}
          error={validationErrors.confirmPassword}
          placeholder="Confirm your password"
        />

        {#if registrationMode === 'invite'}
          <Input
            id="inviteCode"
            name="inviteCode"
            type="text"
            label="Invite code"
            autocomplete="off"
            bind:value={inviteCode}
            on:input={() => clearFieldError('inviteCode')}
            disabled={isSubmitting || authLoading}
            error={validationErrors.inviteCode}
            placeholder="Code from the owner of this app"
          />
        {/if}
      </div>

      <!-- Error Message from Auth Store -->
      {#if authError}
        <ErrorMessage
          title="Registration Failed"
          message={authError}
          showRetry={true}
          on:retry={handleSubmit}
        />
      {/if}

      <!-- Personal-use notice. The checkbox only gates this form; nothing
           about it (or the visitor's age) is sent or stored. -->
      <PersonalUseNotice variant="register" bind:acknowledged disabled={isSubmitting || authLoading} />

      <!-- Submit Button -->
      <Button type="submit" variant="primary" fullWidth loading={isSubmitting || authLoading} disabled={!acknowledged}>
        {isSubmitting || authLoading ? 'Creating account...' : 'Create Account'}
      </Button>

      <!-- Login Link -->
      <div class="text-center">
        <p class="text-sm text-stone-600 dark:text-stone-400">
          Already have an account?
          <a href="/login" class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
            Sign in instead
          </a>
        </p>
      </div>
    </form>
    {/if}
  </div>
</div>
