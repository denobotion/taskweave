/**
 * roster.ts — tracks active task participants in a run group,
 * supporting join/leave and membership queries.
 */

export interface RosterEntry {
  taskId: string;
  joinedAt: number;
  meta?: Record<string, unknown>;
}

export interface RosterStore {
  members: Map<string, RosterEntry>;
  capacity: number | null;
}

export function createRosterStore(capacity: number | null = null): RosterStore {
  return { members: new Map(), capacity };
}

export function joinRoster(
  store: RosterStore,
  taskId: string,
  meta?: Record<string, unknown>
): { ok: boolean; reason?: string } {
  if (store.members.has(taskId)) {
    return { ok: false, reason: `task '${taskId}' already in roster` };
  }
  if (store.capacity !== null && store.members.size >= store.capacity) {
    return { ok: false, reason: `roster at capacity (${store.capacity})` };
  }
  store.members.set(taskId, { taskId, joinedAt: Date.now(), meta });
  return { ok: true };
}

export function leaveRoster(
  store: RosterStore,
  taskId: string
): boolean {
  return store.members.delete(taskId);
}

export function isInRoster(store: RosterStore, taskId: string): boolean {
  return store.members.has(taskId);
}

export function getRosterMembers(store: RosterStore): RosterEntry[] {
  return Array.from(store.members.values());
}

export function clearRoster(store: RosterStore): void {
  store.members.clear();
}

export function formatRosterLine(entry: RosterEntry): string {
  const age = Date.now() - entry.joinedAt;
  return `[roster] ${entry.taskId} joined ${age}ms ago`;
}
