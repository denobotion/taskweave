/**
 * jitter.ts — Adds randomized delay offsets to retry/backoff strategies
 * to prevent thundering herd problems in concurrent task pipelines.
 */

export type JitterStrategy = "full" | "equal" | "decorrelated";

export interface JitterOptions {
  strategy: JitterStrategy;
  /** Base delay in milliseconds */
  baseMs: number;
  /** Maximum delay cap in milliseconds */
  maxMs: number;
  /** Seed for deterministic testing (optional) */
  seed?: number;
}

export interface JitterState {
  options: JitterOptions;
  lastDelay: number;
}

export function createJitter(options: JitterOptions): JitterState {
  return { options, lastDelay: options.baseMs };
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Compute the next jittered delay given the current attempt number (0-indexed).
 */
export function nextJitteredDelay(state: JitterState, attempt: number): number {
  const { baseMs, maxMs, strategy } = state.options;
  const exponential = Math.min(baseMs * Math.pow(2, attempt), maxMs);

  let delay: number;

  switch (strategy) {
    case "full":
      delay = rand(0, exponential);
      break;

    case "equal":
      delay = exponential / 2 + rand(0, exponential / 2);
      break;

    case "decorrelated":
      // decorrelated jitter: sleep = min(cap, random_between(base, prev * 3))
      delay = Math.min(maxMs, rand(baseMs, state.lastDelay * 3));
      break;

    default:
      delay = exponential;
  }

  return delay;
}

export function advanceJitter(state: JitterState, attempt: number): JitterState {
  const delay = nextJitteredDelay(state, attempt);
  return { ...state, lastDelay: delay };
}

export function resetJitter(state: JitterState): JitterState {
  return { ...state, lastDelay: state.options.baseMs };
}

export function formatJitterLine(state: JitterState, attempt: number): string {
  const delay = nextJitteredDelay(state, attempt);
  return `[jitter] strategy=${state.options.strategy} attempt=${attempt} delay=${delay.toFixed(1)}ms cap=${state.options.maxMs}ms`;
}
