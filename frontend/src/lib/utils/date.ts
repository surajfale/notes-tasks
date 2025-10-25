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
  
  const diffMs = targetDate.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Overdue
  if (diffMs < 0) {
    const absDiffDays = Math.abs(diffDays);
    if (absDiffDays === 0) {
      return 'Overdue (today)';
    } else if (absDiffDays === 1) {
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

  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Check if a date is in the past
 * @param date - Date string or Date object
 * @returns True if date is in the past
 */
export function isPastDate(date: string | Date): boolean {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  return targetDate.getTime() < now.getTime();
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
