import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  formatRelativeDate,
  formatAbsoluteDate,
  formatAbsoluteDateTime,
  formatDueDate,
  parseApiDate,
  formatDateForInput,
  isPastDate,
  isToday,
  isTomorrow,
  formatShortRelativeDate
} from './date';

describe('formatRelativeDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  it('should return "just now" for very recent dates', () => {
    const date = new Date('2024-01-15T11:59:30Z');
    expect(formatRelativeDate(date)).toBe('just now');
  });

  it('should return minutes ago for recent dates', () => {
    const date = new Date('2024-01-15T11:45:00Z');
    expect(formatRelativeDate(date)).toBe('15 minutes ago');
  });

  it('should return hours ago for dates within 24 hours', () => {
    const date = new Date('2024-01-15T09:00:00Z');
    expect(formatRelativeDate(date)).toBe('3 hours ago');
  });

  it('should return "yesterday" for dates 1 day ago', () => {
    const date = new Date('2024-01-14T12:00:00Z');
    expect(formatRelativeDate(date)).toBe('yesterday');
  });

  it('should return days ago for dates within a week', () => {
    const date = new Date('2024-01-12T12:00:00Z');
    expect(formatRelativeDate(date)).toBe('3 days ago');
  });

  it('should handle future dates', () => {
    const date = new Date('2024-01-15T13:00:00Z');
    expect(formatRelativeDate(date)).toBe('in 1 hour');
  });

  it('should handle string dates', () => {
    const result = formatRelativeDate('2024-01-15T11:45:00Z');
    expect(result).toBe('15 minutes ago');
  });
});

describe('formatAbsoluteDate', () => {
  it('should format date as "MMM DD, YYYY"', () => {
    const date = new Date('2024-01-15T12:00:00Z');
    const result = formatAbsoluteDate(date);
    expect(result).toMatch(/Jan 1[45], 2024/); // Account for timezone
  });

  it('should handle string dates', () => {
    const result = formatAbsoluteDate('2024-01-15T12:00:00Z');
    expect(result).toMatch(/Jan 1[45], 2024/);
  });
});

describe('formatAbsoluteDateTime', () => {
  it('should format date with time', () => {
    const date = new Date('2024-01-15T15:30:00Z');
    const result = formatAbsoluteDateTime(date);
    expect(result).toContain('2024');
    expect(result).toContain('at');
  });
});

describe('formatDueDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  it('should return "Due today" for today', () => {
    const date = new Date('2024-01-15T18:00:00Z');
    expect(formatDueDate(date)).toBe('Due today');
  });

  it('should return "Due tomorrow" for tomorrow', () => {
    const date = new Date('2024-01-16T12:00:00Z');
    expect(formatDueDate(date)).toBe('Due tomorrow');
  });

  it('should return "Due in X days" for near future', () => {
    const date = new Date('2024-01-18T12:00:00Z');
    expect(formatDueDate(date)).toBe('Due in 3 days');
  });

  it('should return "Overdue" for past dates', () => {
    const date = new Date('2024-01-14T06:00:00Z');
    const result = formatDueDate(date);
    expect(result).toContain('Overdue');
  });

  it('should return "Overdue (yesterday)" for yesterday', () => {
    const date = new Date('2024-01-14T12:00:00Z');
    expect(formatDueDate(date)).toBe('Overdue (yesterday)');
  });
});

describe('parseApiDate', () => {
  it('should parse valid date string', () => {
    const result = parseApiDate('2024-01-15T12:00:00Z');
    expect(result).toBeInstanceOf(Date);
    expect(result?.getFullYear()).toBe(2024);
  });

  it('should return null for invalid date string', () => {
    const result = parseApiDate('invalid-date');
    expect(result).toBeNull();
  });

  it('should return null for null input', () => {
    const result = parseApiDate(null);
    expect(result).toBeNull();
  });

  it('should return null for undefined input', () => {
    const result = parseApiDate(undefined);
    expect(result).toBeNull();
  });
});

describe('formatDateForInput', () => {
  it('should format date as YYYY-MM-DD', () => {
    const date = new Date('2024-01-15T12:00:00Z');
    const result = formatDateForInput(date);
    expect(result).toMatch(/2024-01-1[45]/); // Account for timezone
  });

  it('should return empty string for null', () => {
    const result = formatDateForInput(null);
    expect(result).toBe('');
  });

  it('should return empty string for undefined', () => {
    const result = formatDateForInput(undefined);
    expect(result).toBe('');
  });

  it('should handle string dates', () => {
    const result = formatDateForInput('2024-01-15T12:00:00Z');
    expect(result).toMatch(/2024-01-1[45]/);
  });
});

describe('isPastDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  it('should return true for past dates', () => {
    const date = new Date('2024-01-14T12:00:00Z');
    expect(isPastDate(date)).toBe(true);
  });

  it('should return false for future dates', () => {
    const date = new Date('2024-01-16T12:00:00Z');
    expect(isPastDate(date)).toBe(false);
  });

  it('should handle string dates', () => {
    expect(isPastDate('2024-01-14T12:00:00Z')).toBe(true);
  });
});

describe('isToday', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  it('should return true for today', () => {
    const date = new Date('2024-01-15T18:00:00Z');
    expect(isToday(date)).toBe(true);
  });

  it('should return false for other days', () => {
    const date = new Date('2024-01-14T12:00:00Z');
    expect(isToday(date)).toBe(false);
  });
});

describe('isTomorrow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  it('should return true for tomorrow', () => {
    const date = new Date('2024-01-16T12:00:00Z');
    expect(isTomorrow(date)).toBe(true);
  });

  it('should return false for other days', () => {
    const date = new Date('2024-01-15T12:00:00Z');
    expect(isTomorrow(date)).toBe(false);
  });
});

describe('formatShortRelativeDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  it('should return "now" for very recent dates', () => {
    const date = new Date('2024-01-15T11:59:30Z');
    expect(formatShortRelativeDate(date)).toBe('now');
  });

  it('should return "Xm ago" for minutes', () => {
    const date = new Date('2024-01-15T11:45:00Z');
    expect(formatShortRelativeDate(date)).toBe('15m ago');
  });

  it('should return "Xh ago" for hours', () => {
    const date = new Date('2024-01-15T09:00:00Z');
    expect(formatShortRelativeDate(date)).toBe('3h ago');
  });

  it('should return "Xd ago" for days', () => {
    const date = new Date('2024-01-12T12:00:00Z');
    expect(formatShortRelativeDate(date)).toBe('3d ago');
  });
});
