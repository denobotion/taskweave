import { createSemaphore, makeHandle, drain } from './semaphore';

export interface WorkerPool<T> {
  size: number;
  active: number;
  queue: Array<() => Promise<T>>;
  semaphore: ReturnType<typeof createSemaphore>;
}

export interface PoolResult<T> {
  results: T[];
  errors: Array<{ index: number; error: unknown }>;
}

export function createPool<T>(concurrency: number): WorkerPool<T> {
  if (concurrency < 1) throw new RangeError('Pool concurrency must be >= 1');
  return {
    size: concurrency,
    active: 0,
    queue: [],
    semaphore: createSemaphore(concurrency),
  };
}

export async function runPool<T>(
  pool: WorkerPool<T>,
  tasks: Array<() => Promise<T>>,
): Promise<PoolResult<T>> {
  const results: T[] = new Array(tasks.length);
  const errors: Array<{ index: number; error: unknown }> = [];

  const workers = tasks.map((task, index) =>
    (async () => {
      const handle = makeHandle(pool.semaphore);
      await handle.acquire();
      pool.active++;
      try {
        results[index] = await task();
      } catch (error) {
        errors.push({ index, error });
      } finally {
        pool.active--;
        handle.release();
      }
    })()
  );

  await Promise.all(workers);
  return { results: results.filter((_, i) => !errors.some(e => e.index === i)), errors };
}

export function poolStats<T>(pool: WorkerPool<T>): string {
  return `pool(size=${pool.size} active=${pool.active} queued=${pool.queue.length})`;
}

export async function drainPool<T>(pool: WorkerPool<T>): Promise<void> {
  await drain(pool.semaphore);
  pool.active = 0;
  pool.queue.length = 0;
}
