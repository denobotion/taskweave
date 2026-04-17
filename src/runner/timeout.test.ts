import { describe, it, expect, vi } from 'vitest';
import { withTimeout, TimeoutError, isTimeoutError, parseTimeout } from './timeout';

describe('withTimeout', () => {
  it('resolves when promise completes before timeout', async () => {
    const result = await withTimeout(Promise.resolve(42), 1000);
    expect(result).toBe(42);
  });

  it('rejects with TimeoutError when timeout is exceeded', async () => {
    vi.useFakeTimers();
    const hanging = new Promise<never>(() => {});
    const p = withTimeout(hanging, 500);
    vi.advanceTimersByTime(600);
    await expect(p).rejects.toBeInstanceOf(TimeoutError);
    vi.useRealTimers();
  });

  it('skips timeout when ms is 0', async () => {
    const result = await withTimeout(Promise.resolve('ok'), 0);
    expect(result).toBe('ok');
  });

  it('propagates original rejection', async () => {
    await expect(
      withTimeout(Promise.reject(new Error('fail')), 1000)
    ).rejects.toThrow('fail');
  });
});

describe('isTimeoutError', () => {
  it('returns true for TimeoutError', () => {
    expect(isTimeoutError(new TimeoutError(100))).toBe(true);
  });

  it('returns false for other errors', () => {
    expect(isTimeoutError(new Error('other'))).toBe(false);
  });
});

describe('parseTimeout', () => {
  it('returns 0 for undefined', () => {
    expect(parseTimeout(undefined)).toBe(0);
  });

  it('returns number as-is', () => {
    expect(parseTimeout(2500)).toBe(2500);
  });

  it('parses milliseconds', () => {
    expect(parseTimeout('500ms')).toBe(500);
  });

  it('parses seconds', () => {
    expect(parseTimeout('30s')).toBe(30_000);
  });

  it('parses minutes', () => {
    expect(parseTimeout('2m')).toBe(120_000);
  });

  it('parses hours', () => {
    expect(parseTimeout('1h')).toBe(3_600_000);
  });

  it('throws on invalid format', () => {
    expect(() => parseTimeout('abc')).toThrow('Invalid timeout format');
  });
});
