/**
 * Window integration helpers — bridges the sliding-window primitive with
 * task execution so callers can track rolling throughput / error rates.
 */

import {
  createWindow,
  recordWindow,
  pruneWindow,
  windowStats,
  windowCount,
  type WindowStore,
} from "./window";

export interface TaskWindowOptions {
  /** How many milliseconds the window spans (default: 60 000 ms). */
  durationMs?: number;
  /** Maximum number of samples to keep in memory (default: 1 000). */
  maxSamples?: number;
}

export interface TaskWindowRegistry {
  /** Per-task window stores keyed by task id. */
  windows: Map<string, WindowStore>;
  /** Shared window options applied to every task window. */
  options: Required<TaskWindowOptions>;
}

/** Create a registry that manages one sliding window per task. */
export function buildTaskWindowRegistry(
  options: TaskWindowOptions = {}
): TaskWindowRegistry {
  return {
    windows: new Map(),
    options: {
      durationMs: options.durationMs ?? 60_000,
      maxSamples: options.maxSamples ?? 1_000,
    },
  };
}

/** Return (or lazily create) the window store for a given task. */
function getOrCreate(
  registry: TaskWindowRegistry,
  taskId: string
): WindowStore {
  if (!registry.windows.has(taskId)) {
    registry.windows.set(
      taskId,
      createWindow(registry.options.durationMs, registry.options.maxSamples)
    );
  }
  return registry.windows.get(taskId)!;
}

/** Record a numeric sample (e.g. duration in ms) for a task window. */
export function recordTaskSample(
  registry: TaskWindowRegistry,
  taskId: string,
  value: number,
  now = Date.now()
): void {
  const store = getOrCreate(registry, taskId);
  pruneWindow(store, now);
  recordWindow(store, value, now);
}

/** Get aggregated stats for a task's rolling window. */
export function getTaskWindowStats(
  registry: TaskWindowRegistry,
  taskId: string,
  now = Date.now()
) {
  if (!registry.windows.has(taskId)) {
    return { count: 0, sum: 0, min: 0, max: 0, mean: 0 };
  }
  const store = registry.windows.get(taskId)!;
  pruneWindow(store, now);
  return windowStats(store);
}

/** Return how many samples exist in a task's window right now. */
export function getTaskWindowCount(
  registry: TaskWindowRegistry,
  taskId: string,
  now = Date.now()
): number {
  if (!registry.windows.has(taskId)) return 0;
  const store = registry.windows.get(taskId)!;
  pruneWindow(store, now);
  return windowCount(store);
}

/** Format a one-line summary suitable for CLI output or log lines. */
export function formatWindowLine(
  taskId: string,
  registry: TaskWindowRegistry,
  now = Date.now()
): string {
  const stats = getTaskWindowStats(registry, taskId, now);
  if (stats.count === 0) {
    return `[window] ${taskId}: no samples`;
  }
  return (
    `[window] ${taskId}: ` +
    `count=${stats.count} ` +
    `mean=${stats.mean.toFixed(1)}ms ` +
    `min=${stats.min}ms ` +
    `max=${stats.max}ms`
  );
}

/** Remove a task's window from the registry (e.g. after task is deleted). */
export function dropTaskWindow(
  registry: TaskWindowRegistry,
  taskId: string
): boolean {
  return registry.windows.delete(taskId);
}
