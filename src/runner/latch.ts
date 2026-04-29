/**
 * A countdown latch that blocks until a count reaches zero.
 * Useful for waiting on N concurrent tasks to complete before proceeding.
 */

export interface LatchStore {
  readonly id: string;
  count: number;
  readonly initial: number;
  readonly waiters: Array<() => void>;
}

export function createLatch(id: string, count: number): LatchStore {
  if (count < 0) throw new RangeError(`Latch count must be >= 0, got ${count}`);
  return { id, count, initial: count, waiters: [] };
}

export function countDown(latch: LatchStore): void {
  if (latch.count <= 0) return;
  latch.count -= 1;
  if (latch.count === 0) {
    releaseAll(latch);
  }
}

export function releaseAll(latch: LatchStore): void {
  while (latch.waiters.length > 0) {
    const resolve = latch.waiters.shift();
    resolve?.();
  }
}

export function resetLatch(latch: LatchStore): void {
  latch.count = latch.initial;
}

export function isLatched(latch: LatchStore): boolean {
  return latch.count > 0;
}

export function awaitLatch(
  latch: LatchStore,
  timeoutMs?: number
): Promise<void> {
  if (latch.count === 0) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    let settled = false;

    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    latch.waiters.push(done);

    if (timeoutMs !== undefined) {
      setTimeout(() => {
        if (settled) return;
        settled = true;
        const idx = latch.waiters.indexOf(done);
        if (idx !== -1) latch.waiters.splice(idx, 1);
        reject(new Error(`Latch "${latch.id}" timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    }
  });
}

export function formatLatchLine(latch: LatchStore): string {
  return `[latch:${latch.id}] count=${latch.count}/${latch.initial} waiters=${latch.waiters.length}`;
}
