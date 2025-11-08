<script lang="ts">
  import { onMount } from 'svelte';
  import type { NotificationTiming } from '$lib/types/task';
  import { notificationStore } from '$lib/stores/notifications';

  export let enabled: boolean = false;
  export let timings: NotificationTiming[] = [];
  export let sentNotifications: NotificationTiming[] = [];
  export let dueDate: string | undefined = undefined;

  // User's notification time preference - reactive from store
  $: userNotificationTime = $notificationStore.preferences?.notificationTime || '09:00';

  // Load user preferences on mount if not already loaded
  onMount(async () => {
    if (!$notificationStore.preferences) {
      await notificationStore.loadPreferences();
    }
  });

  // Format time from 24h to 12h format
  function formatTime(time24: string): string {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  // Format timing for display - reactive based on user's notification time
  $: formatTiming = (timing: NotificationTiming): string => {
    const timeStr = formatTime(userNotificationTime);
    switch (timing) {
      case 'same_day':
        return `Same day at ${timeStr}`;
      case '1_day_before':
        return `1 day before at ${timeStr}`;
      case '2_days_before':
        return `2 days before at ${timeStr}`;
      default:
        return timing;
    }
  };

  $: hasNotifications = enabled && timings && timings.length > 0;
  $: hasSentNotifications = sentNotifications && sentNotifications.length > 0;
</script>

<div class="bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-4 sm:p-6">
  <div class="flex items-start gap-3">
    <svg 
      class="w-6 h-6 flex-shrink-0 mt-0.5 {hasNotifications ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'}" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
    
    <div class="flex-1 space-y-3">
      <h3 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
        Email Notifications
      </h3>
      
      {#if !enabled}
        <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Notifications are disabled for this task.
        </p>
      {:else if !dueDate}
        <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          This task has no due date. Notifications require a due date.
        </p>
      {:else if !hasNotifications}
        <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Notifications are enabled but no timing options are selected.
        </p>
      {:else}
        <div class="space-y-2">
          <p class="text-sm sm:text-base text-gray-700 dark:text-gray-300 font-medium">
            You will receive email reminders:
          </p>
          <ul class="space-y-2">
            {#each timings as timing}
              {@const isSent = sentNotifications.includes(timing)}
              <li class="flex items-center gap-2 text-sm sm:text-base">
                {#if isSent}
                  <svg class="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-green-700 dark:text-green-300">
                    {formatTiming(timing)} <span class="font-medium">(Sent)</span>
                  </span>
                {:else}
                  <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-gray-700 dark:text-gray-300">
                    {formatTiming(timing)} <span class="text-gray-500 dark:text-gray-500">(Scheduled)</span>
                  </span>
                {/if}
              </li>
            {/each}
          </ul>
        </div>
        
        {#if hasSentNotifications}
          <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
              {sentNotifications.length} of {timings.length} notification{timings.length === 1 ? '' : 's'} sent
            </p>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>
