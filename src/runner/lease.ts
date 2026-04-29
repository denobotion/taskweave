import { randomUUID } from "crypto";

export interface Lease {
  id: string;
  taskId: string;
  holder: string;
  ttlMs: number;
  acquiredAt: number;
  expiresAt: number;
}

export interface LeaseStore {
  leases: Map<string, Lease>;
}

export function createLeaseStore(): LeaseStore {
  return { leases: new Map() };
}

export function acquireLease(
  store: LeaseStore,
  taskId: string,
  holder: string,
  ttlMs: number,
  now = Date.now()
): Lease | null {
  const existing = store.leases.get(taskId);
  if (existing && existing.expiresAt > now) {
    return null;
  }
  const lease: Lease = {
    id: randomUUID(),
    taskId,
    holder,
    ttlMs,
    acquiredAt: now,
    expiresAt: now + ttlMs,
  };
  store.leases.set(taskId, lease);
  return lease;
}

export function renewLease(
  store: LeaseStore,
  taskId: string,
  leaseId: string,
  now = Date.now()
): Lease | null {
  const existing = store.leases.get(taskId);
  if (!existing || existing.id !== leaseId || existing.expiresAt <= now) {
    return null;
  }
  const renewed: Lease = {
    ...existing,
    expiresAt: now + existing.ttlMs,
  };
  store.leases.set(taskId, renewed);
  return renewed;
}

export function releaseLease(
  store: LeaseStore,
  taskId: string,
  leaseId: string
): boolean {
  const existing = store.leases.get(taskId);
  if (!existing || existing.id !== leaseId) {
    return false;
  }
  store.leases.delete(taskId);
  return true;
}

export function isLeaseHeld(
  store: LeaseStore,
  taskId: string,
  now = Date.now()
): boolean {
  const existing = store.leases.get(taskId);
  return !!existing && existing.expiresAt > now;
}

export function formatLeaseLine(lease: Lease): string {
  const ttlRemaining = Math.max(0, lease.expiresAt - Date.now());
  return `[lease] task=${lease.taskId} holder=${lease.holder} ttl=${ttlRemaining}ms id=${lease.id}`;
}
