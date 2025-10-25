import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Input from './Input.svelte';

describe('Input', () => {
  it('renders text input by default', () => {
    render(Input, { props: { value: '', placeholder: 'Enter text' } });
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeTruthy();
    expect(input.getAttribute('type')).toBe('text');
  });

  it('renders with label', () => {
    render(Input, { props: { label: 'Username', value: '' } });
    const label = screen.getByText('Username');
    expect(label).toBeTruthy();
  });

  it('shows required indicator', () => {
    render(Input, { props: { label: 'Email', required: true, value: '' } });
    const required = screen.getByText('*');
    expect(required).toBeTruthy();
  });

  it('displays error message', () => {
    render(Input, { props: { error: 'This field is required', value: '' } });
    const error = screen.getByText('This field is required');
    expect(error).toBeTruthy();
    expect(error.className).toContain('text-red-600');
  });

  it('displays hint message', () => {
    render(Input, { props: { hint: 'Enter your email address', value: '' } });
    const hint = screen.getByText('Enter your email address');
    expect(hint).toBeTruthy();
    expect(hint.className).toContain('text-gray-500');
  });

  it('renders email input type', () => {
    render(Input, { props: { type: 'email', value: '' } });
    const input = screen.getByRole('textbox');
    expect(input.getAttribute('type')).toBe('email');
  });

  it('renders password input type', () => {
    render(Input, { props: { type: 'password', value: '' } });
    const inputs = document.querySelectorAll('input[type="password"]');
    expect(inputs.length).toBe(1);
  });

  it('can be disabled', () => {
    render(Input, { props: { disabled: true, value: '' } });
    const input = screen.getByRole('textbox');
    expect(input.hasAttribute('disabled')).toBe(true);
  });
});
