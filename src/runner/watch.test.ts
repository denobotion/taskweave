import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import { createWatcher, matchesGlob } from './watch';

vi.mock('fs');

describe('matchesGlob', () => {
  it('matches exact file', () => {
    expect(matchesGlob('src/index.ts', ['src/index.ts'])).toBe(true);
  });

  it('matches wildcard', () => {
    expect(matchesGlob('src/foo.ts', ['src/*.ts'])).toBe(true);
  });

  it('matches double wildcard', () => {
    expect(matchesGlob('src/a/b/c.ts', ['src/**/*.ts'])).toBe(true);
  });

  it('does not match unrelated', () => {
    expect(matchesGlob('lib/foo.js', ['src/*.ts'])).toBe(false);
  });
});

describe('createWatcher', () => {
  let mockWatcher: { close: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockWatcher = { close: vi.fn() };
    vi.mocked(fs.watch).mockReturnValue(mockWatcher as unknown as fs.FSWatcher);
    vi.mocked(fs.existsSync).mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('creates a watcher and returns stop function', () => {
    const { stop } = createWatcher({ paths: ['/tmp/test'] });
    expect(fs.watch).toHaveBeenCalledWith('/tmp/test', { recursive: true }, expect.any(Function));
    stop();
    expect(mockWatcher.close).toHaveBeenCalled();
  });

  it('emits change events with debounce', async () => {
    vi.useFakeTimers();
    let watchCallback: Function = () => {};
    vi.mocked(fs.watch).mockImplementation((_p, _o, cb) => {
      watchCallback = cb as Function;
      return mockWatcher as unknown as fs.FSWatcher;
    });

    const { emitter, stop } = createWatcher({ paths: ['/tmp'], debounceMs: 100 });
    const handler = vi.fn();
    emitter.on('change', handler);

    watchCallback('change', 'file.ts');
    expect(handler).not.toHaveBeenCalled();
    vi.advanceTimersByTime(150);
    expect(handler).toHaveBeenCalledOnce();

    stop();
    vi.useRealTimers();
  });

  it('ignores paths matching ignored pattern', async () => {
    vi.useFakeTimers();
    let watchCallback: Function = () => {};
    vi.mocked(fs.watch).mockImplementation((_p, _o, cb) => {
      watchCallback = cb as Function;
      return mockWatcher as unknown as fs.FSWatcher;
    });

    const { emitter, stop } = createWatcher({ paths: ['/tmp'], ignored: /node_modules/, debounceMs: 50 });
    const handler = vi.fn();
    emitter.on('change', handler);

    watchCallback('change', 'node_modules/pkg/index.js');
    vi.advanceTimersByTime(100);
    expect(handler).not.toHaveBeenCalled();

    stop();
    vi.useRealTimers();
  });
});
