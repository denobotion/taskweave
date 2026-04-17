import { Task } from '../schema/task';
import { createContext, mergeContext, PipelineContext } from './context';
import { executeCommand } from './executor';
import {
  buildSchedule,
  getReadyTasks,
  hasFailed,
  isScheduleComplete,
  markTask,
  shouldSkipTask,
} from './scheduler';

export interface RunOptions {
  env?: Record<string, string>;
  stopOnFailure?: boolean;
}

export interface RunResult {
  name: string;
  status: 'done' | 'skipped' | 'failed';
  output?: string;
  error?: string;
}

export async function runTasks(
  tasks: Task[],
  options: RunOptions = {}
): Promise<RunResult[]> {
  const ctx: PipelineContext = createContext({ env: options.env ?? {} });
  const schedule = buildSchedule(tasks);
  const results: RunResult[] = [];

  while (!isScheduleComplete(schedule)) {
    if (options.stopOnFailure && hasFailed(schedule)) break;

    const ready = getReadyTasks(schedule);
    if (ready.length === 0) break;

    await Promise.all(
      ready.map(async (entry) => {
        const { task } = entry;
        markTask(schedule, task.name, 'running');

        if (shouldSkipTask(task, ctx)) {
          markTask(schedule, task.name, 'skipped');
          results.push({ name: task.name, status: 'skipped' });
          return;
        }

        const result = await executeCommand(task.command, ctx);
        if (result.exitCode === 0) {
          markTask(schedule, task.name, 'done');
          mergeContext(ctx, { outputs: { [task.name]: result.stdout } });
          results.push({ name: task.name, status: 'done', output: result.stdout });
        } else {
          markTask(schedule, task.name, 'failed');
          results.push({ name: task.name, status: 'failed', error: result.stderr });
        }
      })
    );
  }

  return results;
}
