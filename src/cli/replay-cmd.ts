import { Command } from 'commander';
import { loadTaskFile } from './load';
import { createAuditLog, recordEvent } from '../runner/audit';
import { createContext } from '../runner/context';
import { buildReplayOptions, runReplay, formatReplayResult } from '../runner/replay.integration';

export function registerReplayCmd(program: Command): void {
  program
    .command('replay <auditFile>')
    .description('Re-execute tasks from a saved audit log')
    .option('--from <timestamp>', 'Replay events from this ISO timestamp')
    .option('--to <timestamp>', 'Replay events up to this ISO timestamp')
    .option('--tasks <ids...>', 'Only replay specific task IDs')
    .option('--dry-run', 'Print replay plan without executing', false)
    .option('-f, --file <path>', 'Task definition file', 'taskweave.yml')
    .action(async (auditFile: string, opts: Record<string, unknown>) => {
      let rawLog: unknown;
      try {
        const fs = await import('fs/promises');
        const text = await fs.readFile(auditFile, 'utf-8');
        rawLog = JSON.parse(text);
      } catch (err) {
        console.error(`Failed to read audit file: ${auditFile}`);
        process.exit(1);
      }

      const log = createAuditLog();
      if (Array.isArray((rawLog as any).events)) {
        for (const ev of (rawLog as any).events) {
          recordEvent(log, ev);
        }
      }

      const taskDefs = await loadTaskFile(opts.file as string);
      const ctx = createContext(taskDefs.env ?? {});
      const replayOpts = buildReplayOptions(opts);

      const executor = async (taskId: string) => {
        const task = taskDefs.tasks?.find((t: any) => t.id === taskId);
        if (!task) throw new Error(`Task not found: ${taskId}`);
        const { executeCommand } = await import('../runner/executor');
        await executeCommand(task.command, ctx);
      };

      const result = await runReplay(log, ctx, replayOpts, executor);
      console.log(formatReplayResult(result));

      if (result.errors.length > 0) {
        process.exit(1);
      }
    });
}
