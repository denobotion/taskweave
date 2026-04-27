/**
 * Priority queue for task scheduling.
 * Tasks with higher priority values are dequeued first.
 */

export interface PriorityEntry<T> {
  item: T;
  priority: number;
  insertedAt: number;
}

export interface PriorityQueue<T> {
  entries: PriorityEntry<T>[];
  size: number;
}

export function createPriorityQueue<T>(): PriorityQueue<T> {
  return { entries: [], size: 0 };
}

export function priorityEnqueue<T>(
  queue: PriorityQueue<T>,
  item: T,
  priority: number
): PriorityQueue<T> {
  const entry: PriorityEntry<T> = { item, priority, insertedAt: Date.now() };
  const entries = [...queue.entries, entry].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.insertedAt - b.insertedAt; // FIFO for equal priorities
  });
  return { entries, size: entries.length };
}

export function priorityDequeue<T>(
  queue: PriorityQueue<T>
): { queue: PriorityQueue<T>; item: T | undefined } {
  if (queue.entries.length === 0) {
    return { queue, item: undefined };
  }
  const [head, ...rest] = queue.entries;
  return {
    queue: { entries: rest, size: rest.length },
    item: head.item,
  };
}

export function peekPriority<T>(queue: PriorityQueue<T>): T | undefined {
  return queue.entries[0]?.item;
}

export function isPriorityQueueEmpty<T>(queue: PriorityQueue<T>): boolean {
  return queue.size === 0;
}

export function formatPriorityLine<T>(entry: PriorityEntry<T>, label: string): string {
  return `[priority=${entry.priority}] ${label} (queued at ${entry.insertedAt})`;
}
