import {
  createMetricsStore,
  recordMetric,
  getMetric,
  summarizeMetrics,
  filterMetrics,
  TaskMetric,
} from './metrics';

function makeMetric(overrides: Partial<TaskMetric> = {}): TaskMetric {
  return {
    taskId: 'task-a',
    startedAt: 1000,
    finishedAt: 1500,
    durationMs: 500,
    status: 'success',
    retries: 0,
    ...overrides,
  };
}

describe('createMetricsStore', () => {
  it('returns empty store', () => {
    expect(createMetricsStore().records).toEqual([]);
  });
});

describe('recordMetric', () => {
  it('appends metric to store', () => {
    const store = createMetricsStore();
    recordMetric(store, makeMetric());
    expect(store.records).toHaveLength(1);
  });
});

describe('getMetric', () => {
  it('returns metric by taskId', () => {
    const store = createMetricsStore();
    recordMetric(store, makeMetric({ taskId: 'build' }));
    expect(getMetric(store, 'build')?.taskId).toBe('build');
  });

  it('returns undefined for unknown task', () => {
    const store = createMetricsStore();
    expect(getMetric(store, 'nope')).toBeUndefined();
  });
});

describe('summarizeMetrics', () => {
  it('computes summary correctly', () => {
    const store = createMetricsStore();
    recordMetric(store, makeMetric({ status: 'success', durationMs: 200 }));
    recordMetric(store, makeMetric({ taskId: 'b', status: 'failure', durationMs: 100 }));
    recordMetric(store, makeMetric({ taskId: 'c', status: 'skipped', durationMs: 0 }));
    const s = summarizeMetrics(store);
    expect(s.total).toBe(3);
    expect(s.succeeded).toBe(1);
    expect(s.failed).toBe(1);
    expect(s.skipped).toBe(1);
    expect(s.totalDurationMs).toBe(300);
    expect(s.avgDurationMs).toBeCloseTo(100);
  });

  it('handles empty store', () => {
    expect(summarizeMetrics(createMetricsStore()).avgDurationMs).toBe(0);
  });
});

describe('filterMetrics', () => {
  it('filters by status', () => {
    const store = createMetricsStore();
    recordMetric(store, makeMetric({ status: 'success' }));
    recordMetric(store, makeMetric({ taskId: 'b', status: 'failure' }));
    expect(filterMetrics(store, 'failure')).toHaveLength(1);
  });
});
