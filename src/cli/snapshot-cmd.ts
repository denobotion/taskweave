import { loadSnapshot, createSnapshotStore } from "../runner/snapshot";
import { formatSnapshotLine } from "../runner/snapshot.integration";
import { parseArgs } from "./parse";

export function runSnapshotCmd(argv: string[]): void {
  const { flags, positional } = parseArgs(argv);
  const dir = typeof flags["dir"] === "string" ? flags["dir"] : ".taskweave/snapshots";
  const store = createSnapshotStore(dir);

  if (positional.length === 0) {
    console.error("Usage: taskweave snapshot <taskId> [--dir=<path>]");
    process.exit(1);
  }

  const taskId = positional[0];
  const snap = loadSnapshot(store, taskId);

  if (!snap) {
    console.log(`No snapshot found for task "${taskId}"`);
    return;
  }

  console.log(formatSnapshotLine(snap.taskId, snap.outputHash, snap.timestamp));

  if (Object.keys(snap.inputs).length > 0) {
    console.log("Inputs:");
    for (const [k, v] of Object.entries(snap.inputs)) {
      console.log(`  ${k}=${v}`);
    }
  }
}
