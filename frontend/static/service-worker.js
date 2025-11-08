const CACHE_NAME = 'notes-tasks-v1';
const RUNTIME_CACHE = 'notes-tasks-runtime';

// Assets to cache on install
const PRECACHE_URLS = [
  '/',
  '/login',
  '/register',
  '/notes',
  '/tasks',
  '/lists',
  '/settings'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip API requests (let them fail naturally for offline handling)
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.open(RUNTIME_CACHE).then(cache => {
      return fetch(event.request)
        .then(response => {
          // Cache successful responses
          if (response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
            return new Response('Offline', { status: 503 });
          });
        });
    })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  let notificationData = {
    title: 'Task Reminder',
    body: 'You have a task due soon',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: 'task-notification',
    data: {},
    actions: [],
    requireInteraction: false
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      notificationData = {
        ...notificationData,
        ...payload
      };
    }
  } catch (error) {
    console.error('Error parsing push notification data:', error);
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      actions: notificationData.actions,
      requireInteraction: notificationData.requireInteraction,
      vibrate: notificationData.vibrate || [200, 100, 200]
    }
  );

  event.waitUntil(promiseChain);
});

// Notification click event - handle notification interactions
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  const notificationData = event.notification.data || {};
  const action = event.action;

  let urlToOpen = '/tasks';

  // Handle different actions
  if (action === 'view' && notificationData.url) {
    urlToOpen = notificationData.url;
  } else if (action === 'complete' && notificationData.taskId) {
    // Mark task as complete via API
    event.waitUntil(
      handleTaskCompletion(notificationData.taskId).then(() => {
        // Open the tasks page after completion
        return openOrFocusClient('/tasks');
      })
    );
    return;
  } else if (notificationData.url) {
    urlToOpen = notificationData.url;
  }

  // Open or focus the client window
  event.waitUntil(openOrFocusClient(urlToOpen));
});

/**
 * Open or focus a client window with the specified URL
 * @param {string} url - URL to open
 * @returns {Promise}
 */
async function openOrFocusClient(url) {
  const fullUrl = new URL(url, self.location.origin).href;

  // Check if there's already a window open
  const windowClients = await clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  });

  // Try to find an existing window to focus
  for (const client of windowClients) {
    if (client.url === fullUrl && 'focus' in client) {
      return client.focus();
    }
  }

  // If no existing window, open a new one
  if (clients.openWindow) {
    return clients.openWindow(fullUrl);
  }
}

/**
 * Handle task completion via API
 * @param {string} taskId - Task ID to complete
 * @returns {Promise}
 */
async function handleTaskCompletion(taskId) {
  try {
    // Get the authentication token from IndexedDB or cache
    // Note: This is a simplified version. In production, you'd need proper token management
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        isCompleted: true
      })
    });

    if (response.ok) {
      console.log('Task marked as complete:', taskId);
      // Show a success notification
      await self.registration.showNotification('Task Completed', {
        body: 'Task has been marked as complete',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: 'task-complete'
      });
    } else {
      console.error('Failed to complete task:', response.status);
    }
  } catch (error) {
    console.error('Error completing task:', error);
  }
}

// Push subscription change event - handle subscription updates/expiration
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription changed:', event);

  event.waitUntil(
    // Re-subscribe and update the server
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: event.oldSubscription?.options.applicationServerKey
    }).then(async (newSubscription) => {
      console.log('New push subscription:', newSubscription);

      // Update the server with the new subscription
      try {
        await fetch('/api/notifications/push-subscription', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            subscription: newSubscription.toJSON()
          })
        });
      } catch (error) {
        console.error('Error updating push subscription:', error);
      }
    }).catch((error) => {
      console.error('Error re-subscribing to push:', error);
    })
  );
});
