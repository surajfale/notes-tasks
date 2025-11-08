// Notification preference type definitions

export type NotificationDay = 'same_day' | '1_day_before' | '2_days_before';

export interface NotificationPreferences {
  emailNotificationsEnabled: boolean;
  browserNotificationsEnabled: boolean;
  notificationDays: NotificationDay[];
  timezone: string;
  notificationTime: string; // HH:MM format (24-hour)
}

export interface NotificationPreferencesResponse extends NotificationPreferences {
  _id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateNotificationPreferencesData {
  emailNotificationsEnabled?: boolean;
  browserNotificationsEnabled?: boolean;
  notificationDays?: NotificationDay[];
  timezone?: string;
  notificationTime?: string;
}