import { describe, it, expect } from "vitest";
import {
  createJitter,
  nextJitteredDelay,
  advanceJitter,
  resetJitter,
  formatJitterLine,
} from "./jitter";

describe("createJitter", () => {
  it("initializes lastDelay to baseMs", () => {
    const j = createJitter({ strategy: "full", baseMs: 100, maxMs: 5000 });
    expect(j.lastDelay).toBe(100);
  });
});

describe("nextJitteredDelay — full", () => {
  it("returns a value between 0 and exponential cap", () => {
    const j = createJitter({ strategy: "full", baseMs: 100, maxMs: 1000 });
    for (let i = 0; i < 20; i++) {
      const d = nextJitteredDelay(j, 2);
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThanOrEqual(400); // min(100*4, 1000)
    }
  });
});

describe("nextJitteredDelay — equal", () => {
  it("returns a value in upper half of exponential range", () => {
    const j = createJitter({ strategy: "equal", baseMs: 100, maxMs: 1000 });
    for (let i = 0; i < 20; i++) {
      const d = nextJitteredDelay(j, 1);
      expect(d).toBeGreaterThanOrEqual(100); // half of 200
      expect(d).toBeLessThanOrEqual(200);
    }
  });
});

describe("nextJitteredDelay — decorrelated", () => {
  it("respects maxMs cap", () => {
    const j = createJitter({ strategy: "decorrelated", baseMs: 100, maxMs: 500 });
    for (let i = 0; i < 20; i++) {
      const d = nextJitteredDelay(j, 3);
      expect(d).toBeLessThanOrEqual(500);
      expect(d).toBeGreaterThanOrEqual(100);
    }
  });
});

describe("advanceJitter", () => {
  it("updates lastDelay", () => {
    const j = createJitter({ strategy: "decorrelated", baseMs: 50, maxMs: 2000 });
    const next = advanceJitter(j, 1);
    expect(next.lastDelay).not.toBe(j.lastDelay);
  });

  it("does not mutate original state", () => {
    const j = createJitter({ strategy: "full", baseMs: 100, maxMs: 1000 });
    advanceJitter(j, 2);
    expect(j.lastDelay).toBe(100);
  });
});

describe("resetJitter", () => {
  it("resets lastDelay to baseMs", () => {
    const j = createJitter({ strategy: "equal", baseMs: 200, maxMs: 3000 });
    const advanced = advanceJitter(j, 5);
    const reset = resetJitter(advanced);
    expect(reset.lastDelay).toBe(200);
  });
});

describe("formatJitterLine", () => {
  it("includes strategy, attempt, and delay", () => {
    const j = createJitter({ strategy: "full", baseMs: 100, maxMs: 1000 });
    const line = formatJitterLine(j, 3);
    expect(line).toContain("strategy=full");
    expect(line).toContain("attempt=3");
    expect(line).toContain("cap=1000ms");
  });
});
