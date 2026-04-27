import { describe, it, expect, vi } from "vitest";
import { runTaskFanout, partitionFanoutResults, formatFanoutReport } from "./fanout.integration";
import { Task } from "../schema/task";

function makeTask(id: string): Task {
  return { id, command: `echo ${id}`, dependencies: [] } as unknown as Task;
}

describe("runTaskFanout", () => {
  it("runs all tasks and returns results", async () => {
    const tasks = [makeTask("a"), makeTask("b"), makeTask("c")];
    const runner = vi.fn().mockResolvedValue(undefined);
    const results = await runTaskFanout(tasks, runner, { concurrency: 2 });
    expect(runner).toHaveBeenCalledTimes(3);
    expect(results.map((r) => r.taskId).sort()).toEqual(["a", "b", "c"]);
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
  });

  it("captures errors per task", async () => {
    const tasks = [makeTask("x"), makeTask("y")];
    const runner = vi.fn().mockImplementation(async (t: Task) => {
      if (t.id === "x") throw new Error("task x failed");
    });
    const results = await runTaskFanout(tasks, runner);
    const x = results.find((r) => r.taskId === "x")!;
    const y = results.find((r) => r.taskId === "y")!;
    expect(x.status).toBe("rejected");
    expect(x.error?.message).toBe("task x failed");
    expect(y.status).toBe("fulfilled");
  });
});

describe("partitionFanoutResults", () => {
  it("splits succeeded and failed task ids", () => {
    const results = [
      { taskId: "a", status: "fulfilled" as const },
      { taskId: "b", status: "rejected" as const, error: new Error("e") },
      { taskId: "c", status: "fulfilled" as const },
    ];
    const { succeeded, failed } = partitionFanoutResults(results);
    expect(succeeded).toEqual(["a", "c"]);
    expect(failed).toEqual(["b"]);
  });
});

describe("formatFanoutReport", () => {
  it("formats a human-readable report", () => {
    const results = [
      { taskId: "build", status: "fulfilled" as const },
      { taskId: "lint", status: "rejected" as const, error: new Error("lint failed") },
    ];
    const report = formatFanoutReport(results);
    expect(report).toContain("2 tasks");
    expect(report).toContain("succeeded: build");
    expect(report).toContain("failed:    lint");
  });

  it("shows none when all succeeded", () => {
    const results = [{ taskId: "test", status: "fulfilled" as const }];
    const report = formatFanoutReport(results);
    expect(report).toContain("failed:    none");
  });
});
