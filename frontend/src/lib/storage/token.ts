/**
 * Token Storage Utility
 * 
 * Manages JWT token persistence in browser localStorage.
 * Used for maintaining authentication state across sessions.
 */

const TOKEN_KEY = 'auth_token';

/**
 * Token storage interface for managing JWT tokens
 */
export const tokenStorage = {
  /**
   * Retrieve JWT token from localStorage
   * @returns The stored JWT token or null if not found
   */
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Failed to retrieve token from localStorage:', error);
      return null;
    }
  },

  /**
   * Store JWT token in localStorage
   * @param token - The JWT token to store
   */
  setToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to store token in localStorage:', error);
    }
  },

  /**
   * Remove JWT token from localStorage
   */
  clearToken(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Failed to clear token from localStorage:', error);
    }
  }
};
