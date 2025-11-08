import { describe, it, expect } from 'vitest';
import { validateNotificationPreferences } from './validation';

describe('validateNotificationPreferences', () => {
  it('should return null when notifications are disabled', () => {
    const result = validateNotificationPreferences(false, [], null);
    expect(result).toBeNull();
  });

  it('should return error when enabled but no due date', () => {
    const result = validateNotificationPreferences(true, ['same_day'], null);
    expect(result).toBe('Due date is required when notifications are enabled');
  });

  it('should return error when enabled but no timings selected', () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);
    const result = validateNotificationPreferences(true, [], dueDate);
    expect(result).toBe('Please select at least one notification timing');
  });

  it('should return null when valid configuration', () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);
    const result = validateNotificationPreferences(true, ['same_day', '1_day_before'], dueDate);
    expect(result).toBeNull();
  });

  it('should return error when selected timing is not available for due date', () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1); // Only 1 day away
    const result = validateNotificationPreferences(true, ['2_days_before'], dueDate);
    expect(result).toBe('Some selected notification timings are not available for this due date');
  });

  it('should allow same_day for today', () => {
    const dueDate = new Date();
    const result = validateNotificationPreferences(true, ['same_day'], dueDate);
    expect(result).toBeNull();
  });

  it('should allow same_day and 1_day_before for tomorrow', () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);
    const result = validateNotificationPreferences(true, ['same_day', '1_day_before'], dueDate);
    expect(result).toBeNull();
  });

  it('should allow all timings for date 2+ days away', () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 2);
    const result = validateNotificationPreferences(
      true,
      ['same_day', '1_day_before', '2_days_before'],
      dueDate
    );
    expect(result).toBeNull();
  });
});
