import { describe, it, expect } from 'vitest';
import { parseArgs } from './parse';

describe('parseArgs', () => {
  it('returns defaults when no args provided', () => {
    const result = parseArgs([]);
    expect(result.file).toBe('taskweave.yml');
    expect(result.task).toBeUndefined();
    expect(result.dryRun).toBe(false);
    expect(result.verbose).toBe(false);
    expect(result.vars).toEqual({});
  });

  it('parses --file flag', () => {
    const result = parseArgs(['--file', 'custom.yml']);
    expect(result.file).toBe('custom.yml');
  });

  it('parses -f shorthand', () => {
    const result = parseArgs(['-f', 'other.yml']);
    expect(result.file).toBe('other.yml');
  });

  it('parses --task flag', () => {
    const result = parseArgs(['--task', 'build']);
    expect(result.task).toBe('build');
  });

  it('parses positional task name', () => {
    const result = parseArgs(['deploy']);
    expect(result.task).toBe('deploy');
  });

  it('parses --dry-run flag', () => {
    const result = parseArgs(['--dry-run']);
    expect(result.dryRun).toBe(true);
  });

  it('parses --verbose flag', () => {
    const result = parseArgs(['-v']);
    expect(result.verbose).toBe(true);
  });

  it('parses --var= entries', () => {
    const result = parseArgs(['--var=ENV=production', '--var=REGION=us-east-1']);
    expect(result.vars).toEqual({ ENV: 'production', REGION: 'us-east-1' });
  });

  it('combines multiple flags', () => {
    const result = parseArgs(['-f', 'tasks.yml', '-v', '--dry-run', 'test']);
    expect(result.file).toBe('tasks.yml');
    expect(result.verbose).toBe(true);
    expect(result.dryRun).toBe(true);
    expect(result.task).toBe('test');
  });
});
