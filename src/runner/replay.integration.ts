import { AuditLog } from './audit';
import { RunContext } from './context';
import { replayFromLog, ReplayOptions, ReplayResult } from './replay';

export function formatReplayResult(result: ReplayResult): string {
  const lines: string[] = [];
  if (result.replayed.length > 0) {
    lines.push(`Replayed (${result.replayed.length}): ${result.replayed.join(', ')}`);
  }
  if (result.skipped.length > 0) {
    lines.push(`Skipped (${result.skipped.length}): ${result.skipped.join(', ')}`);
  }
  if (result.errors.length > 0) {
    lines.push(`Errors (${result.errors.length}):`);
    for (const e of result.errors) {
      lines.push(`  [${e.taskId}] ${e.error}`);
    }
  }
  return lines.join('\n');
}

export async function runReplay(
  log: AuditLog,
  ctx: RunContext,
  opts: ReplayOptions,
  executor: (taskId: string, ctx: RunContext) => Promise<void>
): Promise<ReplayResult> {
  const result = await replayFromLog(log, ctx, opts, executor);
  return result;
}

export function buildReplayOptions(
  argv: Record<string, unknown>
): ReplayOptions {
  return {
    from: typeof argv.from === 'string' ? argv.from : undefined,
    to: typeof argv.to === 'string' ? argv.to : undefined,
    taskFilter:
      Array.isArray(argv.tasks)
        ? (argv.tasks as string[])
        : typeof argv.tasks === 'string'
        ? [argv.tasks]
        : undefined,
    dryRun: argv['dry-run'] === true || argv.dryRun === true,
  };
}
