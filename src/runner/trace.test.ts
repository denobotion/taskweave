import { describe, it, expect } from 'vitest';
import {
  createTraceStore,
  recordTrace,
  closeTrace,
  filterTraceEvents,
  formatTraceLine,
} from './trace';

describe('createTraceStore', () => {
  it('creates a store with a traceId and empty events', () => {
    const store = createTraceStore();
    expect(store.traceId).toBeTruthy();
    expect(store.events).toHaveLength(0);
  });
});

describe('recordTrace', () => {
  it('appends an event to the store', () => {
    const store = createTraceStore();
    const event = recordTrace(store, 'task:start', 'build');
    expect(store.events).toHaveLength(1);
    expect(event.kind).toBe('task:start');
    expect(event.taskId).toBe('build');
    expect(event.traceId).toBe(store.traceId);
  });

  it('includes meta when provided', () => {
    const store = createTraceStore();
    const event = recordTrace(store, 'pipeline:start', undefined, { env: 'ci' });
    expect(event.meta).toEqual({ env: 'ci' });
  });
});

describe('closeTrace', () => {
  it('records an end event with durationMs', () => {
    const store = createTraceStore();
    const open = recordTrace(store, 'task:start', 'lint');
    const close = closeTrace(store, open);
    expect(close.kind).toBe('task:end');
    expect(close.taskId).toBe('lint');
    expect(typeof close.durationMs).toBe('number');
    expect(store.events).toHaveLength(2);
  });
});

describe('filterTraceEvents', () => {
  it('returns only events matching the kind', () => {
    const store = createTraceStore();
    recordTrace(store, 'task:start', 'a');
    recordTrace(store, 'task:error', 'b');
    recordTrace(store, 'task:start', 'c');
    const starts = filterTraceEvents(store, 'task:start');
    expect(starts).toHaveLength(2);
    expect(starts.every((e) => e.kind === 'task:start')).toBe(true);
  });
});

describe('formatTraceLine', () => {
  it('formats a trace event as a readable string', () => {
    const store = createTraceStore();
    const event = recordTrace(store, 'task:start', 'deploy');
    const line = formatTraceLine(event);
    expect(line).toContain('[task:start]');
    expect(line).toContain('task=deploy');
  });

  it('includes duration when present', () => {
    const store = createTraceStore();
    const open = recordTrace(store, 'task:start', 'test');
    const close = closeTrace(store, open);
    const line = formatTraceLine(close);
    expect(line).toContain('duration=');
  });
});
