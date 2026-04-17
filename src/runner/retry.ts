export interface RetryOptions {
  maxAttempts: number;
  delayMs?: number;
  backoff?: 'linear' | 'exponential';
}

export interface RetryResult<T> {
  value?: T;
  attempts: number;
  error?: Error;
  success: boolean;
}

export function computeDelay(attempt: number, options: RetryOptions): number {
  const base = options.delayMs ?? 0;
  if (base === 0) return 0;
  if (options.backoff === 'exponential') {
    return base * Math.pow(2, attempt - 1);
  }
  if (options.backoff === 'linear') {
    return base * attempt;
  }
  return base;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<RetryResult<T>> {
  const { maxAttempts } = options;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const value = await fn();
      return { value, attempts: attempt, success: true };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxAttempts) {
        const delay = computeDelay(attempt, options);
        if (delay > 0) {
          await new Promise((res) => setTimeout(res, delay));
        }
      }
    }
  }

  return { attempts: maxAttempts, error: lastError, success: false };
}
