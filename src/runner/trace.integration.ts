import { createTraceStore, recordTrace, closeTrace, filterTraceEvents, formatTraceLine, TraceStore, TraceEvent } from './trace';

export interface TaskTraceOptions {
  taskId: string;
  command: string;
  startedAt?: number;
}

export function buildTraceStore(dir: string): TraceStore {
  return createTraceStore(dir);
}

export function startTrace(
  store: TraceStore,
  options: TaskTraceOptions
): string {
  const traceId = `${options.taskId}-${Date.now()}`;
  recordTrace(store, {
    id: traceId,
    taskId: options.taskId,
    command: options.command,
    startedAt: options.startedAt ?? Date.now(),
    status: 'running',
  });
  return traceId;
}

export function finishTrace(
  store: TraceStore,
  traceId: string,
  status: 'success' | 'failure' | 'skipped',
  exitCode?: number
): void {
  closeTrace(store, traceId, { status, exitCode, finishedAt: Date.now() });
}

export function getTaskTraces(
  store: TraceStore,
  taskId: string
): TraceEvent[] {
  return filterTraceEvents(store, (e) => e.taskId === taskId);
}

/**
 * Returns a summary of trace counts grouped by status for a given task,
 * or across all tasks if no taskId is provided.
 */
export function getTraceSummaryStats(
  store: TraceStore,
  taskId?: string
): Record<string, number> {
  const events = taskId
    ? filterTraceEvents(store, (e) => e.taskId === taskId)
    : filterTraceEvents(store, () => true);

  return events.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {});
}

export function printTraceSummary(
  store: TraceStore,
  taskId?: string
): void {
  const events = taskId
    ? filterTraceEvents(store, (e) => e.taskId === taskId)
    : filterTraceEvents(store, () => true);

  if (events.length === 0) {
    console.log('No trace events found.');
    return;
  }

  events.forEach((e) => console.log(formatTraceLine(e)));
  console.log(`\nTotal: ${events.length} trace event(s)`);
}
