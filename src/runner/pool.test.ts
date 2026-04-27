import { describe, it, expect, vi } from 'vitest';
import { createPool, runPool, poolStats, drainPool } from './pool';

describe('createPool', () => {
  it('creates a pool with given concurrency', () => {
    const pool = createPool(3);
    expect(pool.size).toBe(3);
    expect(pool.active).toBe(0);
    expect(pool.queue).toHaveLength(0);
  });

  it('throws if concurrency < 1', () => {
    expect(() => createPool(0)).toThrow(RangeError);
    expect(() => createPool(-1)).toThrow(RangeError);
  });
});

describe('runPool', () => {
  it('runs all tasks and collects results', async () => {
    const pool = createPool<number>(2);
    const tasks = [1, 2, 3, 4].map(n => () => Promise.resolve(n * 10));
    const { results, errors } = await runPool(pool, tasks);
    expect(errors).toHaveLength(0);
    expect(results).toHaveLength(4);
    expect(results).toEqual(expect.arrayContaining([10, 20, 30, 40]));
  });

  it('collects errors without stopping other tasks', async () => {
    const pool = createPool<number>(2);
    const tasks = [
      () => Promise.resolve(1),
      () => Promise.reject(new Error('fail')),
      () => Promise.resolve(3),
    ];
    const { results, errors } = await runPool(pool, tasks);
    expect(errors).toHaveLength(1);
    expect(errors[0].index).toBe(1);
    expect(results).toEqual(expect.arrayContaining([1, 3]));
  });

  it('respects concurrency limit', async () => {
    let concurrent = 0;
    let maxConcurrent = 0;
    const pool = createPool<void>(2);
    const tasks = Array.from({ length: 6 }, () => async () => {
      concurrent++;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await new Promise(r => setTimeout(r, 10));
      concurrent--;
    });
    await runPool(pool, tasks);
    expect(maxConcurrent).toBeLessThanOrEqual(2);
  });
});

describe('poolStats', () => {
  it('returns a formatted stats string', () => {
    const pool = createPool(4);
    const stats = poolStats(pool);
    expect(stats).toContain('size=4');
    expect(stats).toContain('active=0');
    expect(stats).toContain('queued=0');
  });
});

describe('drainPool', () => {
  it('resets active count and queue', async () => {
    const pool = createPool<void>(2);
    await drainPool(pool);
    expect(pool.active).toBe(0);
    expect(pool.queue).toHaveLength(0);
  });
});
