import { randomUUID } from 'crypto';

export type TraceEventKind = 'task:start' | 'task:end' | 'task:skip' | 'task:error' | 'pipeline:start' | 'pipeline:end';

export interface TraceEvent {
  id: string;
  traceId: string;
  kind: TraceEventKind;
  taskId?: string;
  timestamp: number;
  durationMs?: number;
  meta?: Record<string, unknown>;
}

export interface TraceStore {
  traceId: string;
  events: TraceEvent[];
}

export function createTraceStore(): TraceStore {
  return { traceId: randomUUID(), events: [] };
}

export function recordTrace(
  store: TraceStore,
  kind: TraceEventKind,
  taskId?: string,
  meta?: Record<string, unknown>
): TraceEvent {
  const event: TraceEvent = {
    id: randomUUID(),
    traceId: store.traceId,
    kind,
    taskId,
    timestamp: Date.now(),
    meta,
  };
  store.events.push(event);
  return event;
}

export function closeTrace(
  store: TraceStore,
  openEvent: TraceEvent,
  meta?: Record<string, unknown>
): TraceEvent {
  const endKind = openEvent.kind.replace(':start', ':end') as TraceEventKind;
  const now = Date.now();
  const event: TraceEvent = {
    id: randomUUID(),
    traceId: store.traceId,
    kind: endKind,
    taskId: openEvent.taskId,
    timestamp: now,
    durationMs: now - openEvent.timestamp,
    meta,
  };
  store.events.push(event);
  return event;
}

export function filterTraceEvents(
  store: TraceStore,
  kind: TraceEventKind
): TraceEvent[] {
  return store.events.filter((e) => e.kind === kind);
}

export function formatTraceLine(event: TraceEvent): string {
  const parts = [`[${event.kind}]`, `traceId=${event.traceId}`];
  if (event.taskId) parts.push(`task=${event.taskId}`);
  if (event.durationMs !== undefined) parts.push(`duration=${event.durationMs}ms`);
  return parts.join(' ');
}

/**
 * Returns a summary of the trace store, including total event counts grouped by kind.
 */
export function summarizeTrace(store: TraceStore): Record<string, number> {
  const summary: Record<string, number> = {};
  for (const event of store.events) {
    summary[event.kind] = (summary[event.kind] ?? 0) + 1;
  }
  return summary;
}
