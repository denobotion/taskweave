import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createConcurrencyStore,
  enterConcurrency,
  exitConcurrency,
  getConcurrencyStats,
} from './concurrency';

vi.mock('./throttle', () => ({
  createThrottle: (max: number) => ({ active: 0, max, queue: [] }),
  acquire: vi.fn(async (t: any, id: string) => { t.active++; }),
  release: vi.fn((t: any, id: string) => { t.active = Math.max(0, t.active - 1); }),
}));

vi.mock('./rate', () => ({
  createRateLimiter: (count: number, windowMs: number) => ({ count, windowMs, window: [] }),
  tryAcquire: vi.fn(() => true),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createConcurrencyStore', () => {
  it('creates store without rate limiter', () => {
    const store = createConcurrencyStore({ maxParallel: 3 });
    expect(store.options.maxParallel).toBe(3);
    expect(store.rateLimiter).toBeUndefined();
  });

  it('creates store with rate limiter when specified', () => {
    const store = createConcurrencyStore({
      maxParallel: 2,
      rateLimit: { count: 10, windowMs: 1000 },
    });
    expect(store.rateLimiter).toBeDefined();
  });
});

describe('enterConcurrency', () => {
  it('acquires throttle slot and returns handle', async () => {
    const store = createConcurrencyStore({ maxParallel: 2 });
    const handle = await enterConcurrency(store, 'task-a');
    expect(handle.throttleId).toBe('task-a');
    expect(handle.rateLimiterId).toBeUndefined();
  });

  it('throws and releases throttle when rate limit exceeded', async () => {
    const { tryAcquire } = await import('./rate');
    const { release } = await import('./throttle');
    vi.mocked(tryAcquire).mockReturnValueOnce(false);

    const store = createConcurrencyStore({
      maxParallel: 2,
      rateLimit: { count: 5, windowMs: 1000 },
    });
    await expect(enterConcurrency(store, 'task-b')).rejects.toThrow('Rate limit exceeded');
    expect(release).toHaveBeenCalledWith(store.throttle, 'task-b');
  });
});

describe('exitConcurrency', () => {
  it('releases throttle slot', async () => {
    const { release } = await import('./throttle');
    const store = createConcurrencyStore({ maxParallel: 2 });
    const handle = await enterConcurrency(store, 'task-c');
    exitConcurrency(store, handle);
    expect(release).toHaveBeenCalledWith(store.throttle, 'task-c');
  });
});

describe('getConcurrencyStats', () => {
  it('returns correct stats', () => {
    const store = createConcurrencyStore({ maxParallel: 4 });
    const stats = getConcurrencyStats(store);
    expect(stats.max).toBe(4);
    expect(stats.hasRateLimit).toBe(false);
    expect(typeof stats.active).toBe('number');
  });

  it('reports hasRateLimit true when configured', () => {
    const store = createConcurrencyStore({
      maxParallel: 2,
      rateLimit: { count: 5, windowMs: 500 },
    });
    expect(getConcurrencyStats(store).hasRateLimit).toBe(true);
  });
});
