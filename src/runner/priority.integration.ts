/**
 * Integration helpers for priority-aware task scheduling.
 * Bridges the PriorityQueue with the task runner pipeline.
 */

import { createPriorityQueue, priorityEnqueue, priorityDequeue, PriorityQueue } from "./priority";

export interface PriorityTask {
  id: string;
  priority?: number;
}

const DEFAULT_PRIORITY = 0;

export function buildPrioritySchedule(tasks: PriorityTask[]): PriorityQueue<string> {
  let queue = createPriorityQueue<string>();
  for (const task of tasks) {
    queue = priorityEnqueue(queue, task.id, task.priority ?? DEFAULT_PRIORITY);
  }
  return queue;
}

export function drainPriorityQueue(queue: PriorityQueue<string>): string[] {
  const order: string[] = [];
  let current = queue;
  while (current.size > 0) {
    const { queue: next, item } = priorityDequeue(current);
    if (item !== undefined) order.push(item);
    current = next;
  }
  return order;
}

export function formatPrioritySchedule(queue: PriorityQueue<string>): string[] {
  return queue.entries.map(
    (e, i) => `${i + 1}. task=${e.item} priority=${e.priority}`
  );
}

export function reorderWithPriority(
  taskIds: string[],
  priorityMap: Record<string, number>
): string[] {
  let queue = createPriorityQueue<string>();
  for (const id of taskIds) {
    queue = priorityEnqueue(queue, id, priorityMap[id] ?? DEFAULT_PRIORITY);
  }
  return drainPriorityQueue(queue);
}
