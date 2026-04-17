import { z } from 'zod';

export const CliArgsSchema = z.object({
  file: z.string().default('taskweave.yml'),
  task: z.string().optional(),
  vars: z.record(z.string()).default({}),
  dryRun: z.boolean().default(false),
  verbose: z.boolean().default(false),
});

export type CliArgs = z.infer<typeof CliArgsSchema>;

export function parseArgs(argv: string[]): CliArgs {
  const args: Record<string, unknown> = {
    vars: {},
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--file' || arg === '-f') {
      args.file = argv[++i];
    } else if (arg === '--task' || arg === '-t') {
      args.task = argv[++i];
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--verbose' || arg === '-v') {
      args.verbose = true;
    } else if (arg.startsWith('--var=')) {
      const [key, value] = arg.slice(6).split('=');
      (args.vars as Record<string, string>)[key] = value ?? '';
    } else if (!arg.startsWith('-') && !args.task) {
      args.task = arg;
    }
  }

  return CliArgsSchema.parse(args);
}
