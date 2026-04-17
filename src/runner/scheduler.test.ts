import {
  buildSchedule,
  getReadyTasks,
  markTask,
  isScheduleComplete,
  hasFailed,
  shouldSkipTask,
} from './scheduler';
import { Task } from '../schema/task';
import { createContext } from './context';

const taskA: Task = { name: 'a', command: 'echo a' };
const taskB: Task = { name: 'b', command: 'echo b', dependsOn: ['a'] };
const taskC: Task = { name: 'c', command: 'echo c', dependsOn: ['a', 'b'] };

describe('buildSchedule', () => {
  it('creates scheduled entries for all tasks', () => {
    const schedule = buildSchedule([taskA, taskB]);
    expect(schedule).toHaveLength(2);
    expect(schedule[0].status).toBe('pending');
  });
});

describe('getReadyTasks', () => {
  it('returns tasks with no dependencies first', () => {
    const schedule = buildSchedule([taskA, taskB, taskC]);
    const ready = getReadyTasks(schedule);
    expect(ready.map((r) => r.task.name)).toEqual(['a']);
  });

  it('returns next tasks after dependencies complete', () => {
    const schedule = buildSchedule([taskA, taskB, taskC]);
    markTask(schedule, 'a', 'done');
    const ready = getReadyTasks(schedule);
    expect(ready.map((r) => r.task.name)).toEqual(['b']);
  });
});

describe('isScheduleComplete', () => {
  it('returns false when tasks are pending', () => {
    const schedule = buildSchedule([taskA]);
    expect(isScheduleComplete(schedule)).toBe(false);
  });

  it('returns true when all tasks are done or skipped', () => {
    const schedule = buildSchedule([taskA, taskB]);
    markTask(schedule, 'a', 'done');
    markTask(schedule, 'b', 'skipped');
    expect(isScheduleComplete(schedule)).toBe(true);
  });
});

describe('hasFailed', () => {
  it('detects failed tasks', () => {
    const schedule = buildSchedule([taskA]);
    markTask(schedule, 'a', 'failed');
    expect(hasFailed(schedule)).toBe(true);
  });
});

describe('shouldSkipTask', () => {
  it('returns false when no condition set', () => {
    const ctx = createContext({});
    expect(shouldSkipTask(taskA, ctx)).toBe(false);
  });

  it('skips task when condition is false', () => {
    const ctx = createContext({ env: { SKIP: 'false' } });
    const task: Task = { name: 't', command: 'echo t', condition: 'env.SKIP == true' };
    expect(shouldSkipTask(task, ctx)).toBe(true);
  });
});
