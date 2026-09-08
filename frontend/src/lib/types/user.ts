// User type definitions

export type UiPersona = 'focus' | 'vivid' | 'terminal';

export interface User {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  uiPersona?: UiPersona;
  personaOnboarded?: boolean;
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
}

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
