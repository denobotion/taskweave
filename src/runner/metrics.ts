export interface TaskMetric {
  taskId: string;
  startedAt: number;
  finishedAt: number;
  durationMs: number;
  status: 'success' | 'failure' | 'skipped';
  retries: number;
}

export interface MetricsStore {
  records: TaskMetric[];
}

export function createMetricsStore(): MetricsStore {
  return { records: [] };
}

export function recordMetric(
  store: MetricsStore,
  metric: TaskMetric
): void {
  store.records.push(metric);
}

export function getMetric(
  store: MetricsStore,
  taskId: string
): TaskMetric | undefined {
  return store.records.find((r) => r.taskId === taskId);
}

export function summarizeMetrics(store: MetricsStore): {
  total: number;
  succeeded: number;
  failed: number;
  skipped: number;
  totalDurationMs: number;
  avgDurationMs: number;
} {
  const { records } = store;
  const succeeded = records.filter((r) => r.status === 'success').length;
  const failed = records.filter((r) => r.status === 'failure').length;
  const skipped = records.filter((r) => r.status === 'skipped').length;
  const totalDurationMs = records.reduce((sum, r) => sum + r.durationMs, 0);
  const avgDurationMs = records.length ? totalDurationMs / records.length : 0;
  return { total: records.length, succeeded, failed, skipped, totalDurationMs, avgDurationMs };
}

export function filterMetrics(
  store: MetricsStore,
  status: TaskMetric['status']
): TaskMetric[] {
  return store.records.filter((r) => r.status === status);
}
