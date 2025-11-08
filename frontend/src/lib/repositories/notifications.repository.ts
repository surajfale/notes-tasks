// Notification preferences repository

import { apiClient } from '$lib/api/client';
import { API_ENDPOINTS } from '$lib/api/endpoints';
import type {
  NotificationPreferences,
  NotificationPreferencesResponse,
  UpdateNotificationPreferencesData
} from '$lib/types/notification';

/**
 * Notification preferences repository for handling notification-related API calls
 */
export const notificationsRepository = {
  /**
   * Get current user's notification preferences
   * @returns Promise resolving to notification preferences
   */
  async getPreferences(): Promise<NotificationPreferencesResponse> {
    try {
      return await apiClient.get<NotificationPreferencesResponse>(
        API_ENDPOINTS.NOTIFICATIONS.PREFERENCES
      );
    } catch (error: any) {
      // If preferences don't exist (404), return default preferences
      if (error.status === 404) {
        throw new Error('Notification preferences not found. Please set up your preferences.');
      }
      throw new Error(`Failed to fetch notification preferences: ${error.message}`);
    }
  },

  /**
   * Update user's notification preferences
   * @param preferences - Updated notification preferences
   * @returns Promise resolving to updated preferences
   */
  async updatePreferences(
    preferences: UpdateNotificationPreferencesData
  ): Promise<NotificationPreferencesResponse> {
    try {
      return await apiClient.put<NotificationPreferencesResponse>(
        API_ENDPOINTS.NOTIFICATIONS.PREFERENCES,
        preferences
      );
    } catch (error: any) {
      throw new Error(`Failed to update notification preferences: ${error.message}`);
    }
  },

  /**
   * Get default notification preferences
   * @returns Default notification preferences
   */
  getDefaultPreferences(): NotificationPreferences {
    return {
      emailNotificationsEnabled: true,
      browserNotificationsEnabled: false,
      notificationDays: ['1_day_before'],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      notificationTime: '09:00'
    };
  },

  /**
   * Update push subscription for browser notifications
   * @param subscription - Push subscription object
   * @returns Promise resolving to updated preferences
   */
  async updatePushSubscription(subscription: PushSubscriptionJSON): Promise<NotificationPreferencesResponse> {
    try {
      return await apiClient.put<NotificationPreferencesResponse>(
        API_ENDPOINTS.NOTIFICATIONS.PUSH_SUBSCRIPTION,
        { subscription }
      );
    } catch (error: any) {
      throw new Error(`Failed to update push subscription: ${error.message}`);
    }
  },

  /**
   * Remove push subscription (unsubscribe from browser notifications)
   * @returns Promise resolving to updated preferences
   */
  async removePushSubscription(): Promise<NotificationPreferencesResponse> {
    try {
      return await apiClient.delete<NotificationPreferencesResponse>(
        API_ENDPOINTS.NOTIFICATIONS.PUSH_SUBSCRIPTION
      );
    } catch (error: any) {
      throw new Error(`Failed to remove push subscription: ${error.message}`);
    }
  },

  /**
   * Get VAPID public key for push notifications
   * @returns Promise resolving to VAPID public key
   */
  async getVapidPublicKey(): Promise<{ publicKey: string }> {
    try {
      return await apiClient.get<{ publicKey: string }>(
        API_ENDPOINTS.NOTIFICATIONS.VAPID_PUBLIC_KEY
      );
    } catch (error: any) {
      throw new Error(`Failed to fetch VAPID public key: ${error.message}`);
    }
  }
};