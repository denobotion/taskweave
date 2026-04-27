import { createQueue, enqueue } from "./queue";
import { drainQueue, formatDrainResult, DrainOptions } from "./drain";
import { createLogger, log } from "./logger";

export interface TaskDrainEntry {
  taskId: string;
  payload: unknown;
}

export function buildTaskDrainQueue() {
  return createQueue<TaskDrainEntry>();
}

export function scheduleForDrain(
  queue: ReturnType<typeof createQueue<TaskDrainEntry>>,
  taskId: string,
  payload: unknown
): void {
  enqueue(queue, { taskId, payload });
}

export async function runTaskDrain(
  queue: ReturnType<typeof createQueue<TaskDrainEntry>>,
  handler: (entry: TaskDrainEntry) => Promise<void>,
  options: DrainOptions = {}
): Promise<void> {
  const logger = createLogger("drain");

  const result = await drainQueue(queue, {
    ...options,
    onItem: async (item) => {
      const entry = item as TaskDrainEntry;
      log(logger, "info", `processing task ${entry.taskId}`);
      await handler(entry);
    },
  });

  log(logger, result.timedOut ? "warn" : "info", formatDrainResult(result));
}
