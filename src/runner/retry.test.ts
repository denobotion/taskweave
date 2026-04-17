import { describe, it, expect, vi } from 'vitest';
import { withRetry, computeDelay } from './retry';

describe('computeDelay', () => {
  it('returns base delay with no backoff', () => {
    expect(computeDelay(1, { maxAttempts: 3, delayMs: 100 })).toBe(100);
    expect(computeDelay(2, { maxAttempts: 3, delayMs: 100 })).toBe(100);
  });

  it('returns linear delay', () => {
    expect(computeDelay(1, { maxAttempts: 3, delayMs: 100, backoff: 'linear' })).toBe(100);
    expect(computeDelay(2, { maxAttempts: 3, delayMs: 100, backoff: 'linear' })).toBe(200);
    expect(computeDelay(3, { maxAttempts: 3, delayMs: 100, backoff: 'linear' })).toBe(300);
  });

  it('returns exponential delay', () => {
    expect(computeDelay(1, { maxAttempts: 3, delayMs: 100, backoff: 'exponential' })).toBe(100);
    expect(computeDelay(2, { maxAttempts: 3, delayMs: 100, backoff: 'exponential' })).toBe(200);
    expect(computeDelay(3, { maxAttempts: 3, delayMs: 100, backoff: 'exponential' })).toBe(400);
  });

  it('returns 0 when no delayMs', () => {
    expect(computeDelay(1, { maxAttempts: 3 })).toBe(0);
  });
});

describe('withRetry', () => {
  it('succeeds on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, { maxAttempts: 3 });
    expect(result.success).toBe(true);
    expect(result.value).toBe('ok');
    expect(result.attempts).toBe(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('recovered');
    const result = await withRetry(fn, { maxAttempts: 3 });
    expect(result.success).toBe(true);
    expect(result.value).toBe('recovered');
    expect(result.attempts).toBe(2);
  });

  it('returns failure after max attempts', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fails'));
    const result = await withRetry(fn, { maxAttempts: 3 });
    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('always fails');
    expect(result.attempts).toBe(3);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('wraps non-Error throws', async () => {
    const fn = vi.fn().mockRejectedValue('string error');
    const result = await withRetry(fn, { maxAttempts: 1 });
    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
  });
});
