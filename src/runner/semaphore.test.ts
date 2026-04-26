import { describe, it, expect } from "vitest";
import {
  createSemaphore,
  formatSemaphoreLine,
} from "./semaphore";

describe("createSemaphore", () => {
  it("throws when capacity < 1", () => {
    expect(() => createSemaphore(0)).toThrow(RangeError);
  });

  it("reports correct initial state", () => {
    const sem = createSemaphore(3);
    expect(sem.capacity).toBe(3);
    expect(sem.available).toBe(3);
    expect(sem.pending).toBe(0);
  });

  it("acquires a slot immediately when available", async () => {
    const sem = createSemaphore(2);
    const h = await sem.acquire("a");
    expect(h.id).toBe("a");
    expect(sem.available).toBe(1);
  });

  it("queues callers when at capacity", async () => {
    const sem = createSemaphore(1);
    const h1 = await sem.acquire("first");
    expect(sem.available).toBe(0);

    let resolved = false;
    const p2 = sem.acquire("second").then((h) => {
      resolved = true;
      return h;
    });

    // Still waiting
    expect(sem.pending).toBe(1);
    expect(resolved).toBe(false);

    h1.release();
    const h2 = await p2;
    expect(resolved).toBe(true);
    expect(h2.id).toBe("second");
    expect(sem.pending).toBe(0);
  });

  it("drains queue in FIFO order", async () => {
    const sem = createSemaphore(1);
    const h1 = await sem.acquire("first");
    const order: string[] = [];

    const p2 = sem.acquire("second").then((h) => { order.push("second"); return h; });
    const p3 = sem.acquire("third").then((h) => { order.push("third"); return h; });

    h1.release();
    const h2 = await p2;
    h2.release();
    const h3 = await p3;
    h3.release();

    expect(order).toEqual(["second", "third"]);
  });

  it("available never goes below zero", async () => {
    const sem = createSemaphore(1);
    await sem.acquire();
    expect(sem.available).toBe(0);
  });
});

describe("formatSemaphoreLine", () => {
  it("formats semaphore state as a string", async () => {
    const sem = createSemaphore(4);
    await sem.acquire();
    const line = formatSemaphoreLine(sem);
    expect(line).toBe("semaphore capacity=4 available=3 pending=0");
  });
});
