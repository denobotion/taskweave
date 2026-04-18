import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

export interface WatchOptions {
  paths: string[];
  debounceMs?: number;
  ignored?: RegExp;
}

export interface WatchEvent {
  type: 'change' | 'add' | 'unlink';
  filePath: string;
  timestamp: number;
}

export interface FileWatcher {
  emitter: EventEmitter;
  stop: () => void;
}

export function createWatcher(options: WatchOptions): FileWatcher {
  const { paths, debounceMs = 300, ignored } = options;
  const emitter = new EventEmitter();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const watchers: fs.FSWatcher[] = [];

  const emit = (type: WatchEvent['type'], filePath: string) => {
    const abs = path.resolve(filePath);
    if (ignored && ignored.test(abs)) return;
    const key = `${type}:${abs}`;
    if (timers.has(key)) clearTimeout(timers.get(key)!);
    timers.set(key, setTimeout(() => {
      timers.delete(key);
      emitter.emit('change', { type, filePath: abs, timestamp: Date.now() } as WatchEvent);
    }, debounceMs));
  };

  for (const watchPath of paths) {
    try {
      const watcher = fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
        if (!filename) return;
        const full = path.join(watchPath, filename);
        const type = eventType === 'rename'
          ? (fs.existsSync(full) ? 'add' : 'unlink')
          : 'change';
        emit(type, full);
      });
      watchers.push(watcher);
    } catch {
      // path may not exist yet
    }
  }

  return {
    emitter,
    stop: () => {
      watchers.forEach(w => w.close());
      timers.forEach(t => clearTimeout(t));
      timers.clear();
    },
  };
}

export function matchesGlob(filePath: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    const regex = new RegExp(
      '^' + pattern.replace(/\./g, '\\.').replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*') + '$'
    );
    return regex.test(filePath);
  });
}
