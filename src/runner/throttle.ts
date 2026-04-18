/**
 * Concurrency throttle — limits how many tasks run in parallel.
 */

export interface ThrottleOptions {
  concurrency: number;
}

export interface Throttle {
  acquire(): Promise<void>;
  release(): void;
  get active(): number;
  get pending(): number;
}

export function createThrottle(options: ThrottleOptions): Throttle {
  const { concurrency } = options;
  if (concurrency < 1) throw new Error('concurrency must be >= 1');

  let active = 0;
  const queue: Array<() => void> = [];

  function acquire(): Promise<void> {
    if (active < concurrency) {
      active++;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      queue.push(() => {
        active++;
        resolve();
      });
    });
  }

  function release(): void {
    active--;
    const next = queue.shift();
    if (next) next();
  }

  return {
    acquire,
    release,
    get active() { return active; },
    get pending() { return queue.length; },
  };
}

export async function withThrottle<T>(
  throttle: Throttle,
  fn: () => Promise<T>
): Promise<T> {
  await throttle.acquire();
  try {
    return await fn();
  } finally {
    throttle.release();
  }
}
