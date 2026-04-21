import { createThrottle, acquire, release } from './throttle';

export type QueuePriority = 'high' | 'normal' | 'low';

export interface QueueItem<T> {
  id: string;
  payload: T;
  priority: QueuePriority;
  enqueuedAt: number;
}

export interface TaskQueue<T> {
  items: QueueItem<T>[];
  concurrency: number;
  running: number;
}

const PRIORITY_WEIGHT: Record<QueuePriority, number> = {
  high: 0,
  normal: 1,
  low: 2,
};

export function createQueue<T>(concurrency = 4): TaskQueue<T> {
  return { items: [], concurrency, running: 0 };
}

export function enqueue<T>(
  queue: TaskQueue<T>,
  id: string,
  payload: T,
  priority: QueuePriority = 'normal'
): TaskQueue<T> {
  const item: QueueItem<T> = { id, payload, priority, enqueuedAt: Date.now() };
  const items = [...queue.items, item].sort(
    (a, b) =>
      PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority] ||
      a.enqueuedAt - b.enqueuedAt
  );
  return { ...queue, items };
}

export function dequeue<T>(queue: TaskQueue<T>): [QueueItem<T> | undefined, TaskQueue<T>] {
  if (queue.items.length === 0) return [undefined, queue];
  const [head, ...rest] = queue.items;
  return [head, { ...queue, items: rest }];
}

export function isQueueEmpty<T>(queue: TaskQueue<T>): boolean {
  return queue.items.length === 0 && queue.running === 0;
}

export function canDequeue<T>(queue: TaskQueue<T>): boolean {
  return queue.items.length > 0 && queue.running < queue.concurrency;
}

export function peekQueue<T>(queue: TaskQueue<T>): QueueItem<T> | undefined {
  return queue.items[0];
}

export function removeFromQueue<T>(queue: TaskQueue<T>, id: string): TaskQueue<T> {
  return { ...queue, items: queue.items.filter((i) => i.id !== id) };
}
