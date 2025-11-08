/**
 * Date formatting utilities
 * Provides functions for formatting dates in various formats for display
 */

/**
 * Format a date as a relative time string (e.g., "2 hours ago", "yesterday")
 * @param date - Date string or Date object to format
 * @returns Relative time string
 */
export function formatRelativeDate(date: string | Date): string {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  
  // Calculate difference in milliseconds
  const diffMs = now.getTime() - targetDate.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  // Future dates
  if (diffMs < 0) {
    const absDiffSeconds = Math.abs(diffSeconds);
    const absDiffMinutes = Math.abs(diffMinutes);
    const absDiffHours = Math.abs(diffHours);
    const absDiffDays = Math.abs(diffDays);

    if (absDiffSeconds < 60) {
      return 'in a few seconds';
    } else if (absDiffMinutes < 60) {
      return `in ${absDiffMinutes} ${absDiffMinutes === 1 ? 'minute' : 'minutes'}`;
    } else if (absDiffHours < 24) {
      return `in ${absDiffHours} ${absDiffHours === 1 ? 'hour' : 'hours'}`;
    } else if (absDiffDays === 1) {
      return 'tomorrow';
    } else if (absDiffDays < 7) {
      return `in ${absDiffDays} days`;
    } else {
      return formatAbsoluteDate(targetDate);
    }
  }

  // Past dates
  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (diffMonths < 12) {
    return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
  } else {
    return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
  }
}

/**
 * Format a date as an absolute date string (e.g., "Jan 15, 2024")
 * @param date - Date string or Date object to format
 * @returns Formatted date string
 */
export function formatAbsoluteDate(date: string | Date): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  return targetDate.toLocaleDateString('en-US', options);
}

/**
 * Format a date with time (e.g., "Jan 15, 2024 at 3:30 PM")
 * @param date - Date string or Date object to format
 * @returns Formatted date and time string
 */
export function formatAbsoluteDateTime(date: string | Date): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  
  const dateStr = targetDate.toLocaleDateString('en-US', dateOptions);
  const timeStr = targetDate.toLocaleTimeString('en-US', timeOptions);
  
  return `${dateStr} at ${timeStr}`;
}

/**
 * Format a due date with appropriate context
 * Shows relative time for near dates, absolute for far dates
 * @param dueDate - Due date string or Date object
 * @returns Formatted due date string with context
 */
export function formatDueDate(dueDate: string | Date): string {
  const now = new Date();
  const targetDate = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  
  // Compare dates only (ignore time) by setting both to midnight local time
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDateOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  
  const diffMs = targetDateOnly.getTime() - nowDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Overdue
  if (diffDays < 0) {
    const absDiffDays = Math.abs(diffDays);
    if (absDiffDays === 1) {
      return 'Overdue (yesterday)';
    } else if (absDiffDays < 7) {
      return `Overdue (${absDiffDays} days ago)`;
    } else {
      return `Overdue (${formatAbsoluteDate(targetDate)})`;
    }
  }

  // Due today
  if (diffDays === 0) {
    return 'Due today';
  }

  // Due tomorrow
  if (diffDays === 1) {
    return 'Due tomorrow';
  }

  // Due within a week
  if (diffDays < 7) {
    return `Due in ${diffDays} days`;
  }

  // Due later - show absolute date
  return `Due ${formatAbsoluteDate(targetDate)}`;
}

/**
 * Parse a date string from API response
 * Handles various date formats and returns a Date object
 * @param dateString - Date string from API
 * @returns Date object or null if invalid
 */
export function parseApiDate(dateString: string | null | undefined): Date | null {
  if (!dateString) {
    return null;
  }

  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return null;
    }
    
    return date;
  } catch {
    return null;
  }
}

/**
 * Format a date for input fields (YYYY-MM-DD)
 * Uses UTC to avoid timezone issues
 * @param date - Date string or Date object
 * @returns Formatted date string for input fields
 */
export function formatDateForInput(date: string | Date | null | undefined): string {
  if (!date) {
    return '';
  }

  const targetDate = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(targetDate.getTime())) {
    return '';
  }

  // Use UTC to avoid timezone shifts
  const year = targetDate.getUTCFullYear();
  const month = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Check if a date is in the past
 * Compares dates only (ignores time)
 * @param date - Date string or Date object
 * @returns True if date is in the past (before today)
 */
export function isPastDate(date: string | Date): boolean {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  // Compare dates only (ignore time)
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDateOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  
  return targetDateOnly.getTime() < nowDate.getTime();
}

/**
 * Check if a date is today
 * @param date - Date string or Date object
 * @returns True if date is today
 */
export function isToday(date: string | Date): boolean {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  return (
    targetDate.getDate() === now.getDate() &&
    targetDate.getMonth() === now.getMonth() &&
    targetDate.getFullYear() === now.getFullYear()
  );
}

/**
 * Check if a date is tomorrow
 * @param date - Date string or Date object
 * @returns True if date is tomorrow
 */
export function isTomorrow(date: string | Date): boolean {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return (
    targetDate.getDate() === tomorrow.getDate() &&
    targetDate.getMonth() === tomorrow.getMonth() &&
    targetDate.getFullYear() === tomorrow.getFullYear()
  );
}

/**
 * Get a human-readable time ago string with short format
 * @param date - Date string or Date object
 * @returns Short relative time string (e.g., "2h ago", "3d ago")
 */
export function formatShortRelativeDate(date: string | Date): string {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  
  const diffMs = now.getTime() - targetDate.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) {
    return 'now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks}w ago`;
  } else if (diffMonths < 12) {
    return `${diffMonths}mo ago`;
  } else {
    return `${diffYears}y ago`;
  }
}

