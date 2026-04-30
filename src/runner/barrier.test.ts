import { describe, it, expect, vi } from "vitest";
import {
  createBarrier,
  arriveAtBarrier,
  isBarrierReached,
  waitForBarrier,
  releaseBarrier,
  resetBarrier,
  formatBarrierLine,
} from "./barrier";

describe("createBarrier", () => {
  it("creates a barrier with the given count", () => {
    const b = createBarrier(3);
    expect(b.count).toBe(3);
    expect(b.arrived.size).toBe(0);
  });

  it("throws for count < 1", () => {
    expect(() => createBarrier(0)).toThrow(RangeError);
  });

  it("throws for negative count", () => {
    expect(() => createBarrier(-1)).toThrow(RangeError);
  });
});

describe("arriveAtBarrier", () => {
  it("returns true on first arrival", () => {
    const b = createBarrier(2);
    expect(arriveAtBarrier(b, "task-a")).toBe(true);
  });

  it("returns false on duplicate arrival", () => {
    const b = createBarrier(2);
    arriveAtBarrier(b, "task-a");
    expect(arriveAtBarrier(b, "task-a")).toBe(false);
  });

  it("tracks multiple distinct task arrivals", () => {
    const b = createBarrier(3);
    arriveAtBarrier(b, "task-a");
    arriveAtBarrier(b, "task-b");
    expect(b.arrived.size).toBe(2);
  });
});

describe("isBarrierReached", () => {
  it("returns false before all tasks arrive", () => {
    const b = createBarrier(2);
    arriveAtBarrier(b, "task-a");
    expect(isBarrierReached(b)).toBe(false);
  });

  it("returns true once all tasks have arrived", () => {
    const b = createBarrier(2);
    arriveAtBarrier(b, "task-a");
    arriveAtBarrier(b, "task-b");
    expect(isBarrierReached(b)).toBe(true);
  });
});

describe("waitForBarrier / releaseBarrier", () => {
  it("resolves immediately when barrier is already reached", async () => {
    const b = createBarrier(1);
    arriveAtBarrier(b, "task-a");
    await expect(waitForBarrier(b)).resolves.toBeUndefined();
  });

  it("resolves waiters when releaseBarrier is called", async () => {
    const b = createBarrier(2);
    const p = waitForBarrier(b);
    arriveAtBarrier(b, "task-a");
    arriveAtBarrier(b, "task-b");
    const released = releaseBarrier(b);
    expect(released).toBe(1);
    await expect(p).resolves.toBeUndefined();
  });

  it("returns 0 from releaseBarrier when barrier not reached", () => {
    const b = createBarrier(2);
    expect(releaseBarrier(b)).toBe(0);
  });

  it("resolves multiple concurrent waiters", async () => {
    const b = createBarrier(2);
    const p1 = waitForBarrier(b);
    const p2 = waitForBarrier(b);
    arriveAtBarrier(b, "task-a");
    arriveAtBarrier(b, "task-b");
    const released = releaseBarrier(b);
    expect(released).toBe(2);
    await expect(Promise.all([p1, p2])).resolves.toBeDefined();
  });
});

describe("resetBarrier", () => {
  it("clears arrived set", () => {
    const b = createBarrier(2);
    arriveAtBarrier(b, "task-a");
    resetBarrier(b);
    expect(b.arrived.size).toBe(0);
  });

  it("allows tasks to arrive again after reset", () => {
    const b = createBarrier(2);
    arriveAtBarrier(b, "task-a");
    arriveAtBarrier(b, "task-b");
    resetBarrier(b);
    expect(arriveAtBarrier(b, "task-a")).toBe(true);
    expect(isBarrierReached(b)).toBe(false);
  });
});

describe("formatBarrierLine", () => {
  it("formats a human-readable summary", () => {
    const b = createBarrier(3);
    arriveAtBarrier(b, "task-a");
    expect(formatBarrierLine(b)).toBe("barrier: 1/3 arrived, 0 waiting");
  });
});
