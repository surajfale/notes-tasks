<script lang="ts">
  import { onMount } from 'svelte';
  import { notificationStore } from '$lib/stores/notifications';
  import { Button, Card, LoadingSpinner, ErrorMessage } from '$lib/components/ui';
  import type { NotificationPreferences } from '$lib/types/notification';
  import { pushNotificationManager } from '$lib/services/pushNotificationManager';
  import '$lib/components/tactile/neumorphic.css';

  // Component state
  let isLoading = false;
  let isSaving = false;
  let error = '';
  let success = '';
  let hasChanges = false;

  // Form state
  let emailNotificationsEnabled = true;
  let browserNotificationsEnabled = false;
  let browserNotificationPermission: NotificationPermission = 'default';

  // Original values for change detection
  let originalPreferences: NotificationPreferences | null = null;

  // Subscribe to notification store
  $: {
    if ($notificationStore.preferences && !originalPreferences) {
      // Initialize form with loaded preferences
      const prefs = $notificationStore.preferences;
      emailNotificationsEnabled = prefs.emailNotificationsEnabled;
      browserNotificationsEnabled = prefs.browserNotificationsEnabled || false;
      originalPreferences = { ...prefs };
    }
    
    isLoading = $notificationStore.isLoading;
    
    if ($notificationStore.error) {
      error = $notificationStore.error;
    }
  }

  // Check for changes
  $: {
    if (originalPreferences) {
      hasChanges = 
        emailNotificationsEnabled !== originalPreferences.emailNotificationsEnabled ||
        browserNotificationsEnabled !== (originalPreferences.browserNotificationsEnabled || false);
    }
  }

  // Check browser notification permission on mount
  onMount(() => {
    notificationStore.loadPreferences();
    
    if ('Notification' in window) {
      browserNotificationPermission = Notification.permission;
    }
  });

  function clearMessages() {
    error = '';
    success = '';
    notificationStore.clearError();
  }

  async function handleSave() {
    if (!hasChanges) return;

    clearMessages();
    isSaving = true;

    try {
      const updatedPreferences: Partial<NotificationPreferences> = {
        emailNotificationsEnabled,
        browserNotificationsEnabled
      };

      await notificationStore.updatePreferences(updatedPreferences);
      
      // Update original preferences to reflect saved state
      originalPreferences = {
        ...originalPreferences!,
        emailNotificationsEnabled,
        browserNotificationsEnabled
      };
      
      success = 'Notification preferences saved successfully!';
    } catch (err: any) {
      error = err.message || 'Failed to save notification preferences';
    } finally {
      isSaving = false;
    }
  }

  function handleCancel() {
    if (originalPreferences) {
      emailNotificationsEnabled = originalPreferences.emailNotificationsEnabled;
      browserNotificationsEnabled = originalPreferences.browserNotificationsEnabled || false;
    }
    clearMessages();
  }

  async function handleBrowserNotificationToggle() {
    console.log('[NotificationSettings] Toggle called, enabled:', browserNotificationsEnabled);

    if (!('Notification' in window)) {
      console.error('[NotificationSettings] Notification API not available');
      error = 'Browser notifications are not supported in this browser.';
      browserNotificationsEnabled = false;
      return;
    }

    if (browserNotificationsEnabled) {
      console.log('[NotificationSettings] Enabling push notifications...');
      // User wants to enable browser notifications
      try {
        // Initialize push notification manager
        console.log('[NotificationSettings] Initializing manager...');
        await pushNotificationManager.initialize();

        if (!pushNotificationManager.isSupported()) {
          error = 'Push notifications are not supported in this browser.';
          browserNotificationsEnabled = false;
          return;
        }

        // Request permission and subscribe
        const subscribed = await pushNotificationManager.requestPermissionAndSubscribe();
        browserNotificationPermission = Notification.permission;

        if (subscribed) {
          clearMessages();
          success = 'Browser push notifications enabled! You will receive notifications even when the app is closed.';
        } else {
          if (Notification.permission === 'denied') {
            error = 'Browser notification permission was denied. Please enable it in your browser settings.';
          } else {
            error = 'Failed to subscribe to push notifications. Please try again.';
          }
          browserNotificationsEnabled = false;
        }
      } catch (err: any) {
        console.error('Push notification error:', err);
        error = err.message || 'Failed to enable push notifications.';
        browserNotificationsEnabled = false;
      }
    } else {
      // User wants to disable browser notifications
      try {
        await pushNotificationManager.unsubscribe();
        clearMessages();
        success = 'Browser push notifications disabled.';
      } catch (err: any) {
        console.error('Unsubscribe error:', err);
        // Still allow disabling even if unsubscribe fails
      }
    }
  }
