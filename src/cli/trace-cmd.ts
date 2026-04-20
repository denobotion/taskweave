import { Command } from 'commander';
import { buildTraceStore, getTaskTraces, printTraceSummary } from '../runner/trace.integration';
import { formatTraceLine } from '../runner/trace';

const DEFAULT_TRACE_DIR = '.taskweave/traces';

export function registerTraceCmd(program: Command): void {
  const traceCmd = program
    .command('trace')
    .description('View execution traces for tasks');

  traceCmd
    .command('list')
    .description('List all trace events')
    .option('--dir <dir>', 'Trace directory', DEFAULT_TRACE_DIR)
    .option('--task <taskId>', 'Filter by task ID')
    .action((opts) => {
      const store = buildTraceStore(opts.dir);
      printTraceSummary(store, opts.task);
    });

  traceCmd
    .command('show <taskId>')
    .description('Show traces for a specific task')
    .option('--dir <dir>', 'Trace directory', DEFAULT_TRACE_DIR)
    .action((taskId: string, opts) => {
      const store = buildTraceStore(opts.dir);
      const events = getTaskTraces(store, taskId);
      if (events.length === 0) {
        console.log(`No traces found for task: ${taskId}`);
        return;
      }
      events.forEach((e) => console.log(formatTraceLine(e)));
      console.log(`\n${events.length} trace event(s) for "${taskId}"`);
    });

  traceCmd
    .command('clear')
    .description('Clear all stored traces')
    .option('--dir <dir>', 'Trace directory', DEFAULT_TRACE_DIR)
    .action((opts) => {
      const store = buildTraceStore(opts.dir);
      // Reset internal store state
      (store as any).events = [];
      console.log('Trace store cleared.');
    });
}
