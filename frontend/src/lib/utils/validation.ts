/**
 * Form validation utilities
 * Provides reusable validation functions for all forms in the application
 */

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Validation errors object type
 */
export type ValidationErrors<T> = Partial<Record<keyof T, string>>;

/**
 * Required field validation
 * Checks if a value is not empty after trimming whitespace
 */
export function validateRequired(value: string, fieldName: string): ValidationResult {
  if (!value || !value.trim()) {
    return {
      valid: false,
      message: `${fieldName} is required`
    };
  }
  return { valid: true };
}

/**
 * Email format validation
 * Validates email address format using regex
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || !email.trim()) {
    return {
      valid: false,
      message: 'Email is required'
    };
  }

  // Standard email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return {
      valid: false,
      message: 'Please enter a valid email address'
    };
  }

  return { valid: true };
}

/**
 * Password strength validation
 * Validates password meets minimum security requirements:
 * - At least 8 characters long
 * - Contains at least one uppercase letter
 * - Contains at least one lowercase letter
 * - Contains at least one number
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return {
      valid: false,
      message: 'Password is required'
    };
  }

  if (password.length < 8) {
    return {
      valid: false,
      message: 'Password must be at least 8 characters long'
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one uppercase letter'
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one lowercase letter'
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one number'
    };
  }

  return { valid: true };
}

/**
 * Password confirmation validation
 * Validates that two passwords match
 */
export function validatePasswordMatch(
  password: string,
  confirmPassword: string
): ValidationResult {
  if (!confirmPassword) {
    return {
      valid: false,
      message: 'Please confirm your password'
    };
  }

  if (password !== confirmPassword) {
    return {
      valid: false,
      message: 'Passwords do not match'
    };
  }

  return { valid: true };
}

/**
 * Username validation
 * Validates username meets minimum requirements:
 * - Not empty
 * - At least 3 characters long
 */
export function validateUsername(username: string): ValidationResult {
  if (!username || !username.trim()) {
    return {
      valid: false,
      message: 'Username is required'
    };
  }

  if (username.trim().length < 3) {
    return {
      valid: false,
      message: 'Username must be at least 3 characters long'
    };
  }

  return { valid: true };
}

/**
 * Minimum length validation
 * Validates that a string meets a minimum length requirement
 */
export function validateMinLength(
  value: string,
  minLength: number,
  fieldName: string
): ValidationResult {
  if (!value) {
    return {
      valid: false,
      message: `${fieldName} is required`
    };
  }

  if (value.length < minLength) {
    return {
      valid: false,
      message: `${fieldName} must be at least ${minLength} characters long`
    };
  }

  return { valid: true };
}

/**
 * Maximum length validation
 * Validates that a string does not exceed a maximum length
 */
export function validateMaxLength(
  value: string,
  maxLength: number,
  fieldName: string
): ValidationResult {
  if (value && value.length > maxLength) {
    return {
      valid: false,
      message: `${fieldName} must not exceed ${maxLength} characters`
    };
  }

  return { valid: true };
}

/**
 * Format validation error message
 * Converts a validation result into a user-friendly error message
 */
export function formatValidationError(result: ValidationResult): string | undefined {
  return result.valid ? undefined : result.message;
}

/**
 * Validate multiple fields
 * Helper function to validate multiple fields and collect errors
 */
export function validateFields<T extends Record<string, any>>(
  validators: Array<{
    field: keyof T;
    validate: () => ValidationResult;
  }>
): { isValid: boolean; errors: ValidationErrors<T> } {
  const errors: ValidationErrors<T> = {};
  let isValid = true;

  for (const { field, validate } of validators) {
    const result = validate();
    if (!result.valid) {
      errors[field] = result.message;
      isValid = false;
    }
  }

  return { isValid, errors };
}

/**
 * Login form validation
 * Validates login form fields
 */
export function validateLoginForm(data: {
  username: string;
  password: string;
}): { isValid: boolean; errors: ValidationErrors<typeof data> } {
  return validateFields([
    {
      field: 'username',
      validate: () => validateRequired(data.username, 'Username')
    },
    {
      field: 'password',
      validate: () => validateRequired(data.password, 'Password')
    }
  ]);
}

/**
 * Registration form validation
 * Validates registration form fields
 */
export function validateRegisterForm(data: {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
}): { isValid: boolean; errors: ValidationErrors<typeof data> } {
  return validateFields([
    {
      field: 'username',
      validate: () => validateUsername(data.username)
    },
    {
      field: 'email',
      validate: () => validateEmail(data.email)
    },
    {
      field: 'password',
      validate: () => validatePassword(data.password)
    },
    {
      field: 'confirmPassword',
      validate: () => validatePasswordMatch(data.password, data.confirmPassword)
    },
    {
      field: 'displayName',
      validate: () => validateRequired(data.displayName, 'Display name')
    }
  ]);
}

/**
 * Note form validation
 * Validates note creation/edit form fields
 */
export function validateNoteForm(data: {
  title: string;
  body?: string;
}): { isValid: boolean; errors: ValidationErrors<typeof data> } {
  return validateFields([
    {
      field: 'title',
      validate: () => validateRequired(data.title, 'Title')
    }
  ]);
}

/**
 * Task form validation
 * Validates task creation/edit form fields
 */
export function validateTaskForm(data: {
  title: string;
  description?: string;
}): { isValid: boolean; errors: ValidationErrors<typeof data> } {
  return validateFields([
    {
      field: 'title',
      validate: () => validateRequired(data.title, 'Title')
    }
  ]);
}

/**
 * List form validation
 * Validates list creation/edit form fields
 */
export function validateListForm(data: {
  title: string;
  color: string;
}): { isValid: boolean; errors: ValidationErrors<typeof data> } {
  return validateFields([
    {
      field: 'title',
      validate: () => validateRequired(data.title, 'Title')
    },
    {
      field: 'color',
      validate: () => validateRequired(data.color, 'Color')
    }
  ]);
}

/**
 * Password change form validation
 * Validates password change form fields
 */
export function validatePasswordChangeForm(data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): { isValid: boolean; errors: ValidationErrors<typeof data> } {
  const errors: ValidationErrors<typeof data> = {};
  let isValid = true;

  // Validate current password
  const currentPasswordResult = validateRequired(data.currentPassword, 'Current password');
  if (!currentPasswordResult.valid) {
    errors.currentPassword = currentPasswordResult.message;
    isValid = false;
  }

  // Validate new password
  const newPasswordResult = validatePassword(data.newPassword);
  if (!newPasswordResult.valid) {
    errors.newPassword = newPasswordResult.message;
    isValid = false;
  }

  // Validate confirm password
  const confirmPasswordResult = validatePasswordMatch(data.newPassword, data.confirmPassword);
  if (!confirmPasswordResult.valid) {
    errors.confirmPassword = confirmPasswordResult.message;
    isValid = false;
  }

  // Check if new password is different from current
  if (isValid && data.currentPassword === data.newPassword) {
    errors.newPassword = 'New password must be different from current password';
    isValid = false;
  }

  return { isValid, errors };
}
