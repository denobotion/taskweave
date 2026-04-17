import { Task } from '../schema/task';
import { PipelineContext } from './context';
import { evaluateCondition } from './pipeline';

export interface ScheduledTask {
  task: Task;
  dependencies: string[];
  status: 'pending' | 'running' | 'done' | 'skipped' | 'failed';
}

export function buildSchedule(tasks: Task[]): ScheduledTask[] {
  return tasks.map((task) => ({
    task,
    dependencies: task.dependsOn ?? [],
    status: 'pending',
  }));
}

export function getReadyTasks(schedule: ScheduledTask[]): ScheduledTask[] {
  const done = new Set(
    schedule
      .filter((s) => s.status === 'done' || s.status === 'skipped')
      .map((s) => s.task.name)
  );
  return schedule.filter(
    (s) =>
      s.status === 'pending' &&
      s.dependencies.every((dep) => done.has(dep))
  );
}

export function shouldSkipTask(task: Task, ctx: PipelineContext): boolean {
  if (!task.condition) return false;
  return !evaluateCondition(task.condition, ctx);
}

export function markTask(
  schedule: ScheduledTask[],
  name: string,
  status: ScheduledTask['status']
): void {
  const entry = schedule.find((s) => s.task.name === name);
  if (entry) entry.status = status;
}

export function isScheduleComplete(schedule: ScheduledTask[]): boolean {
  return schedule.every((s) => ['done', 'skipped', 'failed'].includes(s.status));
}

export function hasFailed(schedule: ScheduledTask[]): boolean {
  return schedule.some((s) => s.status === 'failed');
}
