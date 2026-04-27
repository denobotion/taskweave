/**
 * Sliding window counter for tracking task execution rates over time.
 */

export interface WindowEntry {
  timestamp: number;
  value: number;
}

export interface SlidingWindow {
  readonly durationMs: number;
  entries: WindowEntry[];
}

export interface WindowStats {
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
}

export function createWindow(durationMs: number): SlidingWindow {
  if (durationMs <= 0) throw new RangeError("durationMs must be positive");
  return { durationMs, entries: [] };
}

export function recordWindow(
  window: SlidingWindow,
  value: number,
  now = Date.now()
): SlidingWindow {
  const pruned = pruneWindow(window, now);
  return { ...pruned, entries: [...pruned.entries, { timestamp: now, value }] };
}

export function pruneWindow(
  window: SlidingWindow,
  now = Date.now()
): SlidingWindow {
  const cutoff = now - window.durationMs;
  return {
    ...window,
    entries: window.entries.filter((e) => e.timestamp > cutoff),
  };
}

export function windowStats(window: SlidingWindow, now = Date.now()): WindowStats {
  const active = pruneWindow(window, now).entries;
  if (active.length === 0) {
    return { count: 0, sum: 0, min: 0, max: 0, avg: 0 };
  }
  const values = active.map((e) => e.value);
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    count: active.length,
    sum,
    min: Math.min(...values),
    max: Math.max(...values),
    avg: sum / active.length,
  };
}

export function windowCount(window: SlidingWindow, now = Date.now()): number {
  return pruneWindow(window, now).entries.length;
}

export function formatWindowLine(stats: WindowStats): string {
  return `count=${stats.count} sum=${stats.sum} min=${stats.min} max=${stats.max} avg=${stats.avg.toFixed(2)}`;
}
