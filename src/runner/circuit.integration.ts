/**
 * Integration helpers: wraps task execution with circuit-breaker protection.
 */

import {
  CircuitBreaker,
  CircuitOptions,
  createCircuitBreaker,
  evaluateCircuit,
  isCircuitOpen,
  recordFailure,
  recordSuccess,
} from "./circuit";

export interface CircuitStore {
  breakers: Map<string, CircuitBreaker>;
  options: CircuitOptions;
}

export function createCircuitStore(options?: Partial<CircuitOptions>): CircuitStore {
  return {
    breakers: new Map(),
    options: { threshold: 3, resetTimeout: 30_000, successThreshold: 1, ...options },
  };
}

export function getBreaker(store: CircuitStore, taskId: string): CircuitBreaker {
  if (!store.breakers.has(taskId)) {
    store.breakers.set(taskId, createCircuitBreaker());
  }
  return evaluateCircuit(store.breakers.get(taskId)!, store.options);
}

export function onTaskSuccess(store: CircuitStore, taskId: string): void {
  const cb = getBreaker(store, taskId);
  store.breakers.set(taskId, recordSuccess(cb, store.options));
}

export function onTaskFailure(store: CircuitStore, taskId: string): void {
  const cb = getBreaker(store, taskId);
  store.breakers.set(taskId, recordFailure(cb, store.options));
}

export function isTaskBlocked(store: CircuitStore, taskId: string): boolean {
  const cb = getBreaker(store, taskId);
  return isCircuitOpen(cb, store.options);
}

export function formatCircuitStatus(store: CircuitStore, taskId: string): string {
  const cb = getBreaker(store, taskId);
  const eta =
    cb.state === "open" && cb.lastFailureAt !== null
      ? Math.max(0, store.options.resetTimeout - (Date.now() - cb.lastFailureAt))
      : 0;
  return `[circuit:${taskId}] state=${cb.state} failures=${cb.failures}${
    eta > 0 ? ` retry_in=${Math.ceil(eta / 1000)}s` : ""
  }`;
}

/**
 * Resets the circuit breaker for a given task, removing it from the store so
 * it will be re-initialised in a closed state on the next access. Useful for
 * manual operator intervention or test teardown.
 */
export function resetBreaker(store: CircuitStore, taskId: string): void {
  store.breakers.delete(taskId);
}
