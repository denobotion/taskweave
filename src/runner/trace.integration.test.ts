import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildTraceStore,
  startTrace,
  finishTrace,
  getTaskTraces,
  printTraceSummary,
} from './trace.integration';
import { filterTraceEvents } from './trace';
import { vi } from 'vitest';

const TEST_DIR = '/tmp/taskweave-trace-integration-test';

describe('trace.integration', () => {
  let store: ReturnType<typeof buildTraceStore>;

  beforeEach(() => {
    store = buildTraceStore(TEST_DIR);
  });

  it('startTrace records a running trace and returns an id', () => {
    const id = startTrace(store, { taskId: 'build', command: 'tsc' });
    expect(id).toContain('build-');
    const events = filterTraceEvents(store, () => true);
    expect(events).toHaveLength(1);
    expect(events[0].status).toBe('running');
  });

  it('finishTrace closes the trace with correct status', () => {
    const id = startTrace(store, { taskId: 'test', command: 'vitest' });
    finishTrace(store, id, 'success', 0);
    const events = filterTraceEvents(store, () => true);
    const closed = events.find((e) => e.id === id);
    expect(closed?.status).toBe('success');
    expect(closed?.exitCode).toBe(0);
  });

  it('getTaskTraces returns only events for the given taskId', () => {
    startTrace(store, { taskId: 'lint', command: 'eslint .' });
    startTrace(store, { taskId: 'build', command: 'tsc' });
    const lintTraces = getTaskTraces(store, 'lint');
    expect(lintTraces).toHaveLength(1);
    expect(lintTraces[0].taskId).toBe('lint');
  });

  it('printTraceSummary prints all events when no taskId given', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    startTrace(store, { taskId: 'deploy', command: 'sh deploy.sh' });
    printTraceSummary(store);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('printTraceSummary prints empty message when no events', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    printTraceSummary(store, 'nonexistent');
    expect(spy).toHaveBeenCalledWith('No trace events found.');
    spy.mockRestore();
  });
});
