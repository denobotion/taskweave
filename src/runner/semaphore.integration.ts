/**
 * Semaphore integration helpers — wire a semaphore into the task runner
 * to cap how many tasks execute concurrently at the process level.
 */

import { createSemaphore, formatSemaphoreLine, Semaphore, SemaphoreHandle } from "./semaphore";
import { log } from "./logger";

export interface TaskSemaphore {
  readonly semaphore: Semaphore & { acquire(id?: string): Promise<SemaphoreHandle> };
  wrap<T>(taskId: string, fn: () => Promise<T>): Promise<T>;
  status(): string;
}

/**
 * Build a task-level semaphore that logs acquisition and release.
 */
export function buildTaskSemaphore(
  concurrency: number,
  logger = log
): TaskSemaphore {
  const semaphore = createSemaphore(concurrency);

  async function wrap<T>(taskId: string, fn: () => Promise<T>): Promise<T> {
    logger("debug", `[semaphore] waiting to acquire slot for task=${taskId} ${formatSemaphoreLine(semaphore)}`);
    const handle = await semaphore.acquire(taskId);
    logger("debug", `[semaphore] acquired slot for task=${taskId} ${formatSemaphoreLine(semaphore)}`);
    try {
      return await fn();
    } finally {
      handle.release();
      logger("debug", `[semaphore] released slot for task=${taskId} ${formatSemaphoreLine(semaphore)}`);
    }
  }

  return {
    semaphore,
    wrap,
    status() {
      return formatSemaphoreLine(semaphore);
    },
  };
}

/**
 * Return a no-op semaphore wrapper when concurrency is unlimited.
 */
export function buildUnboundedSemaphore(): TaskSemaphore {
  const semaphore = createSemaphore(Number.MAX_SAFE_INTEGER);
  return {
    semaphore,
    wrap<T>(_id: string, fn: () => Promise<T>) {
      return fn();
    },
    status() {
      return "semaphore unbounded";
    },
  };
}
