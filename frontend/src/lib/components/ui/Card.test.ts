import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Card from './Card.svelte';

describe('Card', () => {
  it('renders with default props', () => {
    const { container } = render(Card, { props: { children: 'Card content' } });
    const card = container.querySelector('div');
    expect(card).toBeTruthy();
    expect(card?.className).toContain('bg-white');
    expect(card?.className).toContain('rounded-xl');
  });

  it('renders with small padding', () => {
    const { container } = render(Card, { props: { padding: 'small' } });
    const card = container.querySelector('div');
    expect(card?.className).toContain('p-3');
  });

  it('renders with medium padding', () => {
    const { container } = render(Card, { props: { padding: 'medium' } });
    const card = container.querySelector('div');
    expect(card?.className).toContain('p-4');
  });

  it('renders with large padding', () => {
    const { container } = render(Card, { props: { padding: 'large' } });
    const card = container.querySelector('div');
    expect(card?.className).toContain('p-6');
  });

  it('renders with no padding', () => {
    const { container } = render(Card, { props: { padding: 'none' } });
    const card = container.querySelector('div');
    expect(card?.className).not.toContain('p-');
  });

  it('applies hover effect when hover prop is true', () => {
    const { container } = render(Card, { props: { hover: true } });
    const card = container.querySelector('div');
    expect(card?.className).toContain('hover:shadow-lg');
  });

  it('is clickable when clickable prop is true', () => {
    const { container } = render(Card, { props: { clickable: true } });
    const card = container.querySelector('div');
    expect(card?.getAttribute('role')).toBe('button');
    expect(card?.getAttribute('tabindex')).toBe('0');
    expect(card?.className).toContain('cursor-pointer');
  });
});
