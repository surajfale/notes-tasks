/**
 * Authentication Store
 * 
 * Manages authentication state including user data, login/logout flows,
 * and token persistence. Uses Svelte stores for reactive state management.
 */

import { writable, derived } from 'svelte/store';
import { authRepository } from '$lib/repositories/auth.repository';
import { tokenStorage } from '$lib/storage/token';
import type { User, LoginCredentials, RegisterData } from '$lib/types/user';

/**
 * Authentication state interface
 */
interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Initial authentication state
 */
const initialState: AuthState = {
  user: null,
  isLoading: true,
  error: null
};

/**
 * Create the authentication store with methods for managing auth state
 */
function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(initialState);
  let isInitializing = false;
  let hasInitialized = false;

  return {
    subscribe,

    /**
     * Initialize authentication state by checking for existing token
     * and fetching user data if token exists
     */
    async initialize(): Promise<void> {
      // Prevent multiple simultaneous initializations
      if (isInitializing) {
        return;
      }

      // If already initialized and we have a user, skip
      if (hasInitialized) {
        let currentUser: User | null = null;
        subscribe(state => { currentUser = state.user; })();
        if (currentUser) {
          return;
        }
      }

      isInitializing = true;
      update(state => ({ ...state, isLoading: true }));

      const token = tokenStorage.getToken();

      if (!token) {
        set({ user: null, isLoading: false, error: null });
        isInitializing = false;
        hasInitialized = true;
        return;
      }

      try {
        const response = await authRepository.getCurrentUser();
        // Extract user from response (API returns {user: {...}})
        const user = (response as any).user || response;
        set({ user, isLoading: false, error: null });
        hasInitialized = true;
      } catch (error: any) {
        // Token is invalid or expired, clear it
        tokenStorage.clearToken();
        set({ user: null, isLoading: false, error: null });
        hasInitialized = true;
      } finally {
        isInitializing = false;
      }
    },

    /**
     * Login with username and password
     * @param username - User's username
     * @param password - User's password
     * @returns Promise resolving to true if login successful, false otherwise
     */
    async login(username: string, password: string): Promise<boolean> {
      update(state => ({ ...state, isLoading: true, error: null }));

      try {
        const credentials: LoginCredentials = { username, password };
        const { token, user } = await authRepository.login(credentials);
        
        tokenStorage.setToken(token);
        set({ user, isLoading: false, error: null });
        return true;
      } catch (error: any) {
        const errorMessage = error.message || 'Login failed';
        set({ user: null, isLoading: false, error: errorMessage });
        return false;
      }
    },

    /**
     * Register a new user account
     * @param data - Registration data (username, email, password, displayName)
     * @returns Promise resolving to true if registration successful, false otherwise
     */
    async register(data: RegisterData): Promise<boolean> {
      update(state => ({ ...state, isLoading: true, error: null }));

      try {
        const { token, user } = await authRepository.register(data);
        
        tokenStorage.setToken(token);
        set({ user, isLoading: false, error: null });
        return true;
      } catch (error: any) {
        const errorMessage = error.message || 'Registration failed';
        set({ user: null, isLoading: false, error: errorMessage });
        return false;
      }
    },

    /**
     * Logout the current user by clearing token and resetting state
     */
    logout(): void {
      tokenStorage.clearToken();
      set({ user: null, isLoading: false, error: null });
    },

    /**
     * Clear any error messages
     */
    clearError(): void {
      update(state => ({ ...state, error: null }));
    }
  };
}

/**
 * Main authentication store instance
 */
export const authStore = createAuthStore();

/**
 * Derived store that returns true if user is authenticated
 */
export const isAuthenticated = derived(
  authStore,
  $auth => $auth.user !== null
);

/**
 * Derived store that returns the current user or null
 */
export const currentUser = derived(
  authStore,
  $auth => $auth.user
);
