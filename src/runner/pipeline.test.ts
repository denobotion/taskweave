import { runTask, PipelineContext } from './pipeline';
import { Task } from '../schema/task';
import * as executor from './executor';

const mockResult = (exitCode: number) => ({
  exitCode,
  stdout: '',
  stderr: '',
  command: 'echo test',
});

const baseTask = (): Task => ({
  id: 'test-task',
  steps: [{ command: 'echo hello' }],
});

describe('runTask', () => {
  afterEach(() => jest.restoreAllMocks());

  it('runs all steps and returns success', async () => {
    jest.spyOn(executor, 'executeCommand').mockResolvedValue(mockResult(0));
    const result = await runTask(baseTask());
    expect(result.success).toBe(true);
    expect(result.skipped).toBe(false);
    expect(result.results).toHaveLength(1);
  });

  it('stops on first failing step by default', async () => {
    jest.spyOn(executor, 'executeCommand').mockResolvedValue(mockResult(1));
    const task: Task = {
      id: 'fail-task',
      steps: [{ command: 'bad cmd' }, { command: 'echo after' }],
    };
    const result = await runTask(task);
    expect(result.success).toBe(false);
    expect(result.results).toHaveLength(1);
  });

  it('continues on error when continueOnError is true', async () => {
    jest.spyOn(executor, 'executeCommand').mockResolvedValue(mockResult(1));
    const task: Task = {
      id: 'continue-task',
      steps: [
        { command: 'bad cmd', continueOnError: true },
        { command: 'echo after', continueOnError: true },
      ],
    };
    const result = await runTask(task);
    expect(result.results).toHaveLength(2);
  });

  it('skips task when condition is never', async () => {
    const task: Task = { ...baseTask(), condition: 'never' };
    const result = await runTask(task);
    expect(result.skipped).toBe(true);
    expect(result.results).toHaveLength(0);
  });

  it('does not execute commands in dry-run mode', async () => {
    const spy = jest.spyOn(executor, 'executeCommand');
    await runTask(baseTask(), { dryRun: true });
    expect(spy).not.toHaveBeenCalled();
  });
});
