import { describe, it, expect } from "vitest";
import {
  createCircuitBreaker,
  recordFailure,
  recordSuccess,
  evaluateCircuit,
  isCircuitOpen,
  CircuitOptions,
} from "./circuit";

const opts: CircuitOptions = { threshold: 3, resetTimeout: 5_000, successThreshold: 2 };

describe("createCircuitBreaker", () => {
  it("starts in closed state", () => {
    const cb = createCircuitBreaker();
    expect(cb.state).toBe("closed");
    expect(cb.failures).toBe(0);
  });
});

describe("recordFailure", () => {
  it("increments failure count", () => {
    const cb = recordFailure(createCircuitBreaker(), opts);
    expect(cb.failures).toBe(1);
    expect(cb.state).toBe("closed");
  });

  it("opens circuit at threshold", () => {
    let cb = createCircuitBreaker();
    for (let i = 0; i < 3; i++) cb = recordFailure(cb, opts);
    expect(cb.state).toBe("open");
  });

  it("resets successCount on failure", () => {
    const cb = recordFailure({ ...createCircuitBreaker(), successCount: 2 }, opts);
    expect(cb.successCount).toBe(0);
  });
});

describe("recordSuccess", () => {
  it("resets failures when closed", () => {
    let cb = recordFailure(createCircuitBreaker(), opts);
    cb = recordSuccess(cb, opts);
    expect(cb.failures).toBe(0);
  });

  it("closes circuit after successThreshold in half-open", () => {
    let cb: ReturnType<typeof createCircuitBreaker> = {
      state: "half-open", failures: 3, lastFailureAt: Date.now() - 6_000, successCount: 0,
    };
    cb = recordSuccess(cb, opts);
    expect(cb.state).toBe("half-open");
    cb = recordSuccess(cb, opts);
    expect(cb.state).toBe("closed");
    expect(cb.failures).toBe(0);
  });
});

describe("evaluateCircuit", () => {
  it("transitions open -> half-open after resetTimeout", () => {
    const cb = { state: "open" as const, failures: 3, lastFailureAt: 1000, successCount: 0 };
    const result = evaluateCircuit(cb, opts, 1000 + 5_001);
    expect(result.state).toBe("half-open");
  });

  it("stays open before resetTimeout", () => {
    const cb = { state: "open" as const, failures: 3, lastFailureAt: 1000, successCount: 0 };
    const result = evaluateCircuit(cb, opts, 1000 + 1_000);
    expect(result.state).toBe("open");
  });
});

describe("isCircuitOpen", () => {
  it("returns false for closed circuit", () => {
    expect(isCircuitOpen(createCircuitBreaker(), opts)).toBe(false);
  });

  it("returns true for open circuit within timeout", () => {
    const now = Date.now();
    const cb = { state: "open" as const, failures: 3, lastFailureAt: now, successCount: 0 };
    expect(isCircuitOpen(cb, opts, now + 100)).toBe(true);
  });

  it("returns false after reset window (half-open)", () => {
    const cb = { state: "open" as const, failures: 3, lastFailureAt: 0, successCount: 0 };
    expect(isCircuitOpen(cb, opts, 0 + 6_000)).toBe(false);
  });
});
