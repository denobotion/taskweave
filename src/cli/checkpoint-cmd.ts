import { Command } from "commander";
import { loadCheckpoint, clearCheckpoint } from "../runner/checkpoint";
import { formatCheckpointLine } from "../runner/checkpoint.integration";

const DEFAULT_DIR = ".taskweave";

export function registerCheckpointCmd(program: Command): void {
  const cmd = program
    .command("checkpoint")
    .description("Inspect or manage run checkpoints");

  cmd
    .command("show <runId>")
    .description("Print all checkpointed tasks for a run")
    .option("--dir <dir>", "Checkpoint directory", DEFAULT_DIR)
    .action((runId: string, opts: { dir: string }) => {
      const store = loadCheckpoint(opts.dir, runId);
      if (!store) {
        console.error(`No checkpoint found for run: ${runId}`);
        process.exit(1);
      }
      const entries = Object.values(store.entries);
      if (entries.length === 0) {
        console.log("No tasks recorded in this checkpoint.");
        return;
      }
      entries
        .sort((a, b) => a.timestamp - b.timestamp)
        .forEach((e) =>
          console.log(formatCheckpointLine(e.taskId, e.status, e.timestamp))
        );
    });

  cmd
    .command("clear <runId>")
    .description("Delete checkpoint file for a run")
    .option("--dir <dir>", "Checkpoint directory", DEFAULT_DIR)
    .action((runId: string, opts: { dir: string }) => {
      clearCheckpoint(opts.dir, runId);
      console.log(`Checkpoint cleared for run: ${runId}`);
    });

  cmd
    .command("list")
    .description("List available checkpoint run IDs")
    .option("--dir <dir>", "Checkpoint directory", DEFAULT_DIR)
    .action((opts: { dir: string }) => {
      const fs = require("fs") as typeof import("fs");
      if (!fs.existsSync(opts.dir)) {
        console.log("No checkpoint directory found.");
        return;
      }
      const files = fs.readdirSync(opts.dir).filter((f: string) =>
        f.startsWith(".taskweave-checkpoint-")
      );
      if (files.length === 0) {
        console.log("No checkpoints found.");
        return;
      }
      files.forEach((f: string) => {
        const runId = f.replace(".taskweave-checkpoint-", "").replace(".json", "");
        console.log(runId);
      });
    });
}
