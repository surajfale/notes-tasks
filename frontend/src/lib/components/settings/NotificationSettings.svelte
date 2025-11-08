<script lang="ts">
  import { onMount } from 'svelte';
  import { notificationStore } from '$lib/stores/notifications';
  import { Button, Card, LoadingSpinner, ErrorMessage } from '$lib/components/ui';
  import { getCommonTimezones, getCurrentTimezone } from '$lib/utils/date';
  import type { NotificationDay, NotificationPreferences } from '$lib/types/notification';
  import { pushNotificationManager } from '$lib/services/pushNotificationManager';

  // Component state
  let isLoading = false;
  let isSaving = false;
  let error = '';
  let success = '';
  let hasChanges = false;

  // Form state
  let emailNotificationsEnabled = true;
  let browserNotificationsEnabled = false;
  let selectedNotificationDays: NotificationDay[] = ['1_day_before'];
  let selectedTimezone = getCurrentTimezone();
  let selectedNotificationTime = '09:00'; // Default 9 AM
  let browserNotificationPermission: NotificationPermission = 'default';

  // Original values for change detection
  let originalPreferences: NotificationPreferences | null = null;

  // Notification day options
  const notificationDayOptions: Array<{ value: NotificationDay; label: string; description: string }> = [
    {
      value: 'same_day',
      label: 'Same day',
      description: 'Get notified on the day the task is due'
    },
    {
      value: '1_day_before',
      label: '1 day before',
      description: 'Get notified one day before the task is due'
    },
    {
      value: '2_days_before',
      label: '2 days before',
      description: 'Get notified two days before the task is due'
    }
  ];

  // Timezone options
  const timezoneOptions = getCommonTimezones();

  // Subscribe to notification store
  $: {
    if ($notificationStore.preferences && !originalPreferences) {
      // Initialize form with loaded preferences
      const prefs = $notificationStore.preferences;
      emailNotificationsEnabled = prefs.emailNotificationsEnabled;
      browserNotificationsEnabled = prefs.browserNotificationsEnabled || false;
      selectedNotificationDays = [...prefs.notificationDays];
      selectedTimezone = prefs.timezone;
      selectedNotificationTime = prefs.notificationTime || '09:00';
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
        browserNotificationsEnabled !== (originalPreferences.browserNotificationsEnabled || false) ||
        selectedTimezone !== originalPreferences.timezone ||
        selectedNotificationTime !== (originalPreferences.notificationTime || '09:00') ||
        !arraysEqual(selectedNotificationDays, originalPreferences.notificationDays);
    }
  }

  // Check browser notification permission on mount
  onMount(() => {
    notificationStore.loadPreferences();
    
    if ('Notification' in window) {
      browserNotificationPermission = Notification.permission;
    }
  });

  function arraysEqual<T>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, i) => val === b[i]);
  }

  function handleNotificationDayChange(day: NotificationDay, checked: boolean) {
    if (checked) {
      if (!selectedNotificationDays.includes(day)) {
        selectedNotificationDays = [...selectedNotificationDays, day];
      }
    } else {
      selectedNotificationDays = selectedNotificationDays.filter(d => d !== day);
    }
    clearMessages();
  }

  function clearMessages() {
    error = '';
    success = '';
    notificationStore.clearError();
  }

  async function handleSave() {
    if (!hasChanges) return;

    // Validation
    if (emailNotificationsEnabled && selectedNotificationDays.length === 0) {
      error = 'Please select at least one notification timing option when email notifications are enabled.';
      return;
    }

    clearMessages();
    isSaving = true;

    try {
      const updatedPreferences: Partial<NotificationPreferences> = {
        emailNotificationsEnabled,
        browserNotificationsEnabled,
        notificationDays: selectedNotificationDays,
        timezone: selectedTimezone,
        notificationTime: selectedNotificationTime
      };

      await notificationStore.updatePreferences(updatedPreferences);
      
      // Update original preferences to reflect saved state
      originalPreferences = {
        emailNotificationsEnabled,
        browserNotificationsEnabled,
        notificationDays: [...selectedNotificationDays],
        timezone: selectedTimezone,
        notificationTime: selectedNotificationTime
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
      selectedNotificationDays = [...originalPreferences.notificationDays];
      selectedTimezone = originalPreferences.timezone;
      selectedNotificationTime = originalPreferences.notificationTime || '09:00';
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
          success = 'Browser push notifications enabled! You will receive notifications even when the app is closed.';
          clearMessages();
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
        success = 'Browser push notifications disabled.';
        clearMessages();
      } catch (err: any) {
        console.error('Unsubscribe error:', err);
        // Still allow disabling even if unsubscribe fails
      }
    }
  }
</script>

<Card class="mb-6">
  <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
    Email Notifications
  </h2>

  {#if isLoading && !originalPreferences}
    <div class="flex items-center justify-center py-8">
      <LoadingSpinner size="md" />
      <span class="ml-3 text-gray-600 dark:text-gray-400">Loading notification preferences...</span>
    </div>
  {:else}
    <div class="space-y-6">
      <!-- Notification Channels -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Notification Channels
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Choose how you want to receive task reminders
        </p>

        <!-- Email Notifications -->
        <div class="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg">
          <label class="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              bind:checked={emailNotificationsEnabled}
              on:change={clearMessages}
              class="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 mt-0.5"
            />
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Email Notifications
                </div>
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Receive email reminders at your scheduled time, even when the app is closed
              </div>
            </div>
          </label>
        </div>

        <!-- Browser/PWA Notifications -->
        <div class="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg">
          <label class="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              bind:checked={browserNotificationsEnabled}
              on:change={handleBrowserNotificationToggle}
              class="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 mt-0.5"
            />
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Browser/PWA Notifications
                </div>
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
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

      <!-- Notification Timing Options -->
      {#if emailNotificationsEnabled}
        <div>
          <!-- svelte-ignore a11y-label-has-associated-control -->
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            When to send notifications
          </label>
          <div class="space-y-3">
            {#each notificationDayOptions as option}
              <label class="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedNotificationDays.includes(option.value)}
                  on:change={(e) => handleNotificationDayChange(option.value, e.currentTarget.checked)}
                  class="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 mt-0.5"
                />
                <div>
                  <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {option.label}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {option.description}
                  </div>
                </div>
              </label>
            {/each}
          </div>
        </div>

        <!-- Timezone Selection -->
        <div>
          <label for="timezone-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Timezone
          </label>
          <select
            id="timezone-select"
            bind:value={selectedTimezone}
            on:change={clearMessages}
            class="w-full px-4 py-3 min-h-[44px] text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {#each timezoneOptions as timezone}
              <option value={timezone.value}>{timezone.label}</option>
            {/each}
          </select>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Notifications will be sent based on your selected timezone
          </p>
        </div>

        <!-- Notification Time Selection -->
        <div>
          <label for="notification-time" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notification Time
          </label>
          <div class="flex items-center gap-3">
            <input
              id="notification-time"
              type="time"
              bind:value={selectedNotificationTime}
              on:change={clearMessages}
              class="flex-1 px-4 py-3 min-h-[44px] text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="hidden sm:inline">24-hour format</span>
            </div>
          </div>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Choose what time you want to receive email notifications (in your timezone)
          </p>
        </div>
      {/if}

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
        <div class="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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