import { describe, it, expect, vi } from 'vitest';
import {
  filterReplayEvents,
  buildReplayPlan,
  replayFromLog,
  ReplayOptions,
} from './replay';
import { createAuditLog, recordEvent } from './audit';
import { createContext } from './context';

function makeEvent(taskId: string, type: string, timestamp: string) {
  return { taskId, type, timestamp, meta: {} } as any;
}

describe('filterReplayEvents', () => {
  it('keeps only task:start and task:complete events', () => {
    const events = [
      makeEvent('a', 'task:start', '2024-01-01T00:00:00Z'),
      makeEvent('a', 'task:complete', '2024-01-01T00:01:00Z'),
      makeEvent('b', 'pipeline:start', '2024-01-01T00:00:00Z'),
    ];
    const result = filterReplayEvents(events, {});
    expect(result).toHaveLength(2);
  });

  it('filters by taskFilter list', () => {
    const events = [
      makeEvent('a', 'task:start', '2024-01-01T00:00:00Z'),
      makeEvent('b', 'task:start', '2024-01-01T00:00:00Z'),
    ];
    const result = filterReplayEvents(events, { taskFilter: ['a'] });
    expect(result).toHaveLength(1);
    expect(result[0].taskId).toBe('a');
  });

  it('filters by from/to timestamps', () => {
    const events = [
      makeEvent('a', 'task:start', '2024-01-01T00:00:00Z'),
      makeEvent('b', 'task:start', '2024-01-02T00:00:00Z'),
      makeEvent('c', 'task:start', '2024-01-03T00:00:00Z'),
    ];
    const result = filterReplayEvents(events, {
      from: '2024-01-02T00:00:00Z',
      to: '2024-01-02T23:59:59Z',
    });
    expect(result).toHaveLength(1);
    expect(result[0].taskId).toBe('b');
  });
});

describe('buildReplayPlan', () => {
  it('returns unique task IDs in start order', () => {
    const events = [
      makeEvent('a', 'task:start', '2024-01-01T00:00:00Z'),
      makeEvent('b', 'task:start', '2024-01-01T00:00:01Z'),
      makeEvent('a', 'task:complete', '2024-01-01T00:00:02Z'),
    ];
    expect(buildReplayPlan(events)).toEqual(['a', 'b']);
  });
});

describe('replayFromLog', () => {
  it('executes tasks in plan order', async () => {
    const log = createAuditLog();
    recordEvent(log, makeEvent('a', 'task:start', new Date().toISOString()));
    recordEvent(log, makeEvent('b', 'task:start', new Date().toISOString()));
    const ctx = createContext({});
    const order: string[] = [];
    const executor = vi.fn(async (id: string) => { order.push(id); });
    const result = await replayFromLog(log, ctx, {}, executor);
    expect(result.replayed).toEqual(['a', 'b']);
    expect(order).toEqual(['a', 'b']);
  });

  it('skips execution in dryRun mode', async () => {
    const log = createAuditLog();
    recordEvent(log, makeEvent('x', 'task:start', new Date().toISOString()));
    const ctx = createContext({});
    const executor = vi.fn();
    const result = await replayFromLog(log, ctx, { dryRun: true }, executor);
    expect(result.skipped).toEqual(['x']);
    expect(executor).not.toHaveBeenCalled();
  });

  it('records errors without throwing', async () => {
    const log = createAuditLog();
    recordEvent(log, makeEvent('fail', 'task:start', new Date().toISOString()));
    const ctx = createContext({});
    const executor = vi.fn(async () => { throw new Error('oops'); });
    const result = await replayFromLog(log, ctx, {}, executor);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].taskId).toBe('fail');
  });
});
