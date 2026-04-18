import { createWatcher, matchesGlob, WatchEvent, WatchOptions } from './watch';
import { createLogger, log } from './logger';

export interface TaskWatchConfig {
  watchPaths: string[];
  triggerPatterns: string[];
  ignored?: RegExp;
  debounceMs?: number;
  onTrigger: (event: WatchEvent) => Promise<void>;
}

export function buildTaskWatcher(config: TaskWatchConfig) {
  const logger = createLogger({ verbose: false });

  const options: WatchOptions = {
    paths: config.watchPaths,
    debounceMs: config.debounceMs ?? 300,
    ignored: config.ignored ?? /node_modules/,
  };

  const watcher = createWatcher(options);

  watcher.emitter.on('change', async (event: WatchEvent) => {
    if (!matchesGlob(event.filePath, config.triggerPatterns)) return;

    log(logger, 'info', `[watch] ${event.type}: ${event.filePath}`);

    try {
      await config.onTrigger(event);
    } catch (err) {
      log(logger, 'error', `[watch] trigger failed: ${(err as Error).message}`);
    }
  });

  return {
    stop: () => {
      log(logger, 'info', '[watch] stopping file watcher');
      watcher.stop();
    },
  };
}

export function defaultIgnorePattern(): RegExp {
  return /(\.git|node_modules|\.taskweave_cache)/;
}
