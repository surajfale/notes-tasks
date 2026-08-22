<script lang="ts">
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { validateLoginForm } from '$lib/utils/validation';
  import { ErrorMessage, Button } from '$lib/components/ui';

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

<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 sm:px-6 py-8">
  <div class="max-w-md w-full space-y-6 sm:space-y-8">
    <!-- Header -->
    <div>
      <h1 class="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-gray-100">
        Welcome Back
      </h1>
      <p class="mt-2 text-center text-sm sm:text-base text-gray-600 dark:text-gray-400">
        Sign in to your account to continue
      </p>
    </div>

    <!-- Login Form -->
    <form
      on:submit={handleSubmit}
      class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 sm:p-8 space-y-6"
    >
      <div class="space-y-4">
        <!-- Username Field -->
        <div>
          <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autocomplete="username"
            bind:value={username}
            on:input={() => clearFieldError('username')}
            disabled={isSubmitting || authLoading}
            class="appearance-none relative block w-full px-4 py-3 min-h-[44px] text-base border rounded-lg
                   placeholder-gray-400 text-gray-900 dark:text-gray-100
                   bg-white dark:bg-gray-800
                   border-gray-300 dark:border-gray-600
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                   disabled:opacity-50 disabled:cursor-not-allowed
                   {validationErrors.username ? 'border-red-500 dark:border-red-500' : ''}"
            placeholder="Enter your username"
          />
          {#if validationErrors.username}
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">
              {validationErrors.username}
            </p>
          {/if}
        </div>

        <!-- Password Field -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autocomplete="current-password"
            bind:value={password}
            on:input={() => clearFieldError('password')}
            disabled={isSubmitting || authLoading}
            class="appearance-none relative block w-full px-4 py-3 min-h-[44px] text-base border rounded-lg
                   placeholder-gray-400 text-gray-900 dark:text-gray-100
                   bg-white dark:bg-gray-800
                   border-gray-300 dark:border-gray-600
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                   disabled:opacity-50 disabled:cursor-not-allowed
                   {validationErrors.password ? 'border-red-500 dark:border-red-500' : ''}"
            placeholder="Enter your password"
          />
          {#if validationErrors.password}
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">
              {validationErrors.password}
            </p>
          {/if}
        </div>
        
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
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?
          <a href="/register" class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
            Create one now
          </a>
        </p>
      </div>
    </form>
  </div>
</div>
