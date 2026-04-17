import { parseArgs } from './parse';
import { loadTaskFile } from './load';
import { runPipeline } from '../runner/run';
import { createContext } from '../runner/context';

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
  let args;
  try {
    args = parseArgs(argv);
  } catch (err) {
    console.error('Invalid arguments:', (err as Error).message);
    process.exit(1);
  }

  let loadResult;
  try {
    loadResult = loadTaskFile(args.file);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }

  const { tasks } = loadResult;
  const filteredTasks = args.task
    ? tasks.filter((t) => t.id === args.task)
    : tasks;

  if (filteredTasks.length === 0) {
    console.error(`No tasks found${args.task ? ` with id "${args.task}"` : ''}`);
    process.exit(1);
  }

  const context = createContext(args.vars);

  if (args.verbose) {
    console.log(`Running ${filteredTasks.length} task(s) from ${loadResult.filePath}`);
  }

  try {
    await runPipeline(filteredTasks, context, { dryRun: args.dryRun, verbose: args.verbose });
  } catch (err) {
    console.error('Pipeline failed:', (err as Error).message);
    process.exit(1);
  }
}
