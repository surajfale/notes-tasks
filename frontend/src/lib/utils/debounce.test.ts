import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce, createDebounce } from './debounce';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should delay function execution', () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 300);

    debouncedFunc();
    expect(func).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(func).toHaveBeenCalledTimes(1);
  });

  it('should only execute once for multiple rapid calls', () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 300);

    debouncedFunc();
    debouncedFunc();
    debouncedFunc();

    vi.advanceTimersByTime(300);
    expect(func).toHaveBeenCalledTimes(1);
  });

  it('should reset timer on each call', () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 300);

    debouncedFunc();
    vi.advanceTimersByTime(200);
    
    debouncedFunc();
    vi.advanceTimersByTime(200);
    
    expect(func).not.toHaveBeenCalled();
    
    vi.advanceTimersByTime(100);
    expect(func).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments to the debounced function', () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 300);

    debouncedFunc('arg1', 'arg2');
    vi.advanceTimersByTime(300);

    expect(func).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('should use default wait time of 300ms', () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func);

    debouncedFunc();
    vi.advanceTimersByTime(299);
    expect(func).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(func).toHaveBeenCalledTimes(1);
  });

  it('should handle custom wait times', () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 500);

    debouncedFunc();
    vi.advanceTimersByTime(499);
    expect(func).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(func).toHaveBeenCalledTimes(1);
  });
});

describe('createDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return debounced function and cancel function', () => {
    const func = vi.fn();
    const { debounced, cancel } = createDebounce(func, 300);

    expect(typeof debounced).toBe('function');
    expect(typeof cancel).toBe('function');
  });

  it('should debounce function execution', () => {
    const func = vi.fn();
    const { debounced } = createDebounce(func, 300);

    debounced();
    expect(func).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(func).toHaveBeenCalledTimes(1);
  });

  it('should cancel pending execution', () => {
    const func = vi.fn();
    const { debounced, cancel } = createDebounce(func, 300);

    debounced();
    vi.advanceTimersByTime(200);
    
    cancel();
    vi.advanceTimersByTime(200);

    expect(func).not.toHaveBeenCalled();
  });

  it('should allow execution after cancel', () => {
    const func = vi.fn();
    const { debounced, cancel } = createDebounce(func, 300);

    debounced();
    cancel();
    
    debounced();
    vi.advanceTimersByTime(300);

    expect(func).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple cancels safely', () => {
    const func = vi.fn();
    const { debounced, cancel } = createDebounce(func, 300);

    debounced();
    cancel();
    cancel();
    cancel();

    vi.advanceTimersByTime(300);
    expect(func).not.toHaveBeenCalled();
  });

  it('should pass arguments correctly', () => {
    const func = vi.fn();
    const { debounced } = createDebounce(func, 300);

    debounced('test', 123);
    vi.advanceTimersByTime(300);

    expect(func).toHaveBeenCalledWith('test', 123);
  });
});
