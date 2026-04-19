import { createMetricsStore, summarizeMetrics } from '../runner/metrics';
import { commitMetric, printMetricsSummary, formatMetricLine } from '../runner/metrics.integration';

export interface MetricsCmdOptions {
  summary?: boolean;
  format?: 'text' | 'json';
}

export function runMetricsCmd(
  store: ReturnType<typeof createMetricsStore>,
  options: MetricsCmdOptions = {}
): void {
  const { summary = false, format = 'text' } = options;

  if (format === 'json') {
    if (summary) {
      console.log(JSON.stringify(summarizeMetrics(store), null, 2));
    } else {
      console.log(JSON.stringify(store.records, null, 2));
    }
    return;
  }

  if (summary) {
    const s = summarizeMetrics(store);
    console.log(`Tasks run  : ${s.total}`);
    console.log(`Succeeded  : ${s.succeeded}`);
    console.log(`Failed     : ${s.failed}`);
    console.log(`Skipped    : ${s.skipped}`);
    console.log(`Total time : ${s.totalDurationMs}ms`);
    console.log(`Avg time   : ${s.avgDurationMs.toFixed(1)}ms`);
  } else {
    printMetricsSummary(store, console.log);
  }
}

export { commitMetric, formatMetricLine };
