import { Command } from 'commander';
import {
  createHeartbeatStore,
  registerHeartbeat,
  recordBeat,
  evaluateHeartbeats,
  formatHeartbeatLine,
  HeartbeatStore,
} from '../runner/heartbeat';
import { createLogger, log } from '../runner/logger';

const POLL_INTERVAL_MS = 1000;

function startMonitor(
  store: HeartbeatStore,
  verbose: boolean
): ReturnType<typeof setInterval> {
  const logger = createLogger({ verbose });
  return setInterval(() => {
    const issues = evaluateHeartbeats(store);
    for (const entry of issues) {
      log(logger, 'warn', formatHeartbeatLine(entry));
    }
  }, POLL_INTERVAL_MS);
}

export function registerHeartbeatCmd(program: Command): void {
  const cmd = program.command('heartbeat').description('Monitor task heartbeats');

  cmd
    .command('watch <taskId>')
    .description('Watch a task heartbeat at a given interval')
    .option('-i, --interval <ms>', 'Heartbeat interval in ms', '2000')
    .option('-v, --verbose', 'Verbose output', false)
    .action((taskId: string, opts: { interval: string; verbose: boolean }) => {
      const intervalMs = parseInt(opts.interval, 10);
      if (isNaN(intervalMs) || intervalMs <= 0) {
        console.error('Invalid interval value');
        process.exit(1);
      }
      const store = createHeartbeatStore();
      registerHeartbeat(store, taskId, intervalMs);
      console.log(`Monitoring heartbeat for task "${taskId}" every ${intervalMs}ms`);
      startMonitor(store, opts.verbose);
    });

  cmd
    .command('beat <taskId>')
    .description('Send a heartbeat signal for a task')
    .action((taskId: string) => {
      // In a real integration this would communicate with a running monitor
      // via IPC or shared state. Here we demonstrate the API.
      const store = createHeartbeatStore();
      registerHeartbeat(store, taskId, 2000);
      const ok = recordBeat(store, taskId);
      if (ok) {
        console.log(`Heartbeat recorded for task "${taskId}"`);
      } else {
        console.error(`Unknown task "${taskId}"`);
        process.exit(1);
      }
    });
}
