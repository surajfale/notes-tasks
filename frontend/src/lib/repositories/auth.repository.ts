// Authentication repository

import { apiClient } from '$lib/api/client';
import { API_ENDPOINTS } from '$lib/api/endpoints';
import type {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
  ChangePasswordData
} from '$lib/types/user';

/**
 * Authentication repository for handling auth-related API calls
 */
export const authRepository = {
  /**
   * Login with username and password
   * @param credentials - Login credentials (username, password)
   * @returns Promise resolving to auth response with token and user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials,
      { requiresAuth: false }
    );
  },

  /**
   * Register a new user account
   * @param data - Registration data (username, email, password, displayName)
   * @returns Promise resolving to auth response with token and user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      data,
      { requiresAuth: false }
    );
  },

  /**
   * Get current authenticated user
   * @returns Promise resolving to user data
   */
  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>(API_ENDPOINTS.AUTH.ME);
  },

  /**
   * Change user password
   * @param data - Current password and new password
   * @returns Promise resolving when password is changed
   */
  async changePassword(data: ChangePasswordData): Promise<void> {
    return apiClient.put<void>(API_ENDPOINTS.AUTH.PASSWORD, data);
  },

  /**
   * Delete user account and all associated data
   * @returns Promise resolving when account is deleted
   */
  async deleteAccount(): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.AUTH.ACCOUNT);
  }
};
