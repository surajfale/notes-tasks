<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import {
    formatDateForDisplay,
    formatDateForInput,
    parseDateInput,
    validateDate,
    toLocalISODate,
    getStartOfToday,
    addDays,
    isToday,
    isTomorrow
  } from '$lib/utils/date';

  export let value: Date | null = null;
  export let label = 'Due Date';
  export let placeholder = 'Select a date';
  export let error = '';
  export let disabled = false;
  export let minDate: Date | undefined = undefined;
  export let maxDate: Date | undefined = undefined;
  export let allowPast = true;
  export let required = false;

  const dispatch = createEventDispatcher<{
    change: Date | null;
    clear: void;
  }>();

  let isCalendarOpen = false;
  let inputValue = '';
  let currentMonth = new Date();
  let calendarContainer: HTMLDivElement;
  let inputElement: HTMLInputElement;

  // Initialize input value from prop
  $: if (value) {
    inputValue = formatDateForInput(value);
  } else {
    inputValue = '';
  }

  // Update current month when value changes
  $: if (value && isCalendarOpen) {
    currentMonth = new Date(value.getFullYear(), value.getMonth(), 1);
  }

  // Calendar generation
  $: calendarDays = generateCalendarDays(currentMonth);
  $: monthYearDisplay = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  function generateCalendarDays(month: Date): Array<{
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    isDisabled: boolean;
  }> {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();

    // Get first day of month and last day of month
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);

    // Get the day of week for first day (0 = Sunday)
    const firstDayOfWeek = firstDay.getDay();

    // Get days from previous month to fill the first week
    const daysFromPrevMonth = firstDayOfWeek;
    const prevMonthLastDay = new Date(year, monthIndex, 0);

    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      isDisabled: boolean;
    }> = [];

    // Add days from previous month
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const date = new Date(year, monthIndex - 1, prevMonthLastDay.getDate() - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: isToday(date),
        isSelected: value ? isSameDay(date, value) : false,
        isDisabled: isDateDisabled(date)
      });
    }

    // Add days from current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, monthIndex, day);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: isToday(date),
        isSelected: value ? isSameDay(date, value) : false,
        isDisabled: isDateDisabled(date)
      });
    }

    // Add days from next month to complete the grid (6 weeks = 42 days)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, monthIndex + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: isToday(date),
        isSelected: value ? isSameDay(date, value) : false,
        isDisabled: isDateDisabled(date)
      });
    }

    return days;
  }

  function isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  function isDateDisabled(date: Date): boolean {
    const validation = validateDate(date, { minDate, maxDate, allowPast });
    return !validation.valid;
  }

  function handleInputChange() {
    const parsed = parseDateInput(inputValue);
    if (parsed) {
      const validation = validateDate(parsed, { minDate, maxDate, allowPast });
      if (validation.valid) {
        value = parsed;
        dispatch('change', value);
        error = '';
      } else {
        error = validation.error || 'Invalid date';
      }
    } else if (inputValue.trim() === '') {
      handleClear();
    } else {
      error = 'Invalid date format';
    }
  }

  function handleDateSelect(date: Date) {
    if (isDateDisabled(date)) return;

    value = date;
    inputValue = formatDateForInput(date);
    dispatch('change', value);
    error = '';
    isCalendarOpen = false;
  }

  function handleClear() {
    value = null;
    inputValue = '';
    dispatch('change', null);
    dispatch('clear');
    error = '';
  }

  function toggleCalendar() {
    if (disabled) return;
    isCalendarOpen = !isCalendarOpen;
    if (isCalendarOpen && !value) {
      currentMonth = new Date();
    }
  }

  function closeCalendar() {
    isCalendarOpen = false;
  }

  function previousMonth() {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
  }

  function nextMonth() {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  }

  function goToToday() {
    const today = getStartOfToday();
    currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    handleDateSelect(today);
  }

  let focusedDateIndex = -1;

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeCalendar();
      inputElement?.focus();
    } else if (event.key === 'Enter' && !isCalendarOpen) {
      handleInputChange();
    }
  }

  function handleCalendarKeydown(event: KeyboardEvent) {
    if (!isCalendarOpen) return;

    // Find currently selected or today's date index
    if (focusedDateIndex === -1) {
      focusedDateIndex = calendarDays.findIndex(day => day.isSelected || day.isToday);
      if (focusedDateIndex === -1) focusedDateIndex = 0;
    }

    let newIndex = focusedDateIndex;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = Math.max(0, focusedDateIndex - 1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        newIndex = Math.min(calendarDays.length - 1, focusedDateIndex + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        newIndex = Math.max(0, focusedDateIndex - 7);
        break;
      case 'ArrowDown':
        event.preventDefault();
        newIndex = Math.min(calendarDays.length - 1, focusedDateIndex + 7);
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = calendarDays.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedDateIndex >= 0 && focusedDateIndex < calendarDays.length) {
          const day = calendarDays[focusedDateIndex];
          if (!day.isDisabled) {
            handleDateSelect(day.date);
          }
        }
        return;
      case 'Escape':
        event.preventDefault();
        closeCalendar();
        inputElement?.focus();
        return;
      default:
        return;
    }

    // Skip disabled dates
    while (newIndex !== focusedDateIndex && calendarDays[newIndex]?.isDisabled) {
      if (newIndex > focusedDateIndex) {
        newIndex++;
        if (newIndex >= calendarDays.length) break;
      } else {
        newIndex--;
        if (newIndex < 0) break;
      }
    }

    if (newIndex >= 0 && newIndex < calendarDays.length && !calendarDays[newIndex].isDisabled) {
      focusedDateIndex = newIndex;
      // Focus the button element
      const buttons = calendarContainer?.querySelectorAll('button[role="gridcell"]');
      if (buttons && buttons[focusedDateIndex]) {
        (buttons[focusedDateIndex] as HTMLElement).focus();
      }
    }
  }

  // Close calendar when clicking outside
  function handleClickOutside(event: MouseEvent) {
    if (
      isCalendarOpen &&
      calendarContainer &&
      !calendarContainer.contains(event.target as Node) &&
      inputElement &&
      !inputElement.contains(event.target as Node)
    ) {
      closeCalendar();
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });

  const inputId = `date-picker-${Math.random().toString(36).substr(2, 9)}`;
