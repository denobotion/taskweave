import { createLogger } from './logger';

export type HeartbeatStatus = 'alive' | 'stalled' | 'dead';

export interface HeartbeatEntry {
  taskId: string;
  lastBeat: number;
  intervalMs: number;
  status: HeartbeatStatus;
  missedBeats: number;
}

export interface HeartbeatStore {
  entries: Map<string, HeartbeatEntry>;
  stalledThreshold: number;
  deadThreshold: number;
}

export function createHeartbeatStore(
  stalledThreshold = 2,
  deadThreshold = 5
): HeartbeatStore {
  return {
    entries: new Map(),
    stalledThreshold,
    deadThreshold,
  };
}

export function registerHeartbeat(
  store: HeartbeatStore,
  taskId: string,
  intervalMs: number
): void {
  store.entries.set(taskId, {
    taskId,
    lastBeat: Date.now(),
    intervalMs,
    status: 'alive',
    missedBeats: 0,
  });
}

export function recordBeat(store: HeartbeatStore, taskId: string): boolean {
  const entry = store.entries.get(taskId);
  if (!entry) return false;
  entry.lastBeat = Date.now();
  entry.missedBeats = 0;
  entry.status = 'alive';
  return true;
}

export function evaluateHeartbeats(store: HeartbeatStore): HeartbeatEntry[] {
  const now = Date.now();
  const stalled: HeartbeatEntry[] = [];

  for (const entry of store.entries.values()) {
    if (entry.status === 'dead') continue;
    const elapsed = now - entry.lastBeat;
    const missed = Math.floor(elapsed / entry.intervalMs);
    if (missed > 0) {
      entry.missedBeats = missed;
      if (missed >= store.deadThreshold) {
        entry.status = 'dead';
      } else if (missed >= store.stalledThreshold) {
        entry.status = 'stalled';
      }
      stalled.push(entry);
    }
  }

  return stalled;
}

export function removeHeartbeat(store: HeartbeatStore, taskId: string): boolean {
  return store.entries.delete(taskId);
}

export function formatHeartbeatLine(entry: HeartbeatEntry): string {
  return `[heartbeat] task=${entry.taskId} status=${entry.status} missed=${entry.missedBeats} interval=${entry.intervalMs}ms`;
}
