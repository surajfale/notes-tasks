/**
 * Client-side hooks for navigation guards and route protection
 * 
 * This file implements authentication-based route protection:
 * - Redirects unauthenticated users to /login when accessing protected routes
 * - Redirects authenticated users away from /login and /register to home
 * - Initializes the offline sync service for background synchronization
 * 
 * For SvelteKit client-side apps, navigation guards are implemented in the
 * root layout component using beforeNavigate. This file exports utility
 * functions that can be used by the layout.
 * 
 * Requirements: 8.2, 8.4, 7.2, 7.3, 7.4
 */

import { syncService } from '$lib/storage/sync';
import { authStore } from '$lib/stores/auth';

// Initialize auth store to restore user session from token
authStore.initialize();

// Initialize sync service when the app loads
syncService.initialize();

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

// Global error handler to prevent blank screens
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    // Prevent the error from causing a blank screen
    event.preventDefault();
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Prevent the error from causing a blank screen
    event.preventDefault();
  });
}

/**
 * Public routes that don't require authentication
 */
export const PUBLIC_ROUTES = ['/login', '/register'];

/**
 * Auth-only routes that should redirect authenticated users
 */
export const AUTH_ONLY_ROUTES = ['/login', '/register'];

/**
 * Check if a route path is public (doesn't require authentication)
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
}

/**
 * Check if a route is auth-only (login/register pages)
 */
export function isAuthOnlyRoute(pathname: string): boolean {
  return AUTH_ONLY_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
}
