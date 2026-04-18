import { loadTaskFile } from './load';
import { parseArgs } from './parse';
import { buildTaskWatcher, defaultIgnorePattern } from '../runner/watch.integration';
import { runPipeline } from '../runner/run';
import { createLogger, log } from '../runner/logger';

export async function runWatchCommand(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const taskFile = await loadTaskFile(args.file ?? 'taskweave.yml');
  const logger = createLogger({ verbose: args.verbose ?? false });

  const watchPaths = args.watch ?? ['.'];
  const patterns = args.pattern ?? ['**/*'];

  log(logger, 'info', `[watch] watching ${watchPaths.join(', ')} for patterns: ${patterns.join(', ')}`);

  let running = false;

  const { stop } = buildTaskWatcher({
    watchPaths,
    triggerPatterns: patterns,
    ignored: defaultIgnorePattern(),
    debounceMs: 400,
    onTrigger: async (event) => {
      if (running) {
        log(logger, 'info', '[watch] run already in progress, skipping');
        return;
      }
      running = true;
      log(logger, 'info', `[watch] triggered by ${event.filePath}, running tasks...`);
      try {
        await runPipeline(taskFile, args, logger);
      } finally {
        running = false;
      }
    },
  });

  process.on('SIGINT', () => {
    log(logger, 'info', '[watch] received SIGINT, stopping');
    stop();
    process.exit(0);
  });

  // Keep process alive
  await new Promise<void>(() => {});
}
