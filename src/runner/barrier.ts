/**
 * barrier.ts — synchronization primitive that blocks progress until
 * a required number of tasks have reached the barrier point.
 */

export interface BarrierStore {
  readonly count: number;
  readonly arrived: Set<string>;
  readonly waiters: Array<() => void>;
}

export function createBarrier(count: number): BarrierStore {
  if (count < 1) throw new RangeError(`Barrier count must be >= 1, got ${count}`);
  return { count, arrived: new Set(), waiters: [] };
}

export function arriveAtBarrier(store: BarrierStore, taskId: string): boolean {
  if (store.arrived.has(taskId)) return false;
  store.arrived.add(taskId);
  return true;
}

export function isBarrierReached(store: BarrierStore): boolean {
  return store.arrived.size >= store.count;
}

export function waitForBarrier(store: BarrierStore): Promise<void> {
  if (isBarrierReached(store)) return Promise.resolve();
  return new Promise<void>((resolve) => {
    store.waiters.push(resolve);
  });
}

export function releaseBarrier(store: BarrierStore): number {
  if (!isBarrierReached(store)) return 0;
  const count = store.waiters.length;
  while (store.waiters.length > 0) {
    const resolve = store.waiters.shift();
    if (resolve) resolve();
  }
  return count;
}

export function resetBarrier(store: BarrierStore): void {
  store.arrived.clear();
  // Pending waiters are intentionally left — they will remain unresolved
  // until the barrier is reached again.
}

export function formatBarrierLine(store: BarrierStore): string {
  return `barrier: ${store.arrived.size}/${store.count} arrived, ${store.waiters.length} waiting`;
}
