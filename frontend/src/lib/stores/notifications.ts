import { writable } from 'svelte/store';
import { notificationsRepository } from '$lib/repositories/notifications.repository';
import type { NotificationPreferences, NotificationPreferencesResponse } from '$lib/types/notification';

export interface NotificationState {
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  error: string | null;
}

function createNotificationStore() {
  const { subscribe, set, update } = writable<NotificationState>({
    preferences: null,
    isLoading: false,
    error: null
  });

  return {
    subscribe,

    /**
     * Load notification preferences from the server
     */
    async loadPreferences(): Promise<void> {
      update(state => ({ ...state, isLoading: true, error: null }));

      try {
        const response = await notificationsRepository.getPreferences();
        update(state => ({
          ...state,
          preferences: {
            emailNotificationsEnabled: response.emailNotificationsEnabled,
            browserNotificationsEnabled: response.browserNotificationsEnabled || false,
            notificationDays: response.notificationDays,
            timezone: response.timezone,
            notificationTime: response.notificationTime || '09:00'
          },
          isLoading: false,
          error: null
        }));
      } catch (error: any) {
        // If preferences don't exist, use defaults
        if (error.message.includes('not found')) {
          const defaultPrefs = notificationsRepository.getDefaultPreferences();
          update(state => ({
            ...state,
            preferences: defaultPrefs,
            isLoading: false,
            error: null
          }));
        } else {
          update(state => ({
            ...state,
            isLoading: false,
            error: error.message || 'Failed to load notification preferences'
          }));
        }
      }
    },

    /**
     * Update notification preferences
     */
    async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
      update(state => ({ ...state, isLoading: true, error: null }));

      try {
        const response = await notificationsRepository.updatePreferences(preferences);
        update(state => ({
          ...state,
          preferences: {
            emailNotificationsEnabled: response.emailNotificationsEnabled,
            browserNotificationsEnabled: response.browserNotificationsEnabled || false,
            notificationDays: response.notificationDays,
            timezone: response.timezone,
            notificationTime: response.notificationTime || '09:00'
          },
          isLoading: false,
          error: null
        }));
      } catch (error: any) {
        update(state => ({
          ...state,
          isLoading: false,
          error: error.message || 'Failed to update notification preferences'
        }));
        throw error; // Re-throw to allow component to handle
      }
    },

    /**
     * Reset preferences to defaults
     */
    resetToDefaults(): void {
      const defaultPrefs = notificationsRepository.getDefaultPreferences();
      update(state => ({
        ...state,
        preferences: defaultPrefs,
        error: null
      }));
    },

    /**
     * Clear error state
     */
    clearError(): void {
      update(state => ({ ...state, error: null }));
    },

    /**
     * Reset store state
     */
    reset(): void {
      set({
        preferences: null,
        isLoading: false,
        error: null
      });
    }
  };
}

export const notificationStore = createNotificationStore();