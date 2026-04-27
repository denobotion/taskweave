import { createQueue, isQueueEmpty, dequeue } from "./queue";

export interface DrainOptions {
  maxWaitMs?: number;
  intervalMs?: number;
  onItem?: <T>(item: T) => Promise<void> | void;
}

export interface DrainResult {
  drained: number;
  timedOut: boolean;
  elapsedMs: number;
}

export async function drainQueue<T>(
  queue: ReturnType<typeof createQueue<T>>,
  options: DrainOptions = {}
): Promise<DrainResult> {
  const { maxWaitMs = 5000, intervalMs = 50, onItem } = options;
  const start = Date.now();
  let drained = 0;
  let timedOut = false;

  while (!isQueueEmpty(queue)) {
    const elapsed = Date.now() - start;
    if (elapsed >= maxWaitMs) {
      timedOut = true;
      break;
    }

    const item = dequeue(queue);
    if (item !== undefined) {
      if (onItem) await onItem(item);
      drained++;
    } else {
      await sleep(intervalMs);
    }
  }

  return { drained, timedOut, elapsedMs: Date.now() - start };
}

export function formatDrainResult(result: DrainResult): string {
  const status = result.timedOut ? "timed-out" : "complete";
  return `drain(${status}): ${result.drained} items in ${result.elapsedMs}ms`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
