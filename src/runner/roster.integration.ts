/**
 * roster.integration.ts — integrates RosterStore with task lifecycle events,
 * providing helpers to manage roster membership around task execution.
 */

import {
  createRosterStore,
  joinRoster,
  leaveRoster,
  getRosterMembers,
  formatRosterLine,
  RosterStore,
} from "./roster";

export interface RosterRunOptions {
  capacity?: number;
  groupId?: string;
}

export interface ManagedRoster {
  store: RosterStore;
  groupId: string;
}

export function buildRosterStore(opts: RosterRunOptions = {}): ManagedRoster {
  const store = createRosterStore(opts.capacity ?? null);
  const groupId = opts.groupId ?? `group-${Date.now()}`;
  return { store, groupId };
}

export function onTaskStart(
  managed: ManagedRoster,
  taskId: string,
  meta?: Record<string, unknown>
): void {
  const result = joinRoster(managed.store, taskId, meta);
  if (!result.ok) {
    throw new Error(
      `[roster:${managed.groupId}] join failed for '${taskId}': ${result.reason}`
    );
  }
}

export function onTaskEnd(managed: ManagedRoster, taskId: string): void {
  leaveRoster(managed.store, taskId);
}

export function getRosterSnapshot(managed: ManagedRoster): string[] {
  return getRosterMembers(managed.store).map(formatRosterLine);
}

export function getRosterSize(managed: ManagedRoster): number {
  return managed.store.members.size;
}
