import { createMetricsStore } from './metrics';
import { commitMetric, formatMetricLine, printMetricsSummary } from './metrics.integration';

describe('commitMetric', () => {
  it('records a success metric', () => {
    const store = createMetricsStore();
    const start = Date.now() - 100;
    const m = commitMetric(store, { taskId: 'build', retries: 1 }, start, 'success');
    expect(m.taskId).toBe('build');
    expect(m.status).toBe('success');
    expect(m.retries).toBe(1);
    expect(m.durationMs).toBeGreaterThanOrEqual(100);
    expect(store.records).toHaveLength(1);
  });

  it('records a failure metric', () => {
    const store = createMetricsStore();
    const m = commitMetric(store, { taskId: 'test' }, Date.now(), 'failure');
    expect(m.status).toBe('failure');
  });
});

describe('formatMetricLine', () => {
  it('formats success with checkmark', () => {
    const line = formatMetricLine({ taskId: 'lint', startedAt: 0, finishedAt: 200, durationMs: 200, status: 'success', retries: 0 });
    expect(line).toContain('✓');
    expect(line).toContain('lint');
    expect(line).toContain('200ms');
  });

  it('includes retry note when retries > 0', () => {
    const line = formatMetricLine({ taskId: 'test', startedAt: 0, finishedAt: 50, durationMs: 50, status: 'failure', retries: 2 });
    expect(line).toContain('2 retries');
  });

  it('formats skipped with dash', () => {
    const line = formatMetricLine({ taskId: 'deploy', startedAt: 0, finishedAt: 0, durationMs: 0, status: 'skipped', retries: 0 });
    expect(line).toContain('–');
  });
});

describe('printMetricsSummary', () => {
  it('logs each metric line', () => {
    const store = createMetricsStore();
    commitMetric(store, { taskId: 'a' }, Date.now(), 'success');
    const lines: string[] = [];
    printMetricsSummary(store, (msg) => lines.push(msg));
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('a');
  });

  it('logs empty message when no records', () => {
    const store = createMetricsStore();
    const lines: string[] = [];
    printMetricsSummary(store, (msg) => lines.push(msg));
    expect(lines[0]).toMatch(/no metrics/i);
  });
});
