import { describe, it, expect, vi } from 'vitest';
import {
  createRateLimiter,
  tryAcquire,
  msUntilNextSlot,
  pruneWindow,
  waitAndAcquire,
} from './rate';

describe('createRateLimiter', () => {
  it('creates a limiter with empty timestamps', () => {
    const limiter = createRateLimiter({ maxRequests: 5, windowMs: 1000 });
    expect(limiter.timestamps).toHaveLength(0);
    expect(limiter.options.maxRequests).toBe(5);
  });

  it('throws if maxRequests < 1', () => {
    expect(() => createRateLimiter({ maxRequests: 0, windowMs: 1000 })).toThrow(RangeError);
  });

  it('throws if windowMs < 1', () => {
    expect(() => createRateLimiter({ maxRequests: 1, windowMs: 0 })).toThrow(RangeError);
  });
});

describe('tryAcquire', () => {
  it('allows requests up to maxRequests', () => {
    const limiter = createRateLimiter({ maxRequests: 3, windowMs: 1000 });
    const now = Date.now();
    expect(tryAcquire(limiter, now)).toBe(true);
    expect(tryAcquire(limiter, now)).toBe(true);
    expect(tryAcquire(limiter, now)).toBe(true);
    expect(tryAcquire(limiter, now)).toBe(false);
  });

  it('allows new requests after window expires', () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 500 });
    const now = 1000;
    expect(tryAcquire(limiter, now)).toBe(true);
    expect(tryAcquire(limiter, now)).toBe(false);
    // Advance past the window
    expect(tryAcquire(limiter, now + 600)).toBe(true);
  });
});

describe('pruneWindow', () => {
  it('removes timestamps outside the window', () => {
    const limiter = createRateLimiter({ maxRequests: 10, windowMs: 1000 });
    limiter.timestamps = [100, 200, 1500, 1800];
    pruneWindow(limiter, 2000);
    expect(limiter.timestamps).toEqual([1500, 1800]);
  });
});

describe('msUntilNextSlot', () => {
  it('returns 0 when slots are available', () => {
    const limiter = createRateLimiter({ maxRequests: 3, windowMs: 1000 });
    expect(msUntilNextSlot(limiter, 1000)).toBe(0);
  });

  it('returns ms until oldest timestamp expires', () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 1000 });
    limiter.timestamps = [1000];
    const wait = msUntilNextSlot(limiter, 1200);
    expect(wait).toBe(800);
  });
});

describe('waitAndAcquire', () => {
  it('acquires immediately when slot is available', async () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 1000 });
    const delayFn = vi.fn().mockResolvedValue(undefined);
    await waitAndAcquire(limiter, delayFn);
    expect(delayFn).not.toHaveBeenCalled();
    expect(limiter.timestamps).toHaveLength(1);
  });

  it('waits when no slot is available', async () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 500 });
    const now = Date.now();
    limiter.timestamps = [now]; // fill the slot
    let callCount = 0;
    const delayFn = vi.fn().mockImplementation(async () => {
      callCount++;
      // After first delay, expire the window by backdating
      limiter.timestamps = [now - 600];
    });
    await waitAndAcquire(limiter, delayFn);
    expect(callCount).toBeGreaterThanOrEqual(1);
  });
});
