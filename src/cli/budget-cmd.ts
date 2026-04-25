import { Command } from "commander";
import { loadTaskFile } from "./load";
import { buildBudgetStore, formatBudgetLine } from "../runner/budget.integration";
import { summarizeBudget } from "../runner/budget";

export function registerBudgetCmd(program: Command): void {
  program
    .command("budget")
    .description("Show task time budget configuration and any recorded violations")
    .argument("[file]", "Task file to load", "taskweave.yml")
    .option("--violations-only", "Only show tasks with violations", false)
    .action(async (file: string, opts: { violationsOnly: boolean }) => {
      const result = loadTaskFile(file);
      if (!result.success) {
        console.error(`Failed to load task file: ${result.error}`);
        process.exit(1);
      }

      const tasks = result.data.tasks;
      const store = buildBudgetStore(tasks);

      if (store.entries.size === 0) {
        console.log("No budgets configured.");
        return;
      }

      if (!opts.violationsOnly) {
        console.log("Configured budgets:");
        for (const [id, entry] of store.entries) {
          const warn = entry.warnMs ? `, warn: ${entry.warnMs}ms` : "";
          console.log(`  ${id}: limit ${entry.limitMs}ms${warn}`);
        }
      }

      if (store.violations.length > 0) {
        console.log("\nViolations:");
        for (const v of store.violations) {
          console.log(" ", formatBudgetLine(v));
        }
      } else if (opts.violationsOnly) {
        console.log("No violations recorded.");
      } else {
        console.log("\n" + summarizeBudget(store));
      }
    });
}
