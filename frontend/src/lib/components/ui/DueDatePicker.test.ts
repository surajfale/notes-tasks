import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import DueDatePicker from './DueDatePicker.svelte';

describe('DueDatePicker', () => {
  it('renders with label', () => {
    const { getByText } = render(DueDatePicker, {
      props: {
        label: 'Due Date',
        value: null
      }
    });

    expect(getByText('Due Date')).toBeTruthy();
  });

  it('displays formatted date when value is provided', () => {
    const testDate = new Date(2024, 0, 15); // Jan 15, 2024
    const { getByDisplayValue } = render(DueDatePicker, {
      props: {
        value: testDate
      }
    });

    // Check that the input has the formatted date value
    const input = getByDisplayValue('2024-01-15');
    expect(input).toBeTruthy();
  });

  it('shows clear button when value is set', () => {
    const testDate = new Date(2024, 0, 15);
    const { getByText } = render(DueDatePicker, {
      props: {
        value: testDate
      }
    });

    expect(getByText('Clear')).toBeTruthy();
  });

  it('does not show clear button when value is null', () => {
    const { queryByText } = render(DueDatePicker, {
      props: {
        value: null
      }
    });

    expect(queryByText('Clear')).toBeFalsy();
  });

  it('displays error message when provided', () => {
    const { getByText } = render(DueDatePicker, {
      props: {
        value: null,
        error: 'Date is required'
      }
    });

    expect(getByText('Date is required')).toBeTruthy();
  });

  it('opens calendar when calendar button is clicked', async () => {
    const { getByLabelText, getByText } = render(DueDatePicker, {
      props: {
        value: null
      }
    });

    const calendarButton = getByLabelText('Open calendar');
    await fireEvent.click(calendarButton);

    // Check that calendar is open by looking for "Today" button
    expect(getByText('Today')).toBeTruthy();
  });

  it('disables input and buttons when disabled prop is true', () => {
    const { getByLabelText } = render(DueDatePicker, {
      props: {
        value: null,
        disabled: true,
        label: 'Due Date'
      }
    });

    const input = getByLabelText('Due Date') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it('shows required indicator when required prop is true', () => {
    const { container } = render(DueDatePicker, {
      props: {
        label: 'Due Date',
        required: true,
        value: null
      }
    });

    const requiredIndicator = container.querySelector('.text-red-500');
    expect(requiredIndicator).toBeTruthy();
    expect(requiredIndicator?.textContent).toBe('*');
  });
});
