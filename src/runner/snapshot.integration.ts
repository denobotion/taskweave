import { createSnapshotStore, hasOutputChanged, makeSnapshot, saveSnapshot, SnapshotStore } from "./snapshot";
import { Logger } from "./logger";

export interface SnapshotOptions {
  dir?: string;
  logger?: Logger;
}

export function buildSnapshotStore(opts: SnapshotOptions = {}): SnapshotStore {
  return createSnapshotStore(opts.dir ?? ".taskweave/snapshots");
}

export function checkAndUpdateSnapshot(
  store: SnapshotStore,
  taskId: string,
  output: string,
  inputs: Record<string, string> = {},
  logger?: Logger
): { changed: boolean } {
  const changed = hasOutputChanged(store, taskId, output);
  if (changed) {
    const snap = makeSnapshot(taskId, output, inputs);
    saveSnapshot(store, snap);
    logger?.({ level: "info", message: `[snapshot] updated snapshot for task "${taskId}"`, timestamp: Date.now() });
  } else {
    logger?.({ level: "debug", message: `[snapshot] no change for task "${taskId}"`, timestamp: Date.now() });
  }
  return { changed };
}

export function formatSnapshotLine(taskId: string, hash: string, timestamp: number): string {
  const date = new Date(timestamp).toISOString();
  return `${taskId}  hash=${hash}  at=${date}`;
}
