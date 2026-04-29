import { describe, it, expect, beforeEach } from "vitest";
import {
  createLeaseStore,
  acquireLease,
  renewLease,
  releaseLease,
  isLeaseHeld,
  formatLeaseLine,
} from "./lease";

describe("lease", () => {
  let store: ReturnType<typeof createLeaseStore>;
  const NOW = 1_000_000;

  beforeEach(() => {
    store = createLeaseStore();
  });

  it("acquires a lease when none exists", () => {
    const lease = acquireLease(store, "build", "worker-1", 5000, NOW);
    expect(lease).not.toBeNull();
    expect(lease!.taskId).toBe("build");
    expect(lease!.holder).toBe("worker-1");
    expect(lease!.expiresAt).toBe(NOW + 5000);
  });

  it("returns null when a valid lease already exists", () => {
    acquireLease(store, "build", "worker-1", 5000, NOW);
    const second = acquireLease(store, "build", "worker-2", 5000, NOW + 100);
    expect(second).toBeNull();
  });

  it("allows re-acquisition after expiry", () => {
    acquireLease(store, "build", "worker-1", 5000, NOW);
    const lease = acquireLease(store, "build", "worker-2", 5000, NOW + 6000);
    expect(lease).not.toBeNull();
    expect(lease!.holder).toBe("worker-2");
  });

  it("renews a valid lease", () => {
    const lease = acquireLease(store, "build", "worker-1", 5000, NOW)!;
    const renewed = renewLease(store, "build", lease.id, NOW + 1000);
    expect(renewed).not.toBeNull();
    expect(renewed!.expiresAt).toBe(NOW + 1000 + 5000);
  });

  it("does not renew with wrong leaseId", () => {
    acquireLease(store, "build", "worker-1", 5000, NOW);
    const result = renewLease(store, "build", "wrong-id", NOW + 100);
    expect(result).toBeNull();
  });

  it("releases a lease by id", () => {
    const lease = acquireLease(store, "build", "worker-1", 5000, NOW)!;
    const ok = releaseLease(store, "build", lease.id);
    expect(ok).toBe(true);
    expect(isLeaseHeld(store, "build", NOW + 100)).toBe(false);
  });

  it("does not release with wrong leaseId", () => {
    acquireLease(store, "build", "worker-1", 5000, NOW);
    const ok = releaseLease(store, "build", "wrong-id");
    expect(ok).toBe(false);
  });

  it("reports lease as held within ttl", () => {
    acquireLease(store, "build", "worker-1", 5000, NOW);
    expect(isLeaseHeld(store, "build", NOW + 4999)).toBe(true);
    expect(isLeaseHeld(store, "build", NOW + 5000)).toBe(false);
  });

  it("formats a lease line", () => {
    const lease = acquireLease(store, "deploy", "ci", 3000, NOW)!;
    const line = formatLeaseLine(lease);
    expect(line).toContain("task=deploy");
    expect(line).toContain("holder=ci");
    expect(line).toContain("id=");
  });
});
