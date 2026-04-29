import { describe, it, expect, vi } from "vitest";
import {
  createLatch,
  countDown,
  resetLatch,
  isLatched,
  awaitLatch,
  releaseAll,
  formatLatchLine,
} from "./latch";

describe("createLatch", () => {
  it("creates a latch with the given count", () => {
    const l = createLatch("test", 3);
    expect(l.count).toBe(3);
    expect(l.initial).toBe(3);
    expect(l.waiters).toHaveLength(0);
  });

  it("throws for negative count", () => {
    expect(() => createLatch("bad", -1)).toThrow(RangeError);
  });

  it("allows count of zero", () => {
    const l = createLatch("zero", 0);
    expect(l.count).toBe(0);
  });
});

describe("countDown", () => {
  it("decrements the count", () => {
    const l = createLatch("cd", 2);
    countDown(l);
    expect(l.count).toBe(1);
  });

  it("does not go below zero", () => {
    const l = createLatch("floor", 1);
    countDown(l);
    countDown(l);
    expect(l.count).toBe(0);
  });

  it("releases waiters when reaching zero", () => {
    const l = createLatch("rel", 1);
    const cb = vi.fn();
    l.waiters.push(cb);
    countDown(l);
    expect(cb).toHaveBeenCalledOnce();
    expect(l.waiters).toHaveLength(0);
  });
});

describe("isLatched", () => {
  it("returns true when count > 0", () => {
    expect(isLatched(createLatch("a", 2))).toBe(true);
  });

  it("returns false when count is 0", () => {
    expect(isLatched(createLatch("b", 0))).toBe(false);
  });
});

describe("resetLatch", () => {
  it("resets count to initial value", () => {
    const l = createLatch("r", 3);
    countDown(l);
    countDown(l);
    resetLatch(l);
    expect(l.count).toBe(3);
  });
});

describe("awaitLatch", () => {
  it("resolves immediately when count is 0", async () => {
    const l = createLatch("imm", 0);
    await expect(awaitLatch(l)).resolves.toBeUndefined();
  });

  it("resolves when counted down to zero", async () => {
    const l = createLatch("async", 2);
    const p = awaitLatch(l);
    countDown(l);
    countDown(l);
    await expect(p).resolves.toBeUndefined();
  });

  it("rejects on timeout", async () => {
    const l = createLatch("timeout", 5);
    await expect(awaitLatch(l, 10)).rejects.toThrow(/timed out/);
  });
});

describe("releaseAll", () => {
  it("calls all waiters and clears the list", () => {
    const l = createLatch("ra", 2);
    const a = vi.fn();
    const b = vi.fn();
    l.waiters.push(a, b);
    releaseAll(l);
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
    expect(l.waiters).toHaveLength(0);
  });
});

describe("formatLatchLine", () => {
  it("formats a readable line", () => {
    const l = createLatch("fmt", 4);
    countDown(l);
    expect(formatLatchLine(l)).toBe("[latch:fmt] count=3/4 waiters=0");
  });
});
