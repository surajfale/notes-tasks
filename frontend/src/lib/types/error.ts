// Error type definitions

export class ApiError extends Error {
  public statusCode: number; // Alias for compatibility
  
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = status; // Set alias
  }

  /**
   * Check if error is an authentication error (401)
   */
  isAuthError(): boolean {
    return this.status === 401;
  }

  /**
   * Check if error is a validation error (400)
   */
  isValidationError(): boolean {
    return this.status === 400;
  }

  /**
   * Check if error is a not found error (404)
   */
  isNotFoundError(): boolean {
    return this.status === 404;
  }

  /**
   * Check if error is a rate limit error (429)
   */
  isRateLimitError(): boolean {
    return this.status === 429;
  }

  /**
   * Check if error is a server error (500+)
   */
  isServerError(): boolean {
    return this.status >= 500;
  }

  /**
   * Check if error is a network error (status 0)
   */
  isNetworkError(): boolean {
    return this.status === 0;
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    if (this.isNetworkError()) {
      return 'Network connection failed. Please check your internet connection.';
    }
    if (this.isAuthError()) {
      return 'Authentication required. Please log in again.';
    }
    if (this.isRateLimitError()) {
      return 'Too many requests. Please try again later.';
    }
    if (this.isServerError()) {
      return 'Server error occurred. Please try again later.';
    }
    return this.message;
  }
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
