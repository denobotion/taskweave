import { Command } from 'commander';
import { buildQueueRunner, scheduleTask, formatQueueStatus, drainQueue } from '../runner/queue.integration';
import { createLogger, log } from '../runner/logger';

export function registerQueueCmd(program: Command): void {
  program
    .command('queue <tasks...>')
    .description('Run tasks through the priority queue')
    .option('-c, --concurrency <n>', 'Max concurrent tasks', '4')
    .option('-p, --priority <level>', 'Priority: high | normal | low', 'normal')
    .option('--dry-run', 'Print queue plan without executing')
    .action(async (tasks: string[], opts) => {
      const logger = createLogger('queue-cmd');
      const concurrency = parseInt(opts.concurrency, 10);
      const priority = opts.priority as 'high' | 'normal' | 'low';

      let runner = buildQueueRunner<string>(async (task) => {
        log(logger, 'info', `Running task: ${task}`);
        await new Promise((r) => setTimeout(r, 50));
        log(logger, 'info', `Finished task: ${task}`);
      }, concurrency);

      for (const task of tasks) {
        runner = scheduleTask(runner, task, task, priority);
      }

      log(logger, 'info', formatQueueStatus(runner.queue));

      if (opts.dryRun) {
        console.log('Dry run — tasks queued:');
        runner.queue.items.forEach((item, i) => {
          console.log(`  ${i + 1}. [${item.priority}] ${item.id}`);
        });
        return;
      }

      try {
        await drainQueue(runner);
        log(logger, 'info', 'All tasks completed.');
      } catch (err) {
        log(logger, 'error', `Queue failed: ${(err as Error).message}`);
        process.exit(1);
      }
    });
}
