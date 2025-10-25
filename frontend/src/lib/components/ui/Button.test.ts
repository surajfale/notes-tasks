import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Button from './Button.svelte';

describe('Button', () => {
  it('renders with default props', () => {
    const { container } = render(Button);
    const button = container.querySelector('button');
    expect(button).toBeTruthy();
    expect(button?.getAttribute('type')).toBe('button');
  });

  it('renders primary variant', () => {
    const { container } = render(Button, { props: { variant: 'primary' } });
    const button = container.querySelector('button');
    expect(button?.className).toContain('bg-primary-600');
  });

  it('renders secondary variant', () => {
    const { container } = render(Button, { props: { variant: 'secondary' } });
    const button = container.querySelector('button');
    expect(button?.className).toContain('bg-gray-200');
  });

  it('renders danger variant', () => {
    const { container } = render(Button, { props: { variant: 'danger' } });
    const button = container.querySelector('button');
    expect(button?.className).toContain('bg-red-600');
  });

  it('can be disabled', () => {
    const { container } = render(Button, { props: { disabled: true } });
    const button = container.querySelector('button');
    expect(button?.hasAttribute('disabled')).toBe(true);
  });

  it('renders full width', () => {
    const { container } = render(Button, { props: { fullWidth: true } });
    const button = container.querySelector('button');
    expect(button?.className).toContain('w-full');
  });

  it('supports submit type', () => {
    const { container } = render(Button, { props: { type: 'submit' } });
    const button = container.querySelector('button');
    expect(button?.getAttribute('type')).toBe('submit');
  });
});
