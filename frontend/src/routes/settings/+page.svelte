<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore, currentUser } from '$lib/stores/auth';
  import { themeStore } from '$lib/stores/theme';
  import { authRepository } from '$lib/repositories/auth.repository';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import { ErrorMessage, LoadingSpinner } from '$lib/components/ui';
  import { validatePasswordChangeForm } from '$lib/utils/validation';
  import NotificationSettings from '$lib/components/settings/NotificationSettings.svelte';

  // Track auth loading state
  let isAuthLoading = true;

  onMount(async () => {
    // Ensure auth is initialized
    await authStore.initialize();
  });

  // Subscribe to auth store to track loading state
  authStore.subscribe(state => {
    isAuthLoading = state.isLoading;
  });

  // Theme state
  let theme = { mode: 'light' as 'light' | 'dark', accentColor: '#6750A4' };
  themeStore.subscribe(value => {
    theme = value;
  });

  // Password change form
  let currentPassword = '';
  let newPassword = '';
  let confirmPassword = '';
  let passwordError = '';
  let passwordSuccess = '';
  let isChangingPassword = false;

  // Account deletion
  let showDeleteModal = false;
  let deleteConfirmation = '';
  let isDeletingAccount = false;
  let deleteError = '';

  // Predefined accent colors (Material Design 3 palette)
  const accentColors = [
    { name: 'Purple', value: '#6750A4' },
    { name: 'Blue', value: '#1976D2' },
    { name: 'Teal', value: '#00897B' },
    { name: 'Green', value: '#43A047' },
    { name: 'Orange', value: '#FB8C00' },
    { name: 'Red', value: '#E53935' },
    { name: 'Pink', value: '#D81B60' },
    { name: 'Indigo', value: '#3949AB' }
  ];

  function toggleTheme() {
    themeStore.toggleMode();
  }

  function selectAccentColor(color: string) {
    themeStore.setAccentColor(color);
  }

  async function handlePasswordChange() {
    // Reset messages
    passwordError = '';
    passwordSuccess = '';

    // Validation using centralized utility
    const { isValid, errors } = validatePasswordChangeForm({
      currentPassword,
      newPassword,
      confirmPassword
    });

    if (!isValid) {
      // Display the first error message
      passwordError = Object.values(errors)[0] || 'Validation failed';
      return;
    }

    isChangingPassword = true;

    try {
      await authRepository.changePassword({
        currentPassword,
        newPassword
      });

      passwordSuccess = 'Password changed successfully';
      currentPassword = '';
      newPassword = '';
      confirmPassword = '';
    } catch (error: any) {
      passwordError = error.message || 'Failed to change password';
    } finally {
      isChangingPassword = false;
    }
  }

  function openDeleteModal() {
    showDeleteModal = true;
    deleteConfirmation = '';
    deleteError = '';
  }

  function closeDeleteModal() {
    showDeleteModal = false;
    deleteConfirmation = '';
    deleteError = '';
  }

  async function handleAccountDeletion() {
    if (deleteConfirmation !== 'DELETE') {
      deleteError = 'Please type DELETE to confirm';
      return;
    }

    isDeletingAccount = true;
    deleteError = '';

    try {
      await authRepository.deleteAccount();
      
      // Clear all local data
      authStore.logout();
      
      // Redirect to login
      goto('/login');
    } catch (error: any) {
      deleteError = error.message || 'Failed to delete account';
      isDeletingAccount = false;
    }
  }
</script>

