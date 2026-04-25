import { describe, it, expect, beforeEach } from "vitest";
import {
  createCircuitStore,
  getBreaker,
  onTaskSuccess,
  onTaskFailure,
  isTaskBlocked,
  formatCircuitStatus,
  CircuitStore,
} from "./circuit.integration";

let store: CircuitStore;

beforeEach(() => {
  store = createCircuitStore({ threshold: 2, resetTimeout: 10_000, successThreshold: 1 });
});

describe("getBreaker", () => {
  it("creates a breaker on first access", () => {
    const cb = getBreaker(store, "task-a");
    expect(cb.state).toBe("closed");
  });

  it("returns same breaker on subsequent calls", () => {
    getBreaker(store, "task-a");
    onTaskFailure(store, "task-a");
    const cb = getBreaker(store, "task-a");
    expect(cb.failures).toBe(1);
  });
});

describe("onTaskSuccess / onTaskFailure", () => {
  it("tracks failures per task independently", () => {
    onTaskFailure(store, "task-a");
    onTaskFailure(store, "task-b");
    onTaskFailure(store, "task-b");
    expect(getBreaker(store, "task-a").failures).toBe(1);
    expect(getBreaker(store, "task-b").state).toBe("open");
  });

  it("resets failures after success", () => {
    onTaskFailure(store, "task-a");
    onTaskSuccess(store, "task-a");
    expect(getBreaker(store, "task-a").failures).toBe(0);
  });
});

describe("isTaskBlocked", () => {
  it("returns false for healthy task", () => {
    expect(isTaskBlocked(store, "task-a")).toBe(false);
  });

  it("returns true after threshold failures", () => {
    onTaskFailure(store, "task-a");
    onTaskFailure(store, "task-a");
    expect(isTaskBlocked(store, "task-a")).toBe(true);
  });
});

describe("formatCircuitStatus", () => {
  it("includes state and failure count", () => {
    onTaskFailure(store, "task-a");
    const line = formatCircuitStatus(store, "task-a");
    expect(line).toContain("state=closed");
    expect(line).toContain("failures=1");
  });

  it("includes retry_in when circuit is open", () => {
    onTaskFailure(store, "task-a");
    onTaskFailure(store, "task-a");
    const line = formatCircuitStatus(store, "task-a");
    expect(line).toContain("state=open");
    expect(line).toMatch(/retry_in=\d+s/);
  });
});
