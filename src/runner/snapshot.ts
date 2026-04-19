import { createHash } from "crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

export interface Snapshot {
  taskId: string;
  timestamp: number;
  outputHash: string;
  inputs: Record<string, string>;
}

export interface SnapshotStore {
  dir: string;
}

export function createSnapshotStore(dir = ".taskweave/snapshots"): SnapshotStore {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return { dir };
}

export function snapshotPath(store: SnapshotStore, taskId: string): string {
  return join(store.dir, `${taskId}.json`);
}

export function saveSnapshot(store: SnapshotStore, snapshot: Snapshot): void {
  writeFileSync(snapshotPath(store, snapshot.taskId), JSON.stringify(snapshot, null, 2));
}

export function loadSnapshot(store: SnapshotStore, taskId: string): Snapshot | null {
  const p = snapshotPath(store, taskId);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf-8")) as Snapshot;
  } catch {
    return null;
  }
}

export function hashOutput(output: string): string {
  return createHash("sha256").update(output).digest("hex").slice(0, 16);
}

export function hasOutputChanged(store: SnapshotStore, taskId: string, output: string): boolean {
  const snap = loadSnapshot(store, taskId);
  if (!snap) return true;
  return snap.outputHash !== hashOutput(output);
}

export function makeSnapshot(taskId: string, output: string, inputs: Record<string, string> = {}): Snapshot {
  return { taskId, timestamp: Date.now(), outputHash: hashOutput(output), inputs };
}
