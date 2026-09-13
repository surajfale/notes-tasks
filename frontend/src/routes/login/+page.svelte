<script lang="ts">
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { validateLoginForm } from '$lib/utils/validation';
  import { ErrorMessage, Button, Input } from '$lib/components/ui';
  import '$lib/components/tactile/neumorphic.css';

  // Form state
  let username = '';
  let password = '';
  let validationErrors: { username?: string; password?: string } = {};
  let isSubmitting = false;

  // Subscribe to auth store for error messages
  let authError: string | null = null;
  let authLoading = false;

  const unsubscribe = authStore.subscribe(state => {
    authError = state.error;
    authLoading = state.isLoading;
  });

  onMount(() => {
    return () => {
      unsubscribe();
    };
  });

  /**
   * Validate form fields
   */
  function validateForm(): boolean {
    const result = validateLoginForm({ username, password });
    validationErrors = result.errors;
    return result.isValid;
  }

  /**
   * Handle form submission
   */
  async function handleSubmit(event: Event) {
    event.preventDefault();
    
    // Clear previous errors
    authStore.clearError();
    validationErrors = {};

    // Validate form
    if (!validateForm()) {
      return;
    }

    isSubmitting = true;

    try {
      const success = await authStore.login(username, password);
      
      if (success) {
        // Redirect to home page on successful login
        goto('/');
      }
    } finally {
      isSubmitting = false;
    }
  }

  /**
   * Clear validation error when user starts typing
   */
  function clearFieldError(field: 'username' | 'password') {
    validationErrors = { ...validationErrors, [field]: undefined };
    authStore.clearError();
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 px-4 sm:px-6 py-8">
  <div class="max-w-md w-full space-y-6 sm:space-y-8">
    <!-- Header -->
    <div>
      <h1 class="font-serif text-2xl sm:text-3xl font-bold text-center text-stone-900 dark:text-stone-100">
        Welcome Back
      </h1>
      <p class="mt-2 text-center text-sm sm:text-base text-stone-600 dark:text-stone-400">
        Sign in to your account to continue
      </p>
    </div>

    <!-- Login Form -->
    <form
      on:submit={handleSubmit}
      class="neu-raised p-6 sm:p-8 space-y-6"
    >
      <div class="space-y-4">
        <!-- Username Field -->
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
          placeholder="Enter your username"
        />

        <!-- Password Field -->
        <Input
          id="password"
          name="password"
          type="password"
          label="Password"
          autocomplete="current-password"
          bind:value={password}
          on:input={() => clearFieldError('password')}
          disabled={isSubmitting || authLoading}
          error={validationErrors.password}
          placeholder="Enter your password"
        />

        <div class="flex items-center justify-end">
          <div class="text-sm">
            <a href="/forgot-password" class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
              Forgot your password?
            </a>
          </div>
        </div>
      </div>

      <!-- Error Message from Auth Store -->
      {#if authError}
        <ErrorMessage
          title="Login Failed"
          message={authError}
          showRetry={true}
          on:retry={handleSubmit}
        />
      {/if}

      <!-- Submit Button -->
      <Button type="submit" variant="primary" fullWidth loading={isSubmitting || authLoading}>
        {isSubmitting || authLoading ? 'Signing in...' : 'Sign in'}
      </Button>

      <!-- Register Link -->
      <div class="text-center">
        <p class="text-sm text-stone-600 dark:text-stone-400">
          Don't have an account?
          <a href="/register" class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
            Create one now
          </a>
        </p>
      </div>
    </form>
  </div>
</div>
