import { describe, it, expect, vi } from "vitest";
import { drainQueue, formatDrainResult } from "./drain";
import { createQueue, enqueue } from "./queue";

describe("drainQueue", () => {
  it("drains all items from a queue", async () => {
    const q = createQueue<number>();
    enqueue(q, 1);
    enqueue(q, 2);
    enqueue(q, 3);

    const result = await drainQueue(q, { maxWaitMs: 1000 });
    expect(result.drained).toBe(3);
    expect(result.timedOut).toBe(false);
  });

  it("calls onItem for each dequeued item", async () => {
    const q = createQueue<string>();
    enqueue(q, "a");
    enqueue(q, "b");

    const seen: string[] = [];
    await drainQueue(q, { onItem: (item) => { seen.push(item as string); } });
    expect(seen).toEqual(["a", "b"]);
  });

  it("returns timedOut=false for empty queue", async () => {
    const q = createQueue<number>();
    const result = await drainQueue(q, { maxWaitMs: 100 });
    expect(result.drained).toBe(0);
    expect(result.timedOut).toBe(false);
  });

  it("records elapsed time", async () => {
    const q = createQueue<number>();
    enqueue(q, 42);
    const result = await drainQueue(q);
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
  });
});

describe("formatDrainResult", () => {
  it("formats a complete result", () => {
    const line = formatDrainResult({ drained: 5, timedOut: false, elapsedMs: 120 });
    expect(line).toBe("drain(complete): 5 items in 120ms");
  });

  it("formats a timed-out result", () => {
    const line = formatDrainResult({ drained: 2, timedOut: true, elapsedMs: 5001 });
    expect(line).toBe("drain(timed-out): 2 items in 5001ms");
  });
});
