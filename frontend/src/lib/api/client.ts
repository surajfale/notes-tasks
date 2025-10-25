// HTTP client with JWT authentication

import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { tokenStorage } from '$lib/storage/token';
import { ApiError, type ErrorResponse } from '$lib/types/error';

/**
 * Request options extending standard fetch RequestInit
 */
interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

/**
 * HTTP client class for making authenticated API requests
 */
class ApiClient {
  private baseUrl: string;

  constructor() {
    // Get API base URL from environment variable or use default
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  }

  /**
   * Core request method with JWT token injection and error handling
   * @param endpoint - API endpoint path
   * @param options - Request options including requiresAuth flag
   * @returns Promise resolving to the response data
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { requiresAuth = true, ...fetchOptions } = options;

    // Prepare headers
    const headers = new Headers(fetchOptions.headers);
    headers.set('Content-Type', 'application/json');

    // Add JWT token if authentication is required
    if (requiresAuth && browser) {
      const token = tokenStorage.getToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        credentials: 'include'
      });

      // Handle 401 Unauthorized - clear token and redirect to login
      if (response.status === 401) {
        if (browser) {
          tokenStorage.clearToken();
          goto('/login');
        }
        throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
      }

      // Handle error responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as ErrorResponse;
        throw new ApiError(
          response.status,
          errorData.error?.code || 'UNKNOWN_ERROR',
          errorData.error?.message || 'An error occurred',
          errorData.error?.details
        );
      }

      // Handle empty responses (204 No Content)
      if (response.status === 204) {
        return null as T;
      }

      // Parse and return JSON response
      return await response.json();
    } catch (error) {
      // Re-throw ApiError instances
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Handle network or other errors
      throw new ApiError(0, 'NETWORK_ERROR', 'Network request failed');
    }
  }

  /**
   * Perform GET request
   * @param endpoint - API endpoint path
   * @param options - Request options
   * @returns Promise resolving to the response data
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * Perform POST request
   * @param endpoint - API endpoint path
   * @param data - Request body data
   * @param options - Request options
   * @returns Promise resolving to the response data
   */
  async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * Perform PUT request
   * @param endpoint - API endpoint path
   * @param data - Request body data
   * @param options - Request options
   * @returns Promise resolving to the response data
   */
  async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * Perform DELETE request
   * @param endpoint - API endpoint path
   * @param options - Request options
   * @returns Promise resolving to the response data
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

/**
 * Singleton instance of the API client
 */
export const apiClient = new ApiClient();