/**
 * Get a list of common timezones for selection
 * @returns Array of timezone objects with label and value
 */
export function getCommonTimezones(): Array<{ label: string; value: string }> {
  return [
    { label: 'UTC (Coordinated Universal Time)', value: 'UTC' },
    { label: 'America/New_York (Eastern Time)', value: 'America/New_York' },
    { label: 'America/Chicago (Central Time)', value: 'America/Chicago' },
    { label: 'America/Denver (Mountain Time)', value: 'America/Denver' },
    { label: 'America/Los_Angeles (Pacific Time)', value: 'America/Los_Angeles' },
    { label: 'Europe/London (GMT/BST)', value: 'Europe/London' },
    { label: 'Europe/Paris (CET/CEST)', value: 'Europe/Paris' },
    { label: 'Europe/Berlin (CET/CEST)', value: 'Europe/Berlin' },
    { label: 'Asia/Tokyo (JST)', value: 'Asia/Tokyo' },
    { label: 'Asia/Shanghai (CST)', value: 'Asia/Shanghai' },
    { label: 'Asia/Kolkata (IST)', value: 'Asia/Kolkata' },
    { label: 'Australia/Sydney (AEST/AEDT)', value: 'Australia/Sydney' },
    { label: 'Australia/Melbourne (AEST/AEDT)', value: 'Australia/Melbourne' },
    { label: 'Pacific/Auckland (NZST/NZDT)', value: 'Pacific/Auckland' }
  ];
}

/**
 * Get the user's current timezone
 * @returns Current timezone string
 */
export function getCurrentTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/**
 * Validate a date string or Date object
 * @param date - Date string or Date object to validate
 * @param options - Validation options (minDate, maxDate)
 * @returns Validation result with error message if invalid
 */
export function validateDate(
  date: string | Date | null | undefined,
  options?: {
    minDate?: Date;
    maxDate?: Date;
    allowPast?: boolean;
  }
): { valid: boolean; error?: string } {
  if (!date) {
    return { valid: false, error: 'Date is required' };
  }

  const targetDate = typeof date === 'string' ? new Date(date) : date;

  // Check if date is valid
  if (isNaN(targetDate.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }

  // Check min date constraint
  if (options?.minDate) {
    const minDateOnly = new Date(
      options.minDate.getFullYear(),
      options.minDate.getMonth(),
      options.minDate.getDate()
    );
    const targetDateOnly = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate()
    );

    if (targetDateOnly.getTime() < minDateOnly.getTime()) {
      return { valid: false, error: `Date must be on or after ${formatAbsoluteDate(options.minDate)}` };
    }
  }

  // Check max date constraint
  if (options?.maxDate) {
    const maxDateOnly = new Date(
      options.maxDate.getFullYear(),
      options.maxDate.getMonth(),
      options.maxDate.getDate()
    );
    const targetDateOnly = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate()
    );

    if (targetDateOnly.getTime() > maxDateOnly.getTime()) {
      return { valid: false, error: `Date must be on or before ${formatAbsoluteDate(options.maxDate)}` };
    }
  }

  // Check if past dates are allowed
  if (options?.allowPast === false && isPastDate(targetDate)) {
    return { valid: false, error: 'Date cannot be in the past' };
  }

  return { valid: true };
}

/**
 * Format a date for display in the date picker (e.g., "Mon, Jan 15, 2024")
 * @param date - Date string or Date object
 * @returns Formatted date string for display
 */
export function formatDateForDisplay(date: string | Date | null | undefined): string {
  if (!date) {
    return '';
  }

  const targetDate = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(targetDate.getTime())) {
    return '';
  }

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  return targetDate.toLocaleDateString('en-US', options);
}

/**
 * Parse a date input string (handles various formats)
 * @param input - Date input string
 * @returns Date object or null if invalid
 */
export function parseDateInput(input: string): Date | null {
  if (!input || !input.trim()) {
    return null;
  }

  try {
    // Try parsing as ISO date (YYYY-MM-DD)
    const isoMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    // Try parsing as MM/DD/YYYY
    const usMatch = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (usMatch) {
      const [, month, day, year] = usMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    // Try parsing as DD/MM/YYYY
    const euMatch = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (euMatch) {
      const [, day, month, year] = euMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    // Try native Date parsing as fallback
    const date = new Date(input);
    if (!isNaN(date.getTime())) {
      return date;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Convert a Date object to ISO date string (YYYY-MM-DD) in local timezone
 * @param date - Date object
 * @returns ISO date string in local timezone
 */
export function toLocalISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convert a Date object to ISO string for API (preserves local date)
 * @param date - Date object
 * @returns ISO string for API
 */
export function toApiDate(date: Date | null | undefined): string | undefined {
  if (!date) {
    return undefined;
  }

  // Create a date at midnight local time
  const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return localDate.toISOString();
}

/**
 * Get the start of today (midnight local time)
 * @returns Date object representing start of today
 */
export function getStartOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Get the start of tomorrow (midnight local time)
 * @returns Date object representing start of tomorrow
 */
export function getStartOfTomorrow(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
}

/**
 * Add days to a date
 * @param date - Date object
 * @param days - Number of days to add (can be negative)
 * @returns New Date object with days added
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Get the number of days between two dates (ignoring time)
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of days between dates (positive if date2 is after date1)
 */
export function getDaysBetween(date1: Date, date2: Date): number {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  const diffMs = d2.getTime() - d1.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
