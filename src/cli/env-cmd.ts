import { loadTaskFile } from "./load";
import { buildTaskEnv, resolveTaskCommand } from "../runner/env.integration";

export async function runEnvDebug(
  taskFile: string,
  taskName: string,
  opts: { showSecrets?: boolean } = {}
): Promise<void> {
  const tasks = await loadTaskFile(taskFile);
  const task = tasks.find((t) => t.name === taskName);

  if (!task) {
    console.error(`Task "${taskName}" not found.`);
    process.exit(1);
  }

  const envCtx = buildTaskEnv(task);
  const vars = envCtx.forProcess();

  console.log(`\nEnvironment for task: ${task.name}`);
  console.log("─".repeat(40));

  for (const [key, value] of Object.entries(vars)) {
    const display = !opts.showSecrets
      ? envCtx.sanitize(value)
      : value;
    console.log(`  ${key}=${display}`);
  }

  if (task.steps.length > 0) {
    console.log("\nResolved step commands:");
    console.log("─".repeat(40));
    for (const step of task.steps) {
      const resolved = resolveTaskCommand(step.run, envCtx);
      const sanitized = envCtx.sanitize(resolved);
      console.log(`  [${step.name}] ${sanitized}`);
    }
  }
}
