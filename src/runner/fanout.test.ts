import { describe, it, expect, vi } from "vitest";
import { fanout, formatFanoutSummary, FanoutOptionsSchema } from "./fanout";

describe("FanoutOptionsSchema", () => {
  it("applies defaults", () => {
    const opts = FanoutOptionsSchema.parse({});
    expect(opts.concurrency).toBe(4);
    expect(opts.stopOnError).toBe(false);
  });

  it("accepts custom values", () => {
    const opts = FanoutOptionsSchema.parse({ concurrency: 2, stopOnError: true });
    expect(opts.concurrency).toBe(2);
    expect(opts.stopOnError).toBe(true);
  });
});

describe("fanout", () => {
  it("runs all items and collects fulfilled results", async () => {
    const items = [1, 2, 3, 4, 5];
    const visited: number[] = [];
    const summary = await fanout(items, async (n) => { visited.push(n); });
    expect(visited.sort()).toEqual([1, 2, 3, 4, 5]);
    expect(summary.fulfilled).toBe(5);
    expect(summary.rejected).toBe(0);
    expect(summary.total).toBe(5);
  });

  it("records failed items without stopping by default", async () => {
    const items = ["a", "b", "c"];
    const summary = await fanout(items, async (s) => {
      if (s === "b") throw new Error("boom");
    });
    expect(summary.fulfilled).toBe(2);
    expect(summary.rejected).toBe(1);
    expect(summary.results.find((r) => r.value === "b")?.error?.message).toBe("boom");
  });

  it("stops after first failing chunk when stopOnError is true", async () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const visited: number[] = [];
    const summary = await fanout(
      items,
      async (n) => {
        visited.push(n);
        if (n === 2) throw new Error("stop");
      },
      { concurrency: 4, stopOnError: true }
    );
    // First chunk of 4 runs; subsequent chunks are skipped
    expect(summary.total).toBe(4);
    expect(summary.rejected).toBe(1);
  });

  it("handles empty input", async () => {
    const summary = await fanout([], async () => {});
    expect(summary.total).toBe(0);
    expect(summary.fulfilled).toBe(0);
  });

  it("respects concurrency limit", async () => {
    let active = 0;
    let maxActive = 0;
    const items = Array.from({ length: 10 }, (_, i) => i);
    await fanout(
      items,
      async () => {
        active++;
        maxActive = Math.max(maxActive, active);
        await new Promise((r) => setTimeout(r, 5));
        active--;
      },
      { concurrency: 3 }
    );
    expect(maxActive).toBeLessThanOrEqual(3);
  });
});

describe("formatFanoutSummary", () => {
  it("formats summary string", () => {
    const line = formatFanoutSummary({ results: [], fulfilled: 7, rejected: 2, total: 9 });
    expect(line).toBe("fanout: 9 items — 7 ok, 2 failed");
  });
});