</script>

<div class="w-full relative">
  {#if label}
    <label
      for={inputId}
      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
    >
      {label}
      {#if required}
        <span class="text-red-500">*</span>
      {/if}
    </label>
  {/if}

  <div class="relative">
    <div class="flex gap-2">
      <div class="flex-1 relative">
        <input
          bind:this={inputElement}
          type="text"
          id={inputId}
          bind:value={inputValue}
          {placeholder}
          {disabled}
          on:blur={handleInputChange}
          on:keydown={handleKeydown}
          class="w-full px-4 py-3 pr-10 min-h-[44px] text-base rounded-lg border transition-colors duration-200
                 {error
            ? 'border-red-500 focus:border-red-600 focus:ring-red-500'
            : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500'}
                 bg-white dark:bg-black
                 text-gray-900 dark:text-gray-100
                 placeholder-gray-400 dark:placeholder-gray-500
                 focus:outline-none focus:ring-2 focus:ring-offset-0
                 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={label}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
        />
        <button
          type="button"
          on:click|stopPropagation={toggleCalendar}
          {disabled}
          class="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 dark:text-gray-400
                 hover:text-gray-700 dark:hover:text-gray-200 transition-colors
                 disabled:opacity-50 disabled:cursor-not-allowed z-10"
          aria-label="Open calendar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </button>
      </div>

      {#if value}
        <button
          type="button"
          on:click={handleClear}
          {disabled}
          class="px-4 py-3 min-h-[44px] rounded-lg border border-gray-300 dark:border-gray-600
                 bg-white dark:bg-black text-gray-700 dark:text-gray-300
                 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors
                 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Clear date"
        >
          Clear
        </button>
      {/if}
    </div>
  </div>

  {#if isCalendarOpen}
    <div class="relative">
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        bind:this={calendarContainer}
        class="absolute z-50 top-full left-0 mt-2 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-gray-200 dark:border-gray-700 w-full sm:w-80 max-w-sm"
        role="dialog"
        aria-label="Select due date"
        aria-modal="true"
        on:keydown={handleCalendarKeydown}
      >
        <!-- Calendar Header -->
        <div class="flex items-center justify-between mb-4">
          <button
            type="button"
            on:click={previousMonth}
            class="p-2 sm:p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
            aria-label="Previous month"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 sm:h-6 sm:w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div class="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
            {monthYearDisplay}
          </div>

          <button
            type="button"
            on:click={nextMonth}
            class="p-2 sm:p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
            aria-label="Next month"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 sm:h-6 sm:w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- Weekday Headers -->
        <div class="grid grid-cols-7 gap-1 mb-2" role="row">
          {#each ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as day, index}
            <div 
              class="text-center text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 py-2"
              role="columnheader"
              aria-label={['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][index]}
            >
              {day}
            </div>
          {/each}
        </div>

        <!-- Calendar Days -->
        <div class="grid grid-cols-7 gap-1 sm:gap-1.5" role="grid" aria-label="Calendar dates">
          {#each calendarDays as day}
            <button
              type="button"
              on:click={() => handleDateSelect(day.date)}
              disabled={day.isDisabled}
              role="gridcell"
              class="aspect-square p-1.5 sm:p-2 text-sm sm:text-base rounded-lg transition-colors touch-manipulation
                     {day.isCurrentMonth
                ? 'text-gray-900 dark:text-gray-100'
                : 'text-gray-400 dark:text-gray-600'}
                     {day.isSelected
                ? 'bg-primary-500 text-white font-semibold hover:bg-primary-600 shadow-md'
                : day.isToday
                  ? 'bg-primary-100 dark:bg-primary-900 font-semibold hover:bg-primary-200 dark:hover:bg-primary-800 ring-2 ring-primary-500'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                     {day.isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
              aria-label={formatDateForDisplay(day.date)}
              aria-selected={day.isSelected}
              aria-disabled={day.isDisabled}
              aria-current={day.isToday ? 'date' : undefined}
            >
              {day.date.getDate()}
            </button>
          {/each}
        </div>

        <!-- Quick Actions -->
        <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            on:click={goToToday}
            class="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium rounded-lg bg-gray-100 dark:bg-gray-700
                   text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600
                   transition-colors touch-manipulation"
            aria-label="Select today's date"
          >
            Today
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if error}
    <p id="{inputId}-error" class="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
      {error}
    </p>
  {:else if value}
    <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
      {formatDateForDisplay(value)}
    </p>
  {/if}
</div>
