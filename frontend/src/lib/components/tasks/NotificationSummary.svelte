<script lang="ts">
  import { onMount } from 'svelte';
  import type { NotificationTiming } from '$lib/types/task';
  import { notificationStore } from '$lib/stores/notifications';

  export let enabled: boolean = false;
  export let selectedTimings: NotificationTiming[] = [];
  export let dueDate: Date | null = null;

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

  // Generate summary message
  $: summaryMessage = (() => {
    if (!enabled) {
      return 'No notifications';
    }

    if (!dueDate) {
      return 'Set a due date to enable notifications';
    }

    if (selectedTimings.length === 0) {
      return 'Select at least one notification timing';
    }

    const timingsList = selectedTimings.map(formatTiming).join(', ');
    
    if (selectedTimings.length === 1) {
      return `You will receive an email reminder: ${timingsList}`;
    } else {
      return `You will receive email reminders: ${timingsList}`;
    }
  })();

  // Determine icon SVG and styling based on state
  $: summaryIcon = (() => {
    if (!enabled) {
      return '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />';
    }
    if (!dueDate || selectedTimings.length === 0) {
      return '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />';
    }
    return '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />';
  })();

  $: summaryClass = (() => {
    if (!enabled) {
      return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400';
    }
    if (!dueDate || selectedTimings.length === 0) {
      return 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200';
    }
    return 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200';
  })();

  $: iconColor = (() => {
    if (!enabled) return 'text-gray-500 dark:text-gray-400';
    if (!dueDate || selectedTimings.length === 0) return 'text-blue-600 dark:text-blue-400';
    return 'text-green-600 dark:text-green-400';
  })();
</script>

<div 
  class="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 {summaryClass} shadow-sm"
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5 {iconColor}" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    {@html summaryIcon}
  </svg>
  <p class="text-sm sm:text-base flex-1 font-medium leading-relaxed">
    {summaryMessage}
  </p>
</div>
