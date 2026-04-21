/**
 * rate.ts — Rate limiter for controlling task execution frequency.
 * Supports a sliding window approach to cap how many tasks run per interval.
 */

export interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimiter {
  options: RateLimiterOptions;
  timestamps: number[];
}

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  if (options.maxRequests < 1) {
    throw new RangeError('maxRequests must be at least 1');
  }
  if (options.windowMs < 1) {
    throw new RangeError('windowMs must be at least 1');
  }
  return { options, timestamps: [] };
}

/**
 * Prune timestamps outside the current sliding window.
 */
export function pruneWindow(limiter: RateLimiter, now: number): void {
  const cutoff = now - limiter.options.windowMs;
  limiter.timestamps = limiter.timestamps.filter((t) => t > cutoff);
}

/**
 * Returns true if a new request is allowed under the rate limit.
 * Mutates limiter state by recording the timestamp when allowed.
 */
export function tryAcquire(limiter: RateLimiter, now: number = Date.now()): boolean {
  pruneWindow(limiter, now);
  if (limiter.timestamps.length < limiter.options.maxRequests) {
    limiter.timestamps.push(now);
    return true;
  }
  return false;
}

/**
 * Returns the number of milliseconds until the next slot is available.
 * Returns 0 if a slot is already available.
 */
export function msUntilNextSlot(limiter: RateLimiter, now: number = Date.now()): number {
  pruneWindow(limiter, now);
  if (limiter.timestamps.length < limiter.options.maxRequests) {
    return 0;
  }
  const oldest = limiter.timestamps[0];
  return Math.max(0, oldest + limiter.options.windowMs - now);
}

/**
 * Waits until a slot is available, then acquires it.
 */
export async function waitAndAcquire(
  limiter: RateLimiter,
  delay: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms))
): Promise<void> {
  while (true) {
    const now = Date.now();
    if (tryAcquire(limiter, now)) return;
    const wait = msUntilNextSlot(limiter, now);
    await delay(wait > 0 ? wait : 10);
  }
}
