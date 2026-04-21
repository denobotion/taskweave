import { CheckpointStore, createCheckpointStore, isTaskCheckpointed, loadCheckpoint, recordCheckpoint, saveCheckpoint } from "./checkpoint";

export interface CheckpointOptions {
  dir: string;
  runId: string;
  resume: boolean;
}

export function initCheckpoint(opts: CheckpointOptions): CheckpointStore {
  if (opts.resume) {
    const existing = loadCheckpoint(opts.dir, opts.runId);
    if (existing) return existing;
  }
  return createCheckpointStore(opts.runId);
}

export function shouldResumeTask(
  store: CheckpointStore,
  taskId: string
): boolean {
  return isTaskCheckpointed(store, taskId);
}

export function commitCheckpoint(
  store: CheckpointStore,
  taskId: string,
  status: "completed" | "failed" | "skipped",
  dir: string,
  output?: string
): CheckpointStore {
  const updated = recordCheckpoint(store, taskId, status, output);
  saveCheckpoint(updated, dir);
  return updated;
}

export function formatCheckpointLine(taskId: string, status: string, timestamp: number): string {
  const date = new Date(timestamp).toISOString();
  const icon = status === "completed" ? "✔" : status === "skipped" ? "⏭" : "✖";
  return `${icon} [${date}] ${taskId} — ${status}`;
}
