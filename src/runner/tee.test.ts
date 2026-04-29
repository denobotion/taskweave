import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync, readFileSync } from "fs";
import { join, tmpdir } from "path";
import {
  createTeeStore,
  openTee,
  writeTee,
  flushTee,
  getTeeBuffer,
  closeTeeStore,
  formatTeeLine,
} from "./tee";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "tee-test-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("createTeeStore", () => {
  it("initialises with empty maps", () => {
    const store = createTeeStore();
    expect(store.streams.size).toBe(0);
    expect(store.buffers.size).toBe(0);
  });

  it("respects custom maxBuffer", () => {
    const store = createTeeStore(5);
    expect(store.maxBuffer).toBe(5);
  });
});

describe("openTee / writeTee / flushTee", () => {
  it("writes lines to file and buffers them", async () => {
    const store = createTeeStore();
    const path = join(dir, "out.log");
    openTee(store, "task-a", path);
    writeTee(store, "task-a", "hello");
    writeTee(store, "task-a", "world");
    await flushTee(store, "task-a");

    const content = readFileSync(path, "utf8");
    expect(content).toContain("hello\n");
    expect(content).toContain("world\n");
  });

  it("returns same stream on duplicate openTee", () => {
    const store = createTeeStore();
    const path = join(dir, "dup.log");
    const ws1 = openTee(store, "task-b", path);
    const ws2 = openTee(store, "task-b", path);
    expect(ws1).toBe(ws2);
  });
});

describe("getTeeBuffer", () => {
  it("returns buffered lines", () => {
    const store = createTeeStore();
    openTee(store, "task-c", join(dir, "c.log"));
    writeTee(store, "task-c", "line1");
    writeTee(store, "task-c", "line2");
    expect(getTeeBuffer(store, "task-c")).toEqual(["line1", "line2"]);
  });

  it("trims buffer when maxBuffer exceeded", () => {
    const store = createTeeStore(2);
    openTee(store, "task-d", join(dir, "d.log"));
    writeTee(store, "task-d", "a");
    writeTee(store, "task-d", "b");
    writeTee(store, "task-d", "c");
    const buf = getTeeBuffer(store, "task-d");
    expect(buf.length).toBe(2);
    expect(buf).toEqual(["b", "c"]);
  });
});

describe("closeTeeStore", () => {
  it("closes all open streams", async () => {
    const store = createTeeStore();
    openTee(store, "t1", join(dir, "t1.log"));
    openTee(store, "t2", join(dir, "t2.log"));
    await closeTeeStore(store);
    expect(store.streams.size).toBe(0);
  });
});

describe("formatTeeLine", () => {
  it("includes task id and message", () => {
    const line = formatTeeLine("build", "compiled ok", 0);
    expect(line).toContain("[build]");
    expect(line).toContain("compiled ok");
  });
});
