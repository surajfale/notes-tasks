// Notification preference type definitions
//
// These are account-level switches. What gets sent, and when, is set per
// task as reminders (see TaskReminder in ./task.ts).

export interface NotificationPreferences {
  /** Master switch for reminder emails (also flipped by the email unsubscribe link). */
  emailNotificationsEnabled: boolean;
  /** Master switch for browser push; requires a push subscription on this account. */
  browserNotificationsEnabled: boolean;
  timezone: string;
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
  timezone?: string;
}
