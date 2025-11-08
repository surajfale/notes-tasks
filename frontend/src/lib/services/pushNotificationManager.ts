import { apiClient } from '$lib/api/client';
import { notificationsRepository } from '$lib/repositories/notifications.repository';
import { API_ENDPOINTS } from '$lib/api/endpoints';

/**
 * Push Notification Manager
 * Handles browser push notification subscription and management
 */
class PushNotificationManager {
  private vapidPublicKey: string | null = null;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  /**
   * Initialize the push notification manager
   */
  async initialize(): Promise<void> {
    try {
      console.log('[PushManager] Starting initialization...');

      // Check if service worker is supported
      if (!('serviceWorker' in navigator)) {
        console.warn('[PushManager] Service Worker not supported');
        return;
      }
      console.log('[PushManager] Service Worker supported');

      // Check if push notifications are supported
      if (!('PushManager' in window)) {
        console.warn('[PushManager] Push notifications not supported');
        return;
      }
      console.log('[PushManager] PushManager supported');

      // Get the service worker registration
      console.log('[PushManager] Checking for service worker registration...');

      // Check if service worker is already registered
      const existingReg = await navigator.serviceWorker.getRegistration();
      if (!existingReg) {
        console.log('[PushManager] No service worker registered, registering now...');
        try {
          const newReg = await navigator.serviceWorker.register('/service-worker.js');
          console.log('[PushManager] Service worker registered:', newReg.scope);
        } catch (regError) {
          console.error('[PushManager] Failed to register service worker:', regError);
          throw new Error('Failed to register service worker');
        }
      } else {
        console.log('[PushManager] Service worker already registered at:', existingReg.scope);
      }

      console.log('[PushManager] Waiting for service worker to be ready...');
      this.serviceWorkerRegistration = await navigator.serviceWorker.ready;
      console.log('[PushManager] Service worker is ready!');

      // Fetch VAPID public key from server
      console.log('[PushManager] Fetching VAPID public key...');
      await this.fetchVapidPublicKey();
      console.log('[PushManager] VAPID key fetched');

      console.log('[PushManager] Push notification manager initialized successfully');
    } catch (error) {
      console.error('[PushManager] Error initializing push notification manager:', error);
      throw error;
    }
  }

  /**
   * Fetch VAPID public key from the server
   */
  private async fetchVapidPublicKey(): Promise<void> {
    try {
      const response = await apiClient.get<{ success: boolean; publicKey: string }>(API_ENDPOINTS.NOTIFICATIONS.VAPID_PUBLIC_KEY, { requiresAuth: false });
      this.vapidPublicKey = response.publicKey;
    } catch (error) {
      console.error('Error fetching VAPID public key:', error);
      throw new Error('Failed to fetch VAPID public key');
    }
  }

  /**
   * Request permission for push notifications
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  }

  /**
   * Check current notification permission
   */
  getPermission(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<PushSubscription | null> {
    try {
      // Check permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Ensure we have the VAPID public key
      if (!this.vapidPublicKey) {
        await this.fetchVapidPublicKey();
      }

      if (!this.vapidPublicKey) {
        throw new Error('VAPID public key not available');
      }

      // Ensure service worker is registered
      if (!this.serviceWorkerRegistration) {
        this.serviceWorkerRegistration = await navigator.serviceWorker.ready;
      }

      // Check if already subscribed
      let subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();

      if (subscription) {
        console.log('Already subscribed to push notifications');
        // Update the subscription on the server
        await this.updateSubscriptionOnServer(subscription);
        return subscription;
      }

      // Subscribe to push notifications
      subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      console.log('Subscribed to push notifications:', subscription);

      // Send subscription to server
      await this.updateSubscriptionOnServer(subscription);

      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<void> {
    try {
      if (!this.serviceWorkerRegistration) {
        this.serviceWorkerRegistration = await navigator.serviceWorker.ready;
      }

      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        console.log('Unsubscribed from push notifications');

        // Remove subscription from server
        await this.removeSubscriptionFromServer();
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      throw error;
    }
  }

  /**
   * Check if currently subscribed to push notifications
   */
  async isSubscribed(): Promise<boolean> {
    try {
      if (!this.serviceWorkerRegistration) {
        this.serviceWorkerRegistration = await navigator.serviceWorker.ready;
      }

      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  /**
   * Get current push subscription
   */
  async getSubscription(): Promise<PushSubscription | null> {
    try {
      if (!this.serviceWorkerRegistration) {
        this.serviceWorkerRegistration = await navigator.serviceWorker.ready;
      }

      return await this.serviceWorkerRegistration.pushManager.getSubscription();
    } catch (error) {
      console.error('Error getting subscription:', error);
      return null;
    }
  }

  /**
   * Update push subscription on the server
   */
  private async updateSubscriptionOnServer(subscription: PushSubscription): Promise<void> {
    try {
      await notificationsRepository.updatePushSubscription(subscription.toJSON());
      console.log('Push subscription updated on server');
    } catch (error) {
      console.error('Error updating subscription on server:', error);
      throw error;
    }
  }

  /**
   * Remove push subscription from the server
   */
  private async removeSubscriptionFromServer(): Promise<void> {
    try {
      await notificationsRepository.removePushSubscription();
      console.log('Push subscription removed from server');
    } catch (error) {
      console.error('Error removing subscription from server:', error);
      throw error;
    }
  }

  /**
   * Convert VAPID public key from URL-safe base64 to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray as Uint8Array<ArrayBuffer>;
  }

  /**
   * Show a test notification
   */
  async showTestNotification(): Promise<void> {
    if (this.getPermission() !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    if (!this.serviceWorkerRegistration) {
      throw new Error('Service worker not registered');
    }

    await this.serviceWorkerRegistration.showNotification('Test Notification', {
      body: 'Browser notifications are working!',
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: 'test-notification',
      vibrate: [200, 100, 200]
    } as NotificationOptions);
  }

  /**
   * Request permission and subscribe to push notifications
   * Convenience method that combines permission request and subscription
   */
  async requestPermissionAndSubscribe(): Promise<boolean> {
    try {
      const subscription = await this.subscribe();
      return !!subscription;
    } catch (error) {
      console.error('Error in requestPermissionAndSubscribe:', error);
      return false;
    }
  }

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }
}

// Export singleton instance
export const pushNotificationManager = new PushNotificationManager();
