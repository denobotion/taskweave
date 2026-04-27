import {
  createWindow,
  recordWindow,
  pruneWindow,
  windowStats,
  windowCount,
  formatWindowLine,
} from "./window";

const BASE = 1_000_000;

describe("createWindow", () => {
  it("creates a window with no entries", () => {
    const w = createWindow(5000);
    expect(w.durationMs).toBe(5000);
    expect(w.entries).toHaveLength(0);
  });

  it("throws for non-positive duration", () => {
    expect(() => createWindow(0)).toThrow(RangeError);
    expect(() => createWindow(-1)).toThrow(RangeError);
  });
});

describe("recordWindow", () => {
  it("appends an entry", () => {
    const w = createWindow(5000);
    const w2 = recordWindow(w, 42, BASE);
    expect(w2.entries).toHaveLength(1);
    expect(w2.entries[0]).toEqual({ timestamp: BASE, value: 42 });
  });

  it("does not mutate the original window", () => {
    const w = createWindow(5000);
    recordWindow(w, 1, BASE);
    expect(w.entries).toHaveLength(0);
  });
});

describe("pruneWindow", () => {
  it("removes entries outside the duration", () => {
    let w = createWindow(1000);
    w = recordWindow(w, 1, BASE);
    w = recordWindow(w, 2, BASE + 500);
    w = recordWindow(w, 3, BASE + 1500);
    const pruned = pruneWindow(w, BASE + 1500);
    expect(pruned.entries).toHaveLength(1);
    expect(pruned.entries[0].value).toBe(3);
  });
});

describe("windowStats", () => {
  it("returns zeros for empty window", () => {
    const w = createWindow(1000);
    expect(windowStats(w, BASE)).toEqual({ count: 0, sum: 0, min: 0, max: 0, avg: 0 });
  });

  it("computes correct stats", () => {
    let w = createWindow(5000);
    w = recordWindow(w, 10, BASE);
    w = recordWindow(w, 20, BASE + 100);
    w = recordWindow(w, 30, BASE + 200);
    const stats = windowStats(w, BASE + 300);
    expect(stats.count).toBe(3);
    expect(stats.sum).toBe(60);
    expect(stats.min).toBe(10);
    expect(stats.max).toBe(30);
    expect(stats.avg).toBeCloseTo(20);
  });
});

describe("windowCount", () => {
  it("counts only active entries", () => {
    let w = createWindow(500);
    w = recordWindow(w, 1, BASE);
    w = recordWindow(w, 2, BASE + 600);
    expect(windowCount(w, BASE + 600)).toBe(1);
  });
});

describe("formatWindowLine", () => {
  it("formats stats as a readable string", () => {
    const line = formatWindowLine({ count: 3, sum: 60, min: 10, max: 30, avg: 20 });
    expect(line).toBe("count=3 sum=60 min=10 max=30 avg=20.00");
  });
});