<div class="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
  <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 sm:mb-8">Settings</h1>

  {#if isAuthLoading}
    <!-- Loading State -->
    <div class="flex items-center justify-center py-12">
      <LoadingSpinner size="lg" />
    </div>
  {:else if $currentUser}
    <!-- User Information Section -->
    <Card class="mb-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Account Information
      </h2>
      <div class="space-y-3">
        <div>
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Username:</span>
          <span class="ml-2 text-gray-900 dark:text-gray-100">{$currentUser.username}</span>
        </div>
        <div>
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Email:</span>
          <span class="ml-2 text-gray-900 dark:text-gray-100">{$currentUser.email}</span>
        </div>
        <div>
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Display Name:</span>
          <span class="ml-2 text-gray-900 dark:text-gray-100">{$currentUser.displayName}</span>
        </div>
      </div>
    </Card>

    <!-- Theme Settings Section -->
  <Card class="mb-6">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
      Theme Settings
    </h2>
    
    <!-- Theme Mode Toggle -->
    <div class="mb-6">
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Theme Mode
      </label>
      <div class="flex items-center space-x-4">
        <button
          type="button"
          on:click={toggleTheme}
          class="flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all duration-200 {theme.mode === 'light' 
            ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span class="text-gray-900 dark:text-gray-100">Light</span>
        </button>
        
        <button
          type="button"
          on:click={toggleTheme}
          class="flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all duration-200 {theme.mode === 'dark' 
            ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          <span class="text-gray-900 dark:text-gray-100">Dark</span>
        </button>
      </div>
    </div>

    <!-- Accent Color Picker -->
    <div>
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Accent Color
      </label>
      <div class="grid grid-cols-4 sm:grid-cols-8 gap-3">
        {#each accentColors as color}
          <button
            type="button"
            on:click={() => selectAccentColor(color.value)}
            class="w-12 h-12 rounded-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 {theme.accentColor === color.value ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-gray-100' : ''}"
            style="background-color: {color.value}"
            title={color.name}
            aria-label={`Select ${color.name} accent color`}
          >
            {#if theme.accentColor === color.value}
              <svg class="w-6 h-6 mx-auto text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  </Card>

  <!-- Notification Settings Section -->
  <NotificationSettings />

  <!-- Password Change Section -->
  <Card class="mb-6">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
      Change Password
    </h2>
    
    <form on:submit|preventDefault={handlePasswordChange} class="space-y-4">
      <Input
        label="Current Password"
        type="password"
        bind:value={currentPassword}
        placeholder="Enter current password"
        required
      />
      
      <Input
        label="New Password"
        type="password"
        bind:value={newPassword}
        placeholder="Enter new password (min 6 characters)"
        required
      />
      
      <Input
        label="Confirm New Password"
        type="password"
        bind:value={confirmPassword}
        placeholder="Confirm new password"
        required
      />

      {#if passwordError}
        <ErrorMessage
          title="Password Change Failed"
          message={passwordError}
          showRetry={true}
          on:retry={handlePasswordChange}
        />
      {/if}

      {#if passwordSuccess}
        <div class="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p class="text-sm text-green-600 dark:text-green-400">{passwordSuccess}</p>
        </div>
      {/if}

      <Button
        type="submit"
        variant="primary"
        disabled={isChangingPassword}
      >
        {#if isChangingPassword}
          <span class="flex items-center gap-2">
            <LoadingSpinner size="sm" color="white" />
            Changing Password...
          </span>
        {:else}
          Change Password
        {/if}
      </Button>
    </form>
  </Card>

  <!-- Account Deletion Section -->
  <Card class="border-red-200 dark:border-red-800">
    <h2 class="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">
      Danger Zone
    </h2>
    
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
      Once you delete your account, there is no going back. This will permanently delete your account and all associated data including notes, tasks, and lists.
    </p>

    <Button
      variant="danger"
      on:click={openDeleteModal}
    >
      Delete Account
    </Button>
  </Card>

  <!-- Account Deletion Confirmation Modal -->
  <Modal
    bind:open={showDeleteModal}
    title="Delete Account"
    onClose={closeDeleteModal}
  >
    <div class="space-y-4">
      <p class="text-gray-700 dark:text-gray-300">
        This action cannot be undone. This will permanently delete your account and all associated data.
      </p>

      <p class="text-sm text-gray-600 dark:text-gray-400">
        Please type <strong class="text-red-600 dark:text-red-400">DELETE</strong> to confirm:
      </p>

      <Input
        type="text"
        bind:value={deleteConfirmation}
        placeholder="Type DELETE to confirm"
      />

      {#if deleteError}
        <ErrorMessage
          title="Account Deletion Failed"
          message={deleteError}
          showRetry={false}
        />
      {/if}
    </div>

    <div slot="footer" class="flex justify-end space-x-3">
      <Button
        variant="secondary"
        on:click={closeDeleteModal}
        disabled={isDeletingAccount}
      >
        Cancel
      </Button>
      <Button
        variant="danger"
        on:click={handleAccountDeletion}
        disabled={isDeletingAccount || deleteConfirmation !== 'DELETE'}
      >
        {#if isDeletingAccount}
          <span class="flex items-center gap-2">
            <LoadingSpinner size="sm" color="white" />
            Deleting...
          </span>
        {:else}
          Delete Account
        {/if}
      </Button>
    </div>
  </Modal>
  {:else}
    <!-- Not logged in -->
    <div class="text-center py-12">
      <p class="text-gray-600 dark:text-gray-400">Please log in to view settings.</p>
    </div>
  {/if}
</div>