</script>

<Card class="mb-6">
  <h2 id="notifications" class="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-4">
    Notifications
  </h2>

  {#if isLoading && !originalPreferences}
    <div class="flex items-center justify-center py-8">
      <LoadingSpinner size="md" />
      <span class="ml-3 text-stone-600 dark:text-stone-400">Loading notification preferences...</span>
    </div>
  {:else}
    <div class="space-y-6">
      <!-- Notification Channels -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-stone-900 dark:text-stone-100">
          Notification Channels
        </h3>
        <p class="text-sm text-stone-600 dark:text-stone-400">
          Account-wide switches for where reminders can reach you. You set each reminder's
          time, repeat and channels on the task itself (open a task, then <em>Reminders</em>).
        </p>

        <!-- Email Notifications -->
        <div class="neu-raised-sm p-4">
          <label class="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              bind:checked={emailNotificationsEnabled}
              on:change={clearMessages}
              class="w-5 h-5 text-primary-600 bg-stone-100 border-stone-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-stone-800 focus:ring-2 dark:bg-stone-700 dark:border-stone-600 mt-0.5"
            />
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div class="text-sm font-medium text-stone-900 dark:text-stone-100">
                  Email Notifications
                </div>
              </div>
              <div class="text-sm text-stone-500 dark:text-stone-400 mt-1">
                Allow reminder emails, even when the app is closed
              </div>
            </div>
          </label>
        </div>

        <!-- Browser/PWA Notifications -->
        <div class="neu-raised-sm p-4">
          <label class="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              bind:checked={browserNotificationsEnabled}
              on:change={handleBrowserNotificationToggle}
              class="w-5 h-5 text-primary-600 bg-stone-100 border-stone-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-stone-800 focus:ring-2 dark:bg-stone-700 dark:border-stone-600 mt-0.5"
            />
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <div class="text-sm font-medium text-stone-900 dark:text-stone-100">
                  Browser/PWA Notifications
                </div>
              </div>
              <div class="text-sm text-stone-500 dark:text-stone-400 mt-1">
                Receive push notifications even when the app is closed (works best when installed as PWA)
              </div>
              {#if browserNotificationPermission === 'denied'}
                <div class="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Permission denied. Enable in browser settings to use this feature.</span>
                </div>
              {/if}
            </div>
          </label>
        </div>
      </div>

      <!-- Error Message -->
      {#if error}
        <ErrorMessage
          title="Notification Settings Error"
          message={error}
          showRetry={false}
        />
      {/if}

      <!-- Success Message -->
      {#if success}
        <div class="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p class="text-sm text-green-600 dark:text-green-400">{success}</p>
        </div>
      {/if}

      <!-- Action Buttons -->
      {#if hasChanges}
        <div class="flex flex-col sm:flex-row gap-3 pt-4 border-t border-stone-200 dark:border-stone-700">
          <Button
            variant="primary"
            on:click={handleSave}
            disabled={isSaving}
          >
            {#if isSaving}
              <span class="flex items-center gap-2">
                <LoadingSpinner size="sm" color="white" />
                Saving...
              </span>
            {:else}
              Save Changes
            {/if}
          </Button>
          
          <Button
            variant="secondary"
            on:click={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
        </div>
      {/if}
    </div>
  {/if}
</Card>