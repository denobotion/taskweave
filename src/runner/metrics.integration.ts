import { MetricsStore, recordMetric, TaskMetric } from './metrics';

export interface TimedTask {
  taskId: string;
  retries?: number;
}

export function startTimer(): number {
  return Date.now();
}

export function commitMetric(
  store: MetricsStore,
  task: TimedTask,
  startedAt: number,
  status: TaskMetric['status']
): TaskMetric {
  const finishedAt = Date.now();
  const metric: TaskMetric = {
    taskId: task.taskId,
    startedAt,
    finishedAt,
    durationMs: finishedAt - startedAt,
    status,
    retries: task.retries ?? 0,
  };
  recordMetric(store, metric);
  return metric;
}

export function formatMetricLine(metric: TaskMetric): string {
  const statusIcon = metric.status === 'success' ? '✓' : metric.status === 'failure' ? '✗' : '–';
  const retryNote = metric.retries > 0 ? ` (${metric.retries} retries)` : '';
  return `${statusIcon} ${metric.taskId} — ${metric.durationMs}ms${retryNote}`;
}

export function printMetricsSummary(
  store: MetricsStore,
  log: (msg: string) => void
): void {
  if (store.records.length === 0) {
    log('No metrics recorded.');
    return;
  }
  store.records.forEach((m) => log(formatMetricLine(m)));
}
