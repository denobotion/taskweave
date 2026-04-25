/**
 * Circuit breaker for task execution — prevents cascading failures
 * by tracking consecutive errors and opening the circuit after a threshold.
 */

export type CircuitState = "closed" | "open" | "half-open";

export interface CircuitBreaker {
  state: CircuitState;
  failures: number;
  lastFailureAt: number | null;
  successCount: number;
}

export interface CircuitOptions {
  threshold: number;      // failures before opening
  resetTimeout: number;   // ms before moving open -> half-open
  successThreshold: number; // successes in half-open before closing
}

const DEFAULT_OPTIONS: CircuitOptions = {
  threshold: 3,
  resetTimeout: 30_000,
  successThreshold: 1,
};

export function createCircuitBreaker(): CircuitBreaker {
  return { state: "closed", failures: 0, lastFailureAt: null, successCount: 0 };
}

export function recordFailure(
  cb: CircuitBreaker,
  opts: CircuitOptions = DEFAULT_OPTIONS,
  now = Date.now()
): CircuitBreaker {
  const failures = cb.failures + 1;
  const state: CircuitState = failures >= opts.threshold ? "open" : cb.state;
  return { ...cb, failures, lastFailureAt: now, state, successCount: 0 };
}

export function recordSuccess(
  cb: CircuitBreaker,
  opts: CircuitOptions = DEFAULT_OPTIONS
): CircuitBreaker {
  if (cb.state === "half-open") {
    const successCount = cb.successCount + 1;
    if (successCount >= opts.successThreshold) {
      return { state: "closed", failures: 0, lastFailureAt: null, successCount: 0 };
    }
    return { ...cb, successCount };
  }
  return { ...cb, failures: 0, successCount: 0 };
}

export function evaluateCircuit(
  cb: CircuitBreaker,
  opts: CircuitOptions = DEFAULT_OPTIONS,
  now = Date.now()
): CircuitBreaker {
  if (cb.state === "open" && cb.lastFailureAt !== null) {
    if (now - cb.lastFailureAt >= opts.resetTimeout) {
      return { ...cb, state: "half-open", successCount: 0 };
    }
  }
  return cb;
}

export function isCircuitOpen(
  cb: CircuitBreaker,
  opts: CircuitOptions = DEFAULT_OPTIONS,
  now = Date.now()
): boolean {
  const evaluated = evaluateCircuit(cb, opts, now);
  return evaluated.state === "open";
}
