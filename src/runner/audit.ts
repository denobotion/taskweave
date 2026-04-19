import { createHash } from "crypto";

export type AuditEventType = "task:start" | "task:success" | "task:failure" | "task:skip" | "task:cached";

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  taskName: string;
  timestamp: number;
  durationMs?: number;
  exitCode?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLog {
  runId: string;
  startedAt: number;
  events: AuditEvent[];
}

export function createAuditLog(): AuditLog {
  return {
    runId: createHash("sha1").update(String(Date.now() + Math.random())).digest("hex").slice(0, 12),
    startedAt: Date.now(),
    events: [],
  };
}

export function recordEvent(
  log: AuditLog,
  type: AuditEventType,
  taskName: string,
  extras: Partial<Omit<AuditEvent, "id" | "type" | "taskName" | "timestamp">> = {}
): AuditEvent {
  const event: AuditEvent = {
    id: createHash("sha1").update(`${taskName}-${Date.now()}-${Math.random()}`).digest("hex").slice(0, 8),
    type,
    taskName,
    timestamp: Date.now(),
    ...extras,
  };
  log.events.push(event);
  return event;
}

export function filterEvents(log: AuditLog, type: AuditEventType): AuditEvent[] {
  return log.events.filter((e) => e.type === type);
}

export function summarizeAuditLog(log: AuditLog): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const event of log.events) {
    counts[event.type] = (counts[event.type] ?? 0) + 1;
  }
  return counts;
}
