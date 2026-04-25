import { describe, it, expect, vi } from "vitest";
import {
  createBackoff,
  nextDelay,
  advanceBackoff,
  resetBackoff,
  formatBackoffLine,
} from "./backoff";

describe("createBackoff", () => {
  it("uses defaults when no options provided", () => {
    const store = createBackoff();
    expect(store.options.strategy).toBe("exponential");
    expect(store.options.baseMs).toBe(100);
    expect(store.options.maxMs).toBe(30_000);
    expect(store.options.jitter).toBe(true);
    expect(store.attempt).toBe(0);
  });

  it("merges provided options with defaults", () => {
    const store = createBackoff({ strategy: "linear", baseMs: 200 });
    expect(store.options.strategy).toBe("linear");
    expect(store.options.baseMs).toBe(200);
    expect(store.options.maxMs).toBe(30_000);
  });
});

describe("nextDelay", () => {
  it("returns fixed delay for fixed strategy", () => {
    const store = createBackoff({ strategy: "fixed", baseMs: 500, jitter: false });
    expect(nextDelay(store)).toBe(500);
    const advanced = advanceBackoff(store);
    expect(nextDelay(advanced)).toBe(500);
  });

  it("returns linear delay scaled by attempt", () => {
    const store = createBackoff({ strategy: "linear", baseMs: 100, jitter: false });
    expect(nextDelay(store)).toBe(100);
    expect(nextDelay(advanceBackoff(store))).toBe(200);
    expect(nextDelay(advanceBackoff(advanceBackoff(store)))).toBe(300);
  });

  it("returns exponential delay", () => {
    const store = createBackoff({ strategy: "exponential", baseMs: 100, jitter: false });
    expect(nextDelay(store)).toBe(100);
    expect(nextDelay(advanceBackoff(store))).toBe(200);
    expect(nextDelay(advanceBackoff(advanceBackoff(store)))).toBe(400);
  });

  it("clamps delay to maxMs", () => {
    const store = createBackoff({ strategy: "exponential", baseMs: 1000, maxMs: 2000, jitter: false });
    const advanced = advanceBackoff(advanceBackoff(store));
    expect(nextDelay(advanced)).toBe(2000);
  });

  it("applies jitter within expected range", () => {
    vi.spyOn(Math, "random").mockReturnValue(1.0);
    const store = createBackoff({ strategy: "fixed", baseMs: 1000, jitter: true });
    const delay = nextDelay(store);
    expect(delay).toBeGreaterThanOrEqual(500);
    expect(delay).toBeLessThanOrEqual(1000);
    vi.restoreAllMocks();
  });
});

describe("advanceBackoff", () => {
  it("increments attempt without mutating original", () => {
    const store = createBackoff();
    const next = advanceBackoff(store);
    expect(store.attempt).toBe(0);
    expect(next.attempt).toBe(1);
  });
});

describe("resetBackoff", () => {
  it("resets attempt to zero", () => {
    const store = advanceBackoff(advanceBackoff(createBackoff()));
    const reset = resetBackoff(store);
    expect(reset.attempt).toBe(0);
    expect(store.attempt).toBe(2);
  });
});

describe("formatBackoffLine", () => {
  it("formats a readable backoff line", () => {
    const store = createBackoff({ strategy: "exponential" });
    const line = formatBackoffLine(store, 350);
    expect(line).toContain("attempt=0");
    expect(line).toContain("strategy=exponential");
    expect(line).toContain("delay=350ms");
  });
});
