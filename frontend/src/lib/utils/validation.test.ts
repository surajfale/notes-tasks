import { describe, it, expect } from 'vitest';
import {
  validateRequired,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateUsername,
  validateMinLength,
  validateMaxLength,
  validateLoginForm,
  validateRegisterForm,
  validateNoteForm,
  validateTaskForm,
  validateListForm,
  validatePasswordChangeForm
} from './validation';

describe('validateRequired', () => {
  it('should return valid for non-empty string', () => {
    const result = validateRequired('test', 'Field');
    expect(result.valid).toBe(true);
  });

  it('should return invalid for empty string', () => {
    const result = validateRequired('', 'Field');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Field is required');
  });

  it('should return invalid for whitespace-only string', () => {
    const result = validateRequired('   ', 'Field');
    expect(result.valid).toBe(false);
  });
});

describe('validateEmail', () => {
  it('should return valid for correct email format', () => {
    const result = validateEmail('test@example.com');
    expect(result.valid).toBe(true);
  });

  it('should return invalid for missing @', () => {
    const result = validateEmail('testexample.com');
    expect(result.valid).toBe(false);
  });

  it('should return invalid for missing domain', () => {
    const result = validateEmail('test@');
    expect(result.valid).toBe(false);
  });

  it('should return invalid for empty string', () => {
    const result = validateEmail('');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Email is required');
  });
});

describe('validatePassword', () => {
  it('should return valid for strong password', () => {
    const result = validatePassword('Test1234');
    expect(result.valid).toBe(true);
  });

  it('should return invalid for password less than 8 characters', () => {
    const result = validatePassword('Test12');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('8 characters');
  });

  it('should return invalid for password without uppercase', () => {
    const result = validatePassword('test1234');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('uppercase');
  });

  it('should return invalid for password without lowercase', () => {
    const result = validatePassword('TEST1234');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('lowercase');
  });

  it('should return invalid for password without number', () => {
    const result = validatePassword('TestTest');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('number');
  });

  it('should return invalid for empty password', () => {
    const result = validatePassword('');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Password is required');
  });
});

describe('validatePasswordMatch', () => {
  it('should return valid when passwords match', () => {
    const result = validatePasswordMatch('Test1234', 'Test1234');
    expect(result.valid).toBe(true);
  });

  it('should return invalid when passwords do not match', () => {
    const result = validatePasswordMatch('Test1234', 'Test5678');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Passwords do not match');
  });

  it('should return invalid for empty confirm password', () => {
    const result = validatePasswordMatch('Test1234', '');
    expect(result.valid).toBe(false);
  });
});

describe('validateUsername', () => {
  it('should return valid for username with 3+ characters', () => {
    const result = validateUsername('user');
    expect(result.valid).toBe(true);
  });

  it('should return invalid for username less than 3 characters', () => {
    const result = validateUsername('ab');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('3 characters');
  });

  it('should return invalid for empty username', () => {
    const result = validateUsername('');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Username is required');
  });
});

describe('validateMinLength', () => {
  it('should return valid when value meets minimum length', () => {
    const result = validateMinLength('test', 3, 'Field');
    expect(result.valid).toBe(true);
  });

  it('should return invalid when value is too short', () => {
    const result = validateMinLength('ab', 3, 'Field');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('3 characters');
  });
});

describe('validateMaxLength', () => {
  it('should return valid when value is within max length', () => {
    const result = validateMaxLength('test', 10, 'Field');
    expect(result.valid).toBe(true);
  });

  it('should return invalid when value exceeds max length', () => {
    const result = validateMaxLength('test string', 5, 'Field');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('5 characters');
  });
});

describe('validateLoginForm', () => {
  it('should return valid for correct login data', () => {
    const result = validateLoginForm({
      username: 'testuser',
      password: 'password123'
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('should return invalid for missing username', () => {
    const result = validateLoginForm({
      username: '',
      password: 'password123'
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.username).toBeDefined();
  });

  it('should return invalid for missing password', () => {
    const result = validateLoginForm({
      username: 'testuser',
      password: ''
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.password).toBeDefined();
  });
});

describe('validateRegisterForm', () => {
  it('should return valid for correct registration data', () => {
    const result = validateRegisterForm({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test1234',
      confirmPassword: 'Test1234',
      displayName: 'Test User'
    });
    expect(result.isValid).toBe(true);
  });

  it('should return invalid for weak password', () => {
    const result = validateRegisterForm({
      username: 'testuser',
      email: 'test@example.com',
      password: 'weak',
      confirmPassword: 'weak',
      displayName: 'Test User'
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.password).toBeDefined();
  });

  it('should return invalid for mismatched passwords', () => {
    const result = validateRegisterForm({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test1234',
      confirmPassword: 'Test5678',
      displayName: 'Test User'
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.confirmPassword).toBeDefined();
  });
});

describe('validateNoteForm', () => {
  it('should return valid for note with title', () => {
    const result = validateNoteForm({
      title: 'My Note',
      body: 'Note content'
    });
    expect(result.isValid).toBe(true);
  });

  it('should return invalid for note without title', () => {
    const result = validateNoteForm({
      title: '',
      body: 'Note content'
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.title).toBeDefined();
  });
});

describe('validateTaskForm', () => {
  it('should return valid for task with title', () => {
    const result = validateTaskForm({
      title: 'My Task',
      description: 'Task description'
    });
    expect(result.isValid).toBe(true);
  });

  it('should return invalid for task without title', () => {
    const result = validateTaskForm({
      title: ''
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.title).toBeDefined();
  });
});

describe('validateListForm', () => {
  it('should return valid for list with title and color', () => {
    const result = validateListForm({
      title: 'My List',
      color: '#FF0000'
    });
    expect(result.isValid).toBe(true);
  });

  it('should return invalid for list without title', () => {
    const result = validateListForm({
      title: '',
      color: '#FF0000'
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.title).toBeDefined();
  });

  it('should return invalid for list without color', () => {
    const result = validateListForm({
      title: 'My List',
      color: ''
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.color).toBeDefined();
  });
});

describe('validatePasswordChangeForm', () => {
  it('should return valid for correct password change data', () => {
    const result = validatePasswordChangeForm({
      currentPassword: 'OldPass123',
      newPassword: 'NewPass123',
      confirmPassword: 'NewPass123'
    });
    expect(result.isValid).toBe(true);
  });

  it('should return invalid when new password same as current', () => {
    const result = validatePasswordChangeForm({
      currentPassword: 'SamePass123',
      newPassword: 'SamePass123',
      confirmPassword: 'SamePass123'
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.newPassword).toContain('different');
  });

  it('should return invalid for weak new password', () => {
    const result = validatePasswordChangeForm({
      currentPassword: 'OldPass123',
      newPassword: 'weak',
      confirmPassword: 'weak'
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.newPassword).toBeDefined();
  });
});
