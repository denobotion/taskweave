import { describe, it, expect } from "vitest";
import {
  createAuditLog,
  recordEvent,
  filterEvents,
  summarizeAuditLog,
} from "./audit";

describe("createAuditLog", () => {
  it("creates a log with a unique runId and empty events", () => {
    const log = createAuditLog();
    expect(log.runId).toHaveLength(12);
    expect(log.events).toEqual([]);
    expect(log.startedAt).toBeLessThanOrEqual(Date.now());
  });

  it("generates distinct runIds", () => {
    const a = createAuditLog();
    const b = createAuditLog();
    expect(a.runId).not.toBe(b.runId);
  });
});

describe("recordEvent", () => {
  it("appends an event to the log", () => {
    const log = createAuditLog();
    recordEvent(log, "task:start", "build");
    expect(log.events).toHaveLength(1);
    expect(log.events[0].type).toBe("task:start");
    expect(log.events[0].taskName).toBe("build");
  });

  it("stores extra fields", () => {
    const log = createAuditLog();
    recordEvent(log, "task:success", "lint", { durationMs: 120, exitCode: 0 });
    expect(log.events[0].durationMs).toBe(120);
    expect(log.events[0].exitCode).toBe(0);
  });

  it("returns the created event", () => {
    const log = createAuditLog();
    const ev = recordEvent(log, "task:failure", "test", { error: "oops" });
    expect(ev.error).toBe("oops");
    expect(ev.id).toHaveLength(8);
  });
});

describe("filterEvents", () => {
  it("returns only matching event types", () => {
    const log = createAuditLog();
    recordEvent(log, "task:start", "a");
    recordEvent(log, "task:success", "a");
    recordEvent(log, "task:skip", "b");
    expect(filterEvents(log, "task:success")).toHaveLength(1);
    expect(filterEvents(log, "task:skip")[0].taskName).toBe("b");
  });
});

describe("summarizeAuditLog", () => {
  it("counts events by type", () => {
    const log = createAuditLog();
    recordEvent(log, "task:start", "a");
    recordEvent(log, "task:start", "b");
    recordEvent(log, "task:success", "a");
    recordEvent(log, "task:failure", "b");
    const summary = summarizeAuditLog(log);
    expect(summary["task:start"]).toBe(2);
    expect(summary["task:success"]).toBe(1);
    expect(summary["task:failure"]).toBe(1);
  });
});
