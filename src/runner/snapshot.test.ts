import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "fs";
import {
  createSnapshotStore,
  saveSnapshot,
  loadSnapshot,
  hashOutput,
  hasOutputChanged,
  makeSnapshot,
} from "./snapshot";

const TEST_DIR = ".test-snapshots";

beforeEach(() => { if (!existsSync(TEST_DIR)) mkdirSync(TEST_DIR, { recursive: true }); });
afterEach(() => { rmSync(TEST_DIR, { recursive: true, force: true }); });

describe("hashOutput", () => {
  it("returns consistent hash", () => {
    expect(hashOutput("hello")).toBe(hashOutput("hello"));
  });
  it("differs for different content", () => {
    expect(hashOutput("a")).not.toBe(hashOutput("b"));
  });
  it("returns 16 char hex", () => {
    expect(hashOutput("x")).toHaveLength(16);
  });
});

describe("saveSnapshot / loadSnapshot", () => {
  it("round-trips a snapshot", () => {
    const store = createSnapshotStore(TEST_DIR);
    const snap = makeSnapshot("task1", "output", { env: "prod" });
    saveSnapshot(store, snap);
    const loaded = loadSnapshot(store, "task1");
    expect(loaded).not.toBeNull();
    expect(loaded?.taskId).toBe("task1");
    expect(loaded?.inputs).toEqual({ env: "prod" });
  });

  it("returns null for missing task", () => {
    const store = createSnapshotStore(TEST_DIR);
    expect(loadSnapshot(store, "missing")).toBeNull();
  });
});

describe("hasOutputChanged", () => {
  it("returns true when no snapshot exists", () => {
    const store = createSnapshotStore(TEST_DIR);
    expect(hasOutputChanged(store, "new-task", "output")).toBe(true);
  });

  it("returns false when output matches", () => {
    const store = createSnapshotStore(TEST_DIR);
    saveSnapshot(store, makeSnapshot("t", "same"));
    expect(hasOutputChanged(store, "t", "same")).toBe(false);
  });

  it("returns true when output differs", () => {
    const store = createSnapshotStore(TEST_DIR);
    saveSnapshot(store, makeSnapshot("t", "old"));
    expect(hasOutputChanged(store, "t", "new")).toBe(true);
  });
});
