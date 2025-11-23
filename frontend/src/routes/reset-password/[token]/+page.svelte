<script lang="ts">
  import { page } from '$app/stores';
  import { authRepository } from '$lib/repositories/auth.repository';
  import { ErrorMessage } from '$lib/components/ui';
  import { goto } from '$app/navigation';

  let newPassword = '';
  let confirmPassword = '';
  let isSubmitting = false;
  let error: string | null = null;
  let success = false;

  const token = $page.params.token;

  async function handleSubmit(event: Event) {
    event.preventDefault();
    
    if (newPassword !== confirmPassword) {
      error = 'Passwords do not match';
      return;
    }

    if (newPassword.length < 8) {
        error = 'Password must be at least 8 characters long';
        return;
    }
    
    isSubmitting = true;
    error = null;

    try {
      await authRepository.resetPassword({ token, newPassword });
      success = true;
      setTimeout(() => {
        goto('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Reset password error:', err);
      error = err.message || 'Failed to reset password. The link may be invalid or expired.';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 py-8">
  <div class="max-w-md w-full space-y-6 sm:space-y-8">
    <div>
      <h1 class="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-gray-100">
        Reset Password
      </h1>
      <p class="mt-2 text-center text-sm sm:text-base text-gray-600 dark:text-gray-400">
        Enter your new password below.
      </p>
    </div>

    {#if success}
      <div class="rounded-md bg-green-50 p-4 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-green-800 dark:text-green-200">
              Password Reset Successful
            </h3>
            <div class="mt-2 text-sm text-green-700 dark:text-green-300">
              <p>Your password has been updated. Redirecting to login...</p>
            </div>
          </div>
        </div>
      </div>
    {:else}
      <form on:submit={handleSubmit} class="mt-8 space-y-6">
        <div class="space-y-4">
          <div>
            <label for="newPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              minlength="8"
              bind:value={newPassword}
              disabled={isSubmitting}
              class="appearance-none relative block w-full px-4 py-3 min-h-[44px] text-base border rounded-lg
                     placeholder-gray-400 text-gray-900 dark:text-gray-100
                     bg-white dark:bg-gray-800
                     border-gray-300 dark:border-gray-600
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minlength="8"
              bind:value={confirmPassword}
              disabled={isSubmitting}
              class="appearance-none relative block w-full px-4 py-3 min-h-[44px] text-base border rounded-lg
                     placeholder-gray-400 text-gray-900 dark:text-gray-100
                     bg-white dark:bg-gray-800
                     border-gray-300 dark:border-gray-600
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Confirm new password"
            />
          </div>
        </div>

        {#if error}
          <ErrorMessage
            title="Error"
            message={error}
            showRetry={false}
          />
        {/if}

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            class="group relative w-full flex justify-center py-3 px-4 min-h-[44px] border border-transparent
                   text-base font-medium rounded-lg text-white
                   bg-primary-600 hover:bg-primary-700
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors duration-200"
          >
            {#if isSubmitting}
              <span class="flex items-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Resetting...
              </span>
            {:else}
              Reset Password
            {/if}
          </button>
        </div>
      </form>
    {/if}
  </div>
</div>
