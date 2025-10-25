import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Modal from './Modal.svelte';

describe('Modal', () => {
  it('does not render when open is false', () => {
    render(Modal, { props: { open: false, title: 'Test Modal' } });
    const modal = screen.queryByRole('dialog');
    expect(modal).toBeFalsy();
  });

  it('renders when open is true', () => {
    render(Modal, { props: { open: true, title: 'Test Modal' } });
    const modal = screen.getByRole('dialog');
    expect(modal).toBeTruthy();
  });

  it('displays title', () => {
    render(Modal, { props: { open: true, title: 'My Modal Title' } });
    const title = screen.getByText('My Modal Title');
    expect(title).toBeTruthy();
    expect(title.id).toBe('modal-title');
  });

  it('has close button when title is provided', () => {
    render(Modal, { props: { open: true, title: 'Test Modal' } });
    const closeButton = screen.getByLabelText('Close modal');
    expect(closeButton).toBeTruthy();
  });

  it('has aria-modal attribute', () => {
    render(Modal, { props: { open: true, title: 'Test Modal' } });
    const modal = screen.getByRole('dialog');
    expect(modal.getAttribute('aria-modal')).toBe('true');
  });

  it('has aria-labelledby when title is provided', () => {
    render(Modal, { props: { open: true, title: 'Test Modal' } });
    const modal = screen.getByRole('dialog');
    expect(modal.getAttribute('aria-labelledby')).toBe('modal-title');
  });
});
