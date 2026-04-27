import { fanout, formatFanoutSummary, FanoutOptions } from "./fanout";
import { createLogger, log } from "./logger";
import { Task } from "../schema/task";

export type TaskFanoutResult = {
  taskId: string;
  status: "fulfilled" | "rejected";
  error?: Error;
};

export async function runTaskFanout(
  tasks: Task[],
  runner: (task: Task) => Promise<void>,
  options: Partial<FanoutOptions> = {}
): Promise<TaskFanoutResult[]> {
  const logger = createLogger({ level: "info", prefix: "fanout" });

  const summary = await fanout(
    tasks,
    async (task) => {
      log(logger, "info", `starting task: ${task.id}`);
      await runner(task);
      log(logger, "info", `finished task: ${task.id}`);
    },
    options
  );

  log(logger, "info", formatFanoutSummary(summary));

  return summary.results.map((r) => ({
    taskId: (r.value as Task).id,
    status: r.status,
    error: r.error,
  }));
}

export function partitionFanoutResults(results: TaskFanoutResult[]): {
  succeeded: string[];
  failed: string[];
} {
  const succeeded = results.filter((r) => r.status === "fulfilled").map((r) => r.taskId);
  const failed = results.filter((r) => r.status === "rejected").map((r) => r.taskId);
  return { succeeded, failed };
}

export function formatFanoutReport(results: TaskFanoutResult[]): string {
  const { succeeded, failed } = partitionFanoutResults(results);
  const lines: string[] = [
    `fanout report: ${results.length} tasks`,
    `  succeeded: ${succeeded.join(", ") || "none"}`,
    `  failed:    ${failed.join(", ") || "none"}`,
  ];
  return lines.join("\n");
}
