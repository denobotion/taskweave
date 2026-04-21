import { createQueue, enqueue, dequeue, canDequeue, isQueueEmpty, TaskQueue, QueuePriority } from './queue';
import { createLogger, log } from './logger';

export interface QueueRunner<T> {
  queue: TaskQueue<T>;
  process: (item: T) => Promise<void>;
}

export function buildQueueRunner<T>(
  process: (item: T) => Promise<void>,
  concurrency = 4
): QueueRunner<T> {
  return { queue: createQueue<T>(concurrency), process };
}

export async function drainQueue<T>(runner: QueueRunner<T>): Promise<void> {
  const logger = createLogger('queue');
  const active: Promise<void>[] = [];

  while (!isQueueEmpty({ ...runner.queue, running: active.length })) {
    while (canDequeue({ ...runner.queue, running: active.length })) {
      const [item, next] = dequeue(runner.queue);
      if (!item) break;
      runner.queue = next;

      log(logger, 'info', `Dequeuing item: ${item.id}`);
      const task = runner.process(item.payload).finally(() => {
        active.splice(active.indexOf(task), 1);
      });
      active.push(task);
    }

    if (active.length > 0) {
      await Promise.race(active);
    }
  }
}

export function scheduleTask<T>(
  runner: QueueRunner<T>,
  id: string,
  payload: T,
  priority: QueuePriority = 'normal'
): QueueRunner<T> {
  return { ...runner, queue: enqueue(runner.queue, id, payload, priority) };
}

export function formatQueueStatus<T>(queue: TaskQueue<T>): string {
  return `Queue: ${queue.items.length} pending, ${queue.running} running (limit: ${queue.concurrency})`;
}
