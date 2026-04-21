import { AuditLog, AuditEvent } from './audit';
import { RunContext } from './context';

export interface ReplayOptions {
  from?: string;
  to?: string;
  taskFilter?: string[];
  dryRun?: boolean;
}

export interface ReplayResult {
  replayed: string[];
  skipped: string[];
  errors: Array<{ taskId: string; error: string }>;
}

export function filterReplayEvents(
  events: AuditEvent[],
  opts: ReplayOptions
): AuditEvent[] {
  let filtered = events.filter((e) => e.type === 'task:complete' || e.type === 'task:start');

  if (opts.from) {
    const fromTs = new Date(opts.from).getTime();
    filtered = filtered.filter((e) => new Date(e.timestamp).getTime() >= fromTs);
  }

  if (opts.to) {
    const toTs = new Date(opts.to).getTime();
    filtered = filtered.filter((e) => new Date(e.timestamp).getTime() <= toTs);
  }

  if (opts.taskFilter && opts.taskFilter.length > 0) {
    filtered = filtered.filter((e) => opts.taskFilter!.includes(e.taskId));
  }

  return filtered;
}

export function buildReplayPlan(
  events: AuditEvent[]
): string[] {
  const seen = new Set<string>();
  const order: string[] = [];

  for (const event of events) {
    if (event.type === 'task:start' && !seen.has(event.taskId)) {
      seen.add(event.taskId);
      order.push(event.taskId);
    }
  }

  return order;
}

export async function replayFromLog(
  log: AuditLog,
  ctx: RunContext,
  opts: ReplayOptions,
  executor: (taskId: string, ctx: RunContext) => Promise<void>
): Promise<ReplayResult> {
  const events = filterReplayEvents(log.events, opts);
  const plan = buildReplayPlan(events);
  const result: ReplayResult = { replayed: [], skipped: [], errors: [] };

  for (const taskId of plan) {
    if (opts.dryRun) {
      result.skipped.push(taskId);
      continue;
    }
    try {
      await executor(taskId, ctx);
      result.replayed.push(taskId);
    } catch (err) {
      result.errors.push({ taskId, error: String(err) });
    }
  }

  return result;
}
