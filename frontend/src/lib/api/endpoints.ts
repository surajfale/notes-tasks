// API endpoint constants

/**
 * Base API endpoints for the backend
 */
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me',
    PASSWORD: '/api/auth/password',
    ACCOUNT: '/api/auth/account'
  },

  // Notes endpoints
  NOTES: {
    BASE: '/api/notes',
    BY_ID: (id: string) => `/api/notes/${id}`,
    ARCHIVE: (id: string) => `/api/notes/${id}/archive`
  },

  // Tasks endpoints
  TASKS: {
    BASE: '/api/tasks',
    BY_ID: (id: string) => `/api/tasks/${id}`,
    COMPLETE: (id: string) => `/api/tasks/${id}/complete`
  },

  // Lists endpoints
  LISTS: {
    BASE: '/api/lists',
    BY_ID: (id: string) => `/api/lists/${id}`
  }
} as const;
