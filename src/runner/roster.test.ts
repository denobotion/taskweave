import { describe, it, expect, beforeEach } from "vitest";
import {
  createRosterStore,
  joinRoster,
  leaveRoster,
  isInRoster,
  getRosterMembers,
  clearRoster,
  formatRosterLine,
  RosterStore,
} from "./roster";

describe("roster", () => {
  let store: RosterStore;

  beforeEach(() => {
    store = createRosterStore();
  });

  it("joins a task successfully", () => {
    const result = joinRoster(store, "build");
    expect(result.ok).toBe(true);
    expect(isInRoster(store, "build")).toBe(true);
  });

  it("rejects duplicate join", () => {
    joinRoster(store, "build");
    const result = joinRoster(store, "build");
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/already in roster/);
  });

  it("respects capacity limit", () => {
    const capped = createRosterStore(2);
    joinRoster(capped, "a");
    joinRoster(capped, "b");
    const result = joinRoster(capped, "c");
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/capacity/);
  });

  it("leaves roster", () => {
    joinRoster(store, "build");
    const removed = leaveRoster(store, "build");
    expect(removed).toBe(true);
    expect(isInRoster(store, "build")).toBe(false);
  });

  it("returns false when leaving non-member", () => {
    expect(leaveRoster(store, "ghost")).toBe(false);
  });

  it("lists members", () => {
    joinRoster(store, "a", { env: "ci" });
    joinRoster(store, "b");
    const members = getRosterMembers(store);
    expect(members).toHaveLength(2);
    expect(members.map((m) => m.taskId)).toContain("a");
  });

  it("clears all members", () => {
    joinRoster(store, "a");
    joinRoster(store, "b");
    clearRoster(store);
    expect(getRosterMembers(store)).toHaveLength(0);
  });

  it("formats a roster line", () => {
    joinRoster(store, "deploy");
    const entry = getRosterMembers(store)[0];
    const line = formatRosterLine(entry);
    expect(line).toMatch(/\[roster\] deploy joined \d+ms ago/);
  });

  it("stores meta on entry", () => {
    joinRoster(store, "test", { runner: "vitest" });
    const entry = store.members.get("test");
    expect(entry?.meta).toEqual({ runner: "vitest" });
  });
});
