/**
 * debounce.ts — Debounce utility for task execution triggers.
 * Used primarily by the watch system to avoid redundant re-runs.
 */

export interface DebounceHandle {
  trigger: () => void;
  cancel: () => void;
  flush: () => void;
  isPending: () => boolean;
}

export interface DebounceOptions {
  /** Wait time in milliseconds before invoking the callback. */
  wait: number;
  /** If true, invoke on the leading edge instead of trailing. */
  leading?: boolean;
  /** Maximum wait before forced invocation regardless of triggers. */
  maxWait?: number;
}

export function createDebounce(
  fn: () => void | Promise<void>,
  options: DebounceOptions
): DebounceHandle {
  const { wait, leading = false, maxWait } = options;

  let timer: ReturnType<typeof setTimeout> | null = null;
  let maxTimer: ReturnType<typeof setTimeout> | null = null;
  let pending = false;

  function invoke() {
    pending = false;
    clearMaxTimer();
    fn();
  }

  function clearMaxTimer() {
    if (maxTimer !== null) {
      clearTimeout(maxTimer);
      maxTimer = null;
    }
  }

  function cancel() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    clearMaxTimer();
    pending = false;
  }

  function flush() {
    if (pending) {
      cancel();
      invoke();
    }
  }

  function trigger() {
    if (leading && !pending) {
      pending = true;
      invoke();
      return;
    }

    pending = true;

    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      invoke();
    }, wait);

    if (maxWait !== undefined && maxTimer === null) {
      maxTimer = setTimeout(() => {
        maxTimer = null;
        if (timer !== null) {
          clearTimeout(timer);
          timer = null;
        }
        invoke();
      }, maxWait);
    }
  }

  return {
    trigger,
    cancel,
    flush,
    isPending: () => pending,
  };
}
