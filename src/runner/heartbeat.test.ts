import {
  createHeartbeatStore,
  registerHeartbeat,
  recordBeat,
  evaluateHeartbeats,
  removeHeartbeat,
  formatHeartbeatLine,
} from './heartbeat';

function advanceTime(ms: number) {
  const original = Date.now;
  const base = original();
  jest.spyOn(Date, 'now').mockReturnValue(base + ms);
}

afterEach(() => jest.restoreAllMocks());

describe('createHeartbeatStore', () => {
  it('creates store with defaults', () => {
    const store = createHeartbeatStore();
    expect(store.stalledThreshold).toBe(2);
    expect(store.deadThreshold).toBe(5);
    expect(store.entries.size).toBe(0);
  });

  it('accepts custom thresholds', () => {
    const store = createHeartbeatStore(3, 7);
    expect(store.stalledThreshold).toBe(3);
    expect(store.deadThreshold).toBe(7);
  });
});

describe('registerHeartbeat', () => {
  it('registers a task', () => {
    const store = createHeartbeatStore();
    registerHeartbeat(store, 'build', 1000);
    expect(store.entries.has('build')).toBe(true);
    expect(store.entries.get('build')?.status).toBe('alive');
  });
});

describe('recordBeat', () => {
  it('returns false for unknown task', () => {
    const store = createHeartbeatStore();
    expect(recordBeat(store, 'unknown')).toBe(false);
  });

  it('resets missed beats and status', () => {
    const store = createHeartbeatStore();
    registerHeartbeat(store, 'task', 500);
    const entry = store.entries.get('task')!;
    entry.missedBeats = 3;
    entry.status = 'stalled';
    expect(recordBeat(store, 'task')).toBe(true);
    expect(entry.missedBeats).toBe(0);
    expect(entry.status).toBe('alive');
  });
});

describe('evaluateHeartbeats', () => {
  it('marks stalled tasks', () => {
    const store = createHeartbeatStore(2, 5);
    registerHeartbeat(store, 'slow', 100);
    advanceTime(250);
    const stalled = evaluateHeartbeats(store);
    expect(stalled.length).toBe(1);
    expect(stalled[0].status).toBe('stalled');
  });

  it('marks dead tasks', () => {
    const store = createHeartbeatStore(2, 5);
    registerHeartbeat(store, 'dead-task', 100);
    advanceTime(600);
    const stalled = evaluateHeartbeats(store);
    expect(stalled[0].status).toBe('dead');
  });

  it('skips already dead tasks', () => {
    const store = createHeartbeatStore(2, 5);
    registerHeartbeat(store, 'gone', 100);
    store.entries.get('gone')!.status = 'dead';
    advanceTime(600);
    const stalled = evaluateHeartbeats(store);
    expect(stalled.length).toBe(0);
  });
});

describe('removeHeartbeat', () => {
  it('removes a registered task', () => {
    const store = createHeartbeatStore();
    registerHeartbeat(store, 'x', 200);
    expect(removeHeartbeat(store, 'x')).toBe(true);
    expect(store.entries.has('x')).toBe(false);
  });

  it('returns false for unknown task', () => {
    const store = createHeartbeatStore();
    expect(removeHeartbeat(store, 'nope')).toBe(false);
  });
});

describe('formatHeartbeatLine', () => {
  it('formats a heartbeat entry', () => {
    const store = createHeartbeatStore();
    registerHeartbeat(store, 'lint', 1000);
    const entry = store.entries.get('lint')!;
    entry.status = 'stalled';
    entry.missedBeats = 3;
    const line = formatHeartbeatLine(entry);
    expect(line).toContain('task=lint');
    expect(line).toContain('status=stalled');
    expect(line).toContain('missed=3');
    expect(line).toContain('interval=1000ms');
  });
});
