import { runTasks } from './run';
import { Task } from '../schema/task';

describe('runTasks', () => {
  it('runs a single task and returns done', async () => {
    const tasks: Task[] = [{ name: 'hello', command: 'echo hello' }];
    const results = await runTasks(tasks);
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('done');
    expect(results[0].output?.trim()).toBe('hello');
  });

  it('runs dependent tasks in order', async () => {
    const tasks: Task[] = [
      { name: 'first', command: 'echo first' },
      { name: 'second', command: 'echo second', dependsOn: ['first'] },
    ];
    const results = await runTasks(tasks);
    expect(results.map((r) => r.name)).toEqual(['first', 'second']);
    expect(results.every((r) => r.status === 'done')).toBe(true);
  });

  it('marks task as failed on non-zero exit', async () => {
    const tasks: Task[] = [{ name: 'fail', command: 'exit 1' }];
    const results = await runTasks(tasks);
    expect(results[0].status).toBe('failed');
  });

  it('stops on failure when stopOnFailure is true', async () => {
    const tasks: Task[] = [
      { name: 'bad', command: 'exit 1' },
      { name: 'after', command: 'echo after', dependsOn: ['bad'] },
    ];
    const results = await runTasks(tasks, { stopOnFailure: true });
    expect(results.some((r) => r.name === 'after')).toBe(false);
  });

  it('skips tasks whose condition evaluates to false', async () => {
    const tasks: Task[] = [
      { name: 'skipped', command: 'echo nope', condition: 'env.RUN == true' },
    ];
    const results = await runTasks(tasks, { env: { RUN: 'false' } });
    expect(results[0].status).toBe('skipped');
  });
});
