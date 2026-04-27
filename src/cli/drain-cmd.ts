import type { Command } from "commander";
import { buildTaskDrainQueue, scheduleForDrain, runTaskDrain } from "../runner/drain.integration";
import { createLogger, log } from "../runner/logger";

export function registerDrainCmd(program: Command): void {
  program
    .command("drain")
    .description("drain all pending tasks from the internal task queue")
    .option("--max-wait <ms>", "maximum wait time in milliseconds", "5000")
    .option("--interval <ms>", "polling interval in milliseconds", "50")
    .option("--dry-run", "list tasks without executing them", false)
    .action(async (opts) => {
      const logger = createLogger("drain-cmd");
      const maxWaitMs = parseInt(opts.maxWait, 10);
      const intervalMs = parseInt(opts.interval, 10);
      const dryRun: boolean = opts.dryRun;

      const queue = buildTaskDrainQueue();

      // In a real integration this queue would be loaded from persisted state.
      // Here we demonstrate the wiring with a placeholder entry.
      scheduleForDrain(queue, "example-task", { input: "demo" });

      if (dryRun) {
        log(logger, "info", "dry-run: skipping actual drain execution");
        return;
      }

      await runTaskDrain(
        queue,
        async (entry) => {
          log(logger, "info", `executed task ${entry.taskId}`);
        },
        { maxWaitMs, intervalMs }
      );
    });
}
