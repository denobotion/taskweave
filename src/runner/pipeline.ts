import { Task } from '../schema/task';
import { executeCommand, CommandResult } from './executor';

export interface PipelineResult {
  taskId: string;
  results: CommandResult[];
  success: boolean;
  skipped: boolean;
}

export interface PipelineContext {
  env?: Record<string, string>;
  dryRun?: boolean;
}

function evaluateCondition(
  condition: string,
  previousResults: CommandResult[]
): boolean {
  if (condition === 'always') return true;
  if (condition === 'never') return false;
  if (condition === 'on_success') {
    return previousResults.every((r) => r.exitCode === 0);
  }
  if (condition === 'on_failure') {
    return previousResults.some((r) => r.exitCode !== 0);
  }
  return true;
}

export async function runTask(
  task: Task,
  context: PipelineContext = {}
): Promise<PipelineResult> {
  const results: CommandResult[] = [];

  if (task.condition) {
    const shouldRun = evaluateCondition(task.condition, []);
    if (!shouldRun) {
      return { taskId: task.id, results, success: true, skipped: true };
    }
  }

  for (const step of task.steps) {
    if (context.dryRun) {
      console.log(`[dry-run] ${task.id}: ${step.command}`);
      continue;
    }

    const result = await executeCommand(step.command, {
      env: { ...process.env, ...context.env } as Record<string, string>,
    });

    results.push(result);

    if (result.exitCode !== 0 && step.continueOnError !== true) {
      return { taskId: task.id, results, success: false, skipped: false };
    }
  }

  return { taskId: task.id, results, success: true, skipped: false };
}
