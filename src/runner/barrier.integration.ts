/**
 * barrier.integration.ts
 *
 * Higher-level helpers that wire the barrier primitive into the task runner.
 * A "task barrier" lets a group of parallel tasks rendezvous before any of
 * them continues — useful for fan-out / fan-in patterns.
 */

import {
  createBarrier,
  arriveAtBarrier,
  isBarrierReached,
  waitForBarrier,
  releaseBarrier,
  Barrier,
} from "./barrier";

/** Registry that maps a barrier name to its instance. */
export interface BarrierRegistry {
  barriers: Map<string, Barrier>;
}

/** Create an empty registry for named barriers. */
export function createBarrierRegistry(): BarrierRegistry {
  return { barriers: new Map() };
}

/**
 * Get-or-create a named barrier that expects `count` participants.
 * If the barrier already exists its current instance is returned unchanged
 * (the count is fixed at creation time).
 */
export function getOrCreateBarrier(
  registry: BarrierRegistry,
  name: string,
  count: number
): Barrier {
  if (!registry.barriers.has(name)) {
    registry.barriers.set(name, createBarrier(count));
  }
  return registry.barriers.get(name)!;
}

/**
 * Called by a task when it reaches a synchronisation point.
 * Returns `true` if this arrival completed the barrier (all participants have
 * arrived), `false` otherwise.
 */
export function taskArrive(
  registry: BarrierRegistry,
  name: string
): boolean {
  const barrier = registry.barriers.get(name);
  if (!barrier) {
    throw new Error(`Barrier "${name}" does not exist in registry`);
  }
  arriveAtBarrier(barrier);
  return isBarrierReached(barrier);
}

/**
 * Block (async) until the named barrier is fully reached, then release it.
 * Intended to be awaited by the coordinating runner after all fan-out tasks
 * have been dispatched.
 */
export async function awaitAndRelease(
  registry: BarrierRegistry,
  name: string,
  timeoutMs = 30_000
): Promise<void> {
  const barrier = registry.barriers.get(name);
  if (!barrier) {
    throw new Error(`Barrier "${name}" does not exist in registry`);
  }

  const deadline = Date.now() + timeoutMs;

  await waitForBarrier(barrier, timeoutMs);

  if (Date.now() > deadline) {
    throw new Error(
      `Barrier "${name}" timed out after ${timeoutMs} ms`
    );
  }

  releaseBarrier(barrier);
}

/**
 * Remove a named barrier from the registry once it is no longer needed.
 */
export function dropBarrier(
  registry: BarrierRegistry,
  name: string
): void {
  registry.barriers.delete(name);
}

/**
 * Return a human-readable summary line for a named barrier, e.g.
 *   `barrier:build  arrived=2/3  reached=false`
 */
export function formatBarrierLine(
  registry: BarrierRegistry,
  name: string
): string {
  const barrier = registry.barriers.get(name);
  if (!barrier) return `barrier:${name}  <not found>`;
  const reached = isBarrierReached(barrier);
  return (
    `barrier:${name}  ` +
    `arrived=${barrier.arrived}/${barrier.count}  ` +
    `reached=${reached}`
  );
}
