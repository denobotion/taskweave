/**
 * Backoff strategies for retry logic.
 * Supports fixed, linear, and exponential backoff with optional jitter.
 */

export type BackoffStrategy = "fixed" | "linear" | "exponential";

export interface BackoffOptions {
  strategy: BackoffStrategy;
  baseMs: number;
  maxMs: number;
  jitter: boolean;
}

export interface BackoffStore {
  options: BackoffOptions;
  attempt: number;
}

const DEFAULT_OPTIONS: BackoffOptions = {
  strategy: "exponential",
  baseMs: 100,
  maxMs: 30_000,
  jitter: true,
};

export function createBackoff(options: Partial<BackoffOptions> = {}): BackoffStore {
  return {
    options: { ...DEFAULT_OPTIONS, ...options },
    attempt: 0,
  };
}

export function nextDelay(store: BackoffStore): number {
  const { strategy, baseMs, maxMs, jitter } = store.options;
  const attempt = store.attempt;

  let delay: number;

  switch (strategy) {
    case "fixed":
      delay = baseMs;
      break;
    case "linear":
      delay = baseMs * (attempt + 1);
      break;
    case "exponential":
    default:
      delay = baseMs * Math.pow(2, attempt);
      break;
  }

  delay = Math.min(delay, maxMs);

  if (jitter) {
    delay = Math.floor(delay * (0.5 + Math.random() * 0.5));
  }

  return delay;
}

export function advanceBackoff(store: BackoffStore): BackoffStore {
  return { ...store, attempt: store.attempt + 1 };
}

export function resetBackoff(store: BackoffStore): BackoffStore {
  return { ...store, attempt: 0 };
}

export function formatBackoffLine(store: BackoffStore, delayMs: number): string {
  return `[backoff] attempt=${store.attempt} strategy=${store.options.strategy} delay=${delayMs}ms`;
}
