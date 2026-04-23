import { createThrottle, acquire, release } from './throttle';
import { createRateLimiter, tryAcquire } from './rate';

export interface ConcurrencyOptions {
  maxParallel: number;
  rateLimit?: { count: number; windowMs: number };
}

export interface ConcurrencyHandle {
  throttleId: string;
  rateLimiterId?: string;
}

export interface ConcurrencyStore {
  throttle: ReturnType<typeof createThrottle>;
  rateLimiter?: ReturnType<typeof createRateLimiter>;
  options: ConcurrencyOptions;
}

export function createConcurrencyStore(options: ConcurrencyOptions): ConcurrencyStore {
  const throttle = createThrottle(options.maxParallel);
  const rateLimiter = options.rateLimit
    ? createRateLimiter(options.rateLimit.count, options.rateLimit.windowMs)
    : undefined;
  return { throttle, rateLimiter, options };
}

export async function enterConcurrency(
  store: ConcurrencyStore,
  taskId: string
): Promise<ConcurrencyHandle> {
  await acquire(store.throttle, taskId);

  if (store.rateLimiter) {
    const allowed = tryAcquire(store.rateLimiter);
    if (!allowed) {
      release(store.throttle, taskId);
      throw new Error(
        `Rate limit exceeded for task "${taskId}": max ${
          store.options.rateLimit!.count
        } per ${store.options.rateLimit!.windowMs}ms`
      );
    }
  }

  return { throttleId: taskId, rateLimiterId: store.rateLimiter ? taskId : undefined };
}

export function exitConcurrency(store: ConcurrencyStore, handle: ConcurrencyHandle): void {
  release(store.throttle, handle.throttleId);
}

export function getConcurrencyStats(store: ConcurrencyStore): {
  active: number;
  max: number;
  hasRateLimit: boolean;
} {
  return {
    active: store.throttle.active,
    max: store.options.maxParallel,
    hasRateLimit: store.rateLimiter !== undefined,
  };
}
