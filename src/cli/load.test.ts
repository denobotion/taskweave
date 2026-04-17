import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadTaskFile } from './load';

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}));

vi.mock('yaml', () => ({
  parse: vi.fn(),
}));

import { readFileSync } from 'fs';
import { parse as parseYaml } from 'yaml';

const mockReadFileSync = readFileSync as unknown as ReturnType<typeof vi.fn>;
const mockParseYaml = parseYaml as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('loadTaskFile', () => {
  it('throws if file cannot be read', () => {
    mockReadFileSync.mockImplementation(() => { throw new Error('ENOENT'); });
    expect(() => loadTaskFile('missing.yml')).toThrow('Cannot read task file');
  });

  it('throws if YAML is invalid', () => {
    mockReadFileSync.mockReturnValue('bad: [yaml');
    mockParseYaml.mockImplementation(() => { throw new Error('unexpected end'); });
    expect(() => loadTaskFile('bad.yml')).toThrow('Failed to parse YAML');
  });

  it('throws if tasks array is missing', () => {
    mockReadFileSync.mockReturnValue('');
    mockParseYaml.mockReturnValue({ notTasks: [] });
    expect(() => loadTaskFile('no-tasks.yml')).toThrow('top-level "tasks" array');
  });

  it('throws on invalid task schema', () => {
    mockReadFileSync.mockReturnValue('');
    mockParseYaml.mockReturnValue({ tasks: [{ invalid: true }] });
    expect(() => loadTaskFile('invalid-task.yml')).toThrow('Task[0] validation failed');
  });

  it('returns parsed tasks on valid input', () => {
    mockReadFileSync.mockReturnValue('');
    mockParseYaml.mockReturnValue({
      tasks: [{ id: 'build', command: 'npm run build' }],
    });
    const result = loadTaskFile('valid.yml');
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].id).toBe('build');
  });
});
