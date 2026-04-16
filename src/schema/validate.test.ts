import { validateTask } from './validate';

const validTask = {
  version: '1.0',
  name: 'build',
  steps: [
    { id: 'compile', command: 'tsc --noEmit' },
    {
      id: 'test',
      command: 'jest',
      condition: { when: '{{inputs.runTests}}', then: 'continue', otherwise: 'skip' },
      continueOnError: false,
    },
  ],
};

describe('validateTask', () => {
  it('accepts a valid task definition', () => {
    const result = validateTask(validTask);
    expect(result.valid).toBe(true);
    expect(result.task?.name).toBe('build');
    expect(result.errors).toBeUndefined();
  });

  it('rejects a task missing required version', () => {
    const { version, ...noVersion } = validTask as any;
    const result = validateTask(noVersion);
    expect(result.valid).toBe(false);
    expect(result.errors?.some((e) => e.includes('version'))).toBe(true);
  });

  it('rejects a task with empty steps array', () => {
    const result = validateTask({ ...validTask, steps: [] });
    expect(result.valid).toBe(false);
    expect(result.errors?.length).toBeGreaterThan(0);
  });

  it('rejects a step with negative timeout', () => {
    const result = validateTask({
      ...validTask,
      steps: [{ id: 'x', command: 'echo hi', timeout: -1 }],
    });
    expect(result.valid).toBe(false);
  });

  it('returns structured errors with path info', () => {
    const result = validateTask({ version: '1.0', name: 'x', steps: [{ id: 's1' }] });
    expect(result.valid).toBe(false);
    expect(result.errors?.some((e) => e.includes('command'))).toBe(true);
  });
});
