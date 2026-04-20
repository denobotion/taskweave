import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerTraceCmd } from './trace-cmd';
import * as traceIntegration from '../runner/trace.integration';
import * as traceModule from '../runner/trace';

function makeProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerTraceCmd(program);
  return program;
}

describe('trace-cmd', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('registers trace list subcommand', () => {
    const program = makeProgram();
    const names = program.commands.flatMap((c) =>
      c.commands.map((sub) => sub.name())
    );
    expect(names).toContain('list');
  });

  it('registers trace show subcommand', () => {
    const program = makeProgram();
    const names = program.commands.flatMap((c) =>
      c.commands.map((sub) => sub.name())
    );
    expect(names).toContain('show');
  });

  it('trace list calls printTraceSummary', () => {
    const mockStore = { events: [] } as any;
    vi.spyOn(traceIntegration, 'buildTraceStore').mockReturnValue(mockStore);
    const summarySpy = vi
      .spyOn(traceIntegration, 'printTraceSummary')
      .mockImplementation(() => {});
    const program = makeProgram();
    program.parse(['node', 'tw', 'trace', 'list'], { from: 'user' });
    expect(summarySpy).toHaveBeenCalledWith(mockStore, undefined);
  });

  it('trace show prints empty message when no events', () => {
    const mockStore = { events: [] } as any;
    vi.spyOn(traceIntegration, 'buildTraceStore').mockReturnValue(mockStore);
    vi.spyOn(traceIntegration, 'getTaskTraces').mockReturnValue([]);
    const program = makeProgram();
    program.parse(['node', 'tw', 'trace', 'show', 'build'], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(
      'No traces found for task: build'
    );
  });

  it('trace show prints events when found', () => {
    const fakeEvent = { id: 'build-1', taskId: 'build', status: 'success' } as any;
    const mockStore = { events: [fakeEvent] } as any;
    vi.spyOn(traceIntegration, 'buildTraceStore').mockReturnValue(mockStore);
    vi.spyOn(traceIntegration, 'getTaskTraces').mockReturnValue([fakeEvent]);
    vi.spyOn(traceModule, 'formatTraceLine').mockReturnValue('[trace] build success');
    const program = makeProgram();
    program.parse(['node', 'tw', 'trace', 'show', 'build'], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith('[trace] build success');
  });
});
