/**
 * Timeout utilities for task execution.
 */

export class TimeoutError extends Error {
  constructor(public readonly ms: number) {
    super(`Task timed out after ${ms}ms`);
    this.name = 'TimeoutError';
  }
}

/**
 * Wraps a promise with a timeout. Rejects with TimeoutError if exceeded.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  if (ms <= 0) return promise;

  let timer: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new TimeoutError(ms));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
}

/**
 * Returns true if the error is a TimeoutError.
 */
export function isTimeoutError(err: unknown): err is TimeoutError {
  return err instanceof TimeoutError;
}

/**
 * Parses a timeout value from a string like "30s", "2m", or plain ms number.
 */
export function parseTimeout(value: string | number | undefined): number {
  if (value === undefined) return 0;
  if (typeof value === 'number') return value;

  const match = value.match(/^(\d+(?:\.\d+)?)(ms|s|m|h)?$/);
  if (!match) throw new Error(`Invalid timeout format: "${value}"`);

  const amount = parseFloat(match[1]);
  const unit = match[2] ?? 'ms';

  switch (unit) {
    case 'ms': return amount;
    case 's':  return amount * 1_000;
    case 'm':  return amount * 60_000;
    case 'h':  return amount * 3_600_000;
    default:   throw new Error(`Unknown time unit: ${unit}`);
  }
}
