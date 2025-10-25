/**
 * Root layout load function
 * Initializes authentication and theme stores on app startup
 */

import { authStore } from '$lib/stores/auth';
import { themeStore } from '$lib/stores/theme';
import { listsStore } from '$lib/stores/lists';

export const ssr = false; // Disable SSR for client-side only app
export const prerender = true;

export async function load() {
  // Initialize theme from localStorage
  themeStore.initialize();
  
  // Initialize authentication state
  await authStore.initialize();
  
  // Load lists if authenticated (for sidebar display)
  // This will be handled reactively in the layout component
  
  return {};
}
