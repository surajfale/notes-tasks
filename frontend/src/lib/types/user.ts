// User type definitions

import type { ThemePalette } from './theme';

export interface User {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  /** Account-synced color theme; absent from older API responses. */
  themePalette?: ThemePalette;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  displayName: string;
  /** Required when sign-up is invite-only (RegistrationMode 'invite'). */
  inviteCode?: string;
}

/** Who may sign up; set on the server (backend/src/config/registration.js). */
export type RegistrationMode = 'open' | 'invite' | 'closed';

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}
