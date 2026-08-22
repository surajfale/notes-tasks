<script lang="ts">
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { RegisterData } from '$lib/types/user';
  import { validateRegisterForm } from '$lib/utils/validation';
  import { ErrorMessage, Button } from '$lib/components/ui';

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
  } = {};
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
    const result = validateRegisterForm({
      username,
      email,
      password,
      confirmPassword,
      displayName
    });
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
      const registerData: RegisterData = {
        username: username.trim(),
        email: email.trim(),
        password,
        displayName: displayName.trim()
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
      <p class="mt-2 text-center text-sm sm:text-base text-stone-600 dark:text-stone-400">
        Sign up to start organizing your notes and tasks
      </p>
    </div>

    <!-- Registration Form -->
    <form
      on:submit={handleSubmit}
      class="bg-stone-50 dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 p-6 sm:p-8 space-y-6"
    >
      <div class="space-y-4">
        <!-- Username Field -->
        <div>
          <label for="username" class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
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
                   placeholder-stone-400 text-stone-900 dark:text-stone-100
                   bg-stone-50 dark:bg-stone-800
                   border-stone-300 dark:border-stone-600
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                   disabled:opacity-50 disabled:cursor-not-allowed
                   {validationErrors.username ? 'border-red-500 dark:border-red-500' : ''}"
            placeholder="Choose a username"
          />
          {#if validationErrors.username}
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">
              {validationErrors.username}
            </p>
          {/if}
        </div>

        <!-- Email Field -->
        <div>
          <label for="email" class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autocomplete="email"
            bind:value={email}
            on:input={() => clearFieldError('email')}
            disabled={isSubmitting || authLoading}
            class="appearance-none relative block w-full px-3 py-2 border rounded-lg
                   placeholder-stone-400 text-stone-900 dark:text-stone-100
                   bg-stone-50 dark:bg-stone-800
                   border-stone-300 dark:border-stone-600
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                   disabled:opacity-50 disabled:cursor-not-allowed
                   {validationErrors.email ? 'border-red-500 dark:border-red-500' : ''}"
            placeholder="your.email@example.com"
          />
          {#if validationErrors.email}
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">
              {validationErrors.email}
            </p>
          {/if}
        </div>

        <!-- Display Name Field -->
        <div>
          <label for="displayName" class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
            Display Name
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            autocomplete="name"
            bind:value={displayName}
            on:input={() => clearFieldError('displayName')}
            disabled={isSubmitting || authLoading}
            class="appearance-none relative block w-full px-3 py-2 border rounded-lg
                   placeholder-stone-400 text-stone-900 dark:text-stone-100
                   bg-stone-50 dark:bg-stone-800
                   border-stone-300 dark:border-stone-600
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                   disabled:opacity-50 disabled:cursor-not-allowed
                   {validationErrors.displayName ? 'border-red-500 dark:border-red-500' : ''}"
            placeholder="Your name"
          />
          {#if validationErrors.displayName}
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">
              {validationErrors.displayName}
            </p>
          {/if}
        </div>

        <!-- Password Field -->
        <div>
          <label for="password" class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autocomplete="new-password"
            bind:value={password}
            on:input={() => clearFieldError('password')}
            disabled={isSubmitting || authLoading}
            class="appearance-none relative block w-full px-3 py-2 border rounded-lg
                   placeholder-stone-400 text-stone-900 dark:text-stone-100
                   bg-stone-50 dark:bg-stone-800
                   border-stone-300 dark:border-stone-600
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                   disabled:opacity-50 disabled:cursor-not-allowed
                   {validationErrors.password ? 'border-red-500 dark:border-red-500' : ''}"
            placeholder="Create a strong password"
          />
          {#if validationErrors.password}
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">
              {validationErrors.password}
            </p>
          {:else}
            <p class="mt-1 text-xs text-stone-500 dark:text-stone-400">
              Must be at least 8 characters with uppercase, lowercase, and numbers
            </p>
          {/if}
        </div>

        <!-- Confirm Password Field -->
        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autocomplete="new-password"
            bind:value={confirmPassword}
            on:input={() => clearFieldError('confirmPassword')}
            disabled={isSubmitting || authLoading}
            class="appearance-none relative block w-full px-3 py-2 border rounded-lg
                   placeholder-stone-400 text-stone-900 dark:text-stone-100
                   bg-stone-50 dark:bg-stone-800
                   border-stone-300 dark:border-stone-600
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                   disabled:opacity-50 disabled:cursor-not-allowed
                   {validationErrors.confirmPassword ? 'border-red-500 dark:border-red-500' : ''}"
            placeholder="Confirm your password"
          />
          {#if validationErrors.confirmPassword}
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">
              {validationErrors.confirmPassword}
            </p>
          {/if}
        </div>
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

      <!-- Submit Button -->
      <Button type="submit" variant="primary" fullWidth loading={isSubmitting || authLoading}>
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
  </div>
</div>
