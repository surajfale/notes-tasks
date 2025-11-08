<script lang="ts">
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import type { NotificationTiming } from '$lib/types/task';
  import NotificationSummary from './NotificationSummary.svelte';
  import Tooltip from '$lib/components/ui/Tooltip.svelte';
  import { notificationStore } from '$lib/stores/notifications';

  export let dueDate: Date | null = null;
  export let enabled: boolean = false;
  export let selectedTimings: NotificationTiming[] = [];
  export let error: string = '';
  // disabled is kept for external reference
  export const disabled: boolean = false;

  // Collapsible state
  let isExpanded = false;

  // User's notification time preference - reactive from store
  $: userNotificationTime = $notificationStore.preferences?.notificationTime || '09:00';

  // Load user preferences on mount if not already loaded
  onMount(async () => {
    if (!$notificationStore.preferences) {
      await notificationStore.loadPreferences();
    }
  });

  // Ensure selectedTimings is always an array
  $: if (!Array.isArray(selectedTimings)) {
    selectedTimings = [];
  }

  const dispatch = createEventDispatcher<{
    enabledChange: boolean;
    timingsChange: NotificationTiming[];
  }>();

  // Format time from 24h to 12h format
  function formatTime(time24: string): string {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  // Available timing options with labels - reactive based on user's notification time
  $: timingOptions = [
    {
      value: 'same_day' as NotificationTiming,
      label: `Same day (${formatTime(userNotificationTime)})`,
      description: `Receive a reminder on the due date at ${formatTime(userNotificationTime)}`,
      tooltip: 'Get notified on the morning of your task due date'
    },
    {
      value: '1_day_before' as NotificationTiming,
      label: `1 day before (${formatTime(userNotificationTime)})`,
      description: `Receive a reminder one day before the due date at ${formatTime(userNotificationTime)}`,
      tooltip: 'Get notified 24 hours before your task is due'
    },
    {
      value: '2_days_before' as NotificationTiming,
      label: `2 days before (${formatTime(userNotificationTime)})`,
      description: `Receive a reminder two days before the due date at ${formatTime(userNotificationTime)}`,
      tooltip: 'Get notified 48 hours before your task is due'
    }
  ];

  // Calculate available timings based on due date
  function getAvailableTimings(dueDate: Date | null): NotificationTiming[] {
    if (!dueDate) return [];
    
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparison
    
    const dueDateCopy = new Date(dueDate);
    dueDateCopy.setHours(0, 0, 0, 0);
    
    const daysUntilDue = Math.floor((dueDateCopy.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) return []; // Past date
    if (daysUntilDue === 0) return ['same_day'];
    if (daysUntilDue === 1) return ['same_day', '1_day_before'];
    return ['same_day', '1_day_before', '2_days_before'];
  }

  // Get currently available timings
  $: availableTimings = getAvailableTimings(dueDate);

  // Track when options are auto-cleared
  let autoCleared = false;
  let autoClearMessage = '';

  // Auto-deselect invalid options when due date changes
  $: {
    if (enabled && selectedTimings.length > 0) {
      const validTimings = selectedTimings.filter(timing => availableTimings.includes(timing));
      if (validTimings.length !== selectedTimings.length) {
        const removedCount = selectedTimings.length - validTimings.length;
        selectedTimings = validTimings;
        dispatch('timingsChange', selectedTimings);
        
        // Show user-friendly message
        autoCleared = true;
        autoClearMessage = `${removedCount} notification ${removedCount === 1 ? 'option was' : 'options were'} automatically removed because ${removedCount === 1 ? 'it is' : 'they are'} no longer available for the new due date.`;
        
        // Clear message after 5 seconds
        setTimeout(() => {
          autoCleared = false;
          autoClearMessage = '';
        }, 5000);
      }
    }
  }

  function handleToggle() {
    enabled = !enabled;
    dispatch('enabledChange', enabled);
    
    // Clear selections when disabling
    if (!enabled && selectedTimings.length > 0) {
      selectedTimings = [];
      dispatch('timingsChange', selectedTimings);
    }
  }

  function handleToggleKeydown(event: KeyboardEvent) {
    // Space or Enter to toggle
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if (!dueDate) return;
      handleToggle();
    }
  }

  function handleCheckboxKeydown(event: KeyboardEvent, timing: NotificationTiming, available: boolean) {
    // Space to toggle checkbox
    if (event.key === ' ') {
      event.preventDefault();
      if (!available) return;
      const selected = isTimingSelected(timing);
      handleTimingChange(timing, !selected);
    }
  }

  function handleTimingChange(timing: NotificationTiming, checked: boolean) {
    if (checked) {
      selectedTimings = [...selectedTimings, timing];
    } else {
      selectedTimings = selectedTimings.filter(t => t !== timing);
    }
    dispatch('timingsChange', selectedTimings);
  }

  function isTimingAvailable(timing: NotificationTiming): boolean {
    return availableTimings.includes(timing);
  }

  function isTimingSelected(timing: NotificationTiming): boolean {
    return selectedTimings.includes(timing);
  }

  function toggleExpanded() {
    if (!dueDate) return;
    isExpanded = !isExpanded;
  }

  // Auto-expand when notifications are enabled
  $: if (enabled && !isExpanded) {
    isExpanded = true;
  }
</script>

<div class="space-y-3">
  <!-- Compact Notification Toggle -->
  <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
    <div class="flex items-center gap-2 flex-1 min-w-0">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-gray-900 dark:text-gray-100">Email Notifications</span>
          {#if enabled && selectedTimings.length > 0}
            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
              {selectedTimings.length}
            </span>
          {/if}
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
          {#if !dueDate}
            Set due date to enable
          {:else if enabled && selectedTimings.length > 0}
            {selectedTimings.map(t => t.replace('_', ' ')).join(', ')}
          {:else}
            Click to configure
          {/if}
        </p>
      </div>

      <button
        type="button"
        on:click={toggleExpanded}
        disabled={!dueDate}
        class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
        aria-label={isExpanded ? 'Collapse' : 'Expand'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 transition-transform {isExpanded ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
    
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label="Toggle email notifications"
      disabled={!dueDate}
      on:click={handleToggle}
      on:keydown={handleToggleKeydown}
      tabindex="0"
      class="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed
             {enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}"
    >
      <span
        class="inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200
               {enabled ? 'translate-x-6' : 'translate-x-1'}"
      />
    </button>
  </div>

  <!-- Expanded Settings -->
  {#if isExpanded && dueDate}
    <div class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p id="notification-timings-label" class="text-sm font-medium text-gray-700 dark:text-gray-300">
              When to remind?
            </p>
          </div>
          <a
            href="/settings#notifications"
            class="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            More settings
          </a>
        </div>
      
        <div class="space-y-2" role="group" aria-label="Notification timing options">
          {#each timingOptions as option}
            {@const available = isTimingAvailable(option.value)}
            {@const selected = isTimingSelected(option.value)}

            <label
              class="flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer
                     {available
                       ? selected
                         ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                         : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                       : 'border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed'}"
            >
              <input
                type="checkbox"
                checked={selected}
                disabled={!available}
                on:change={(e) => handleTimingChange(option.value, e.currentTarget.checked)}
                on:keydown={(e) => handleCheckboxKeydown(e, option.value, available)}
                class="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 disabled:cursor-not-allowed"
                aria-label={option.label}
              />
              <span class="text-sm text-gray-900 dark:text-gray-100">
                {option.label}
              </span>
            </label>
          {/each}
        </div>

        <div class="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-xs text-blue-800 dark:text-blue-200">
            Sent at {formatTime(userNotificationTime)}. For more options like browser notifications and custom times, visit <a href="/settings#notifications" class="underline hover:text-blue-600">Settings</a>.
          </p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Validation Error -->
  {#if error}
    <div class="flex items-start gap-3 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl shadow-sm" role="alert">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p class="text-sm sm:text-base text-red-800 dark:text-red-200 flex-1 font-medium">
        {error}
      </p>
    </div>
  {/if}
</div>
