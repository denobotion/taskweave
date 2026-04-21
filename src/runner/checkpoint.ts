import * as fs from "fs";
import * as path from "path";
import { createHash } from "crypto";

export interface CheckpointEntry {
  taskId: string;
  status: "completed" | "failed" | "skipped";
  timestamp: number;
  outputHash?: string;
}

export interface CheckpointStore {
  runId: string;
  entries: Record<string, CheckpointEntry>;
}

export function createCheckpointStore(runId: string): CheckpointStore {
  return { runId, entries: {} };
}

export function checkpointPath(dir: string, runId: string): string {
  return path.join(dir, `.taskweave-checkpoint-${runId}.json`);
}

export function saveCheckpoint(store: CheckpointStore, dir: string): void {
  const filePath = checkpointPath(dir, store.runId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
}

export function loadCheckpoint(dir: string, runId: string): CheckpointStore | null {
  const filePath = checkpointPath(dir, runId);
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as CheckpointStore;
  } catch {
    return null;
  }
}

export function recordCheckpoint(
  store: CheckpointStore,
  taskId: string,
  status: CheckpointEntry["status"],
  output?: string
): CheckpointStore {
  const outputHash = output
    ? createHash("sha256").update(output).digest("hex").slice(0, 12)
    : undefined;
  return {
    ...store,
    entries: {
      ...store.entries,
      [taskId]: { taskId, status, timestamp: Date.now(), outputHash },
    },
  };
}

export function isTaskCheckpointed(
  store: CheckpointStore,
  taskId: string
): boolean {
  return store.entries[taskId]?.status === "completed";
}

export function clearCheckpoint(dir: string, runId: string): void {
  const filePath = checkpointPath(dir, runId);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}
