import { describe, it, expect } from "vitest";
import { executeCommand, runTask } from "./executor";
import { Task } from "../schema/task";

describe("executeCommand", () => {
  it("captures stdout and exit code 0", async () => {
    const result = await executeCommand("echo hello");
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("hello");
    expect(result.stderr).toBe("");
  });

  it("captures stderr", async () => {
    const result = await executeCommand("echo error >&2");
    expect(result.stderr).toBe("error");
  });

  it("returns non-zero exit code", async () => {
    const result = await executeCommand("exit 42");
    expect(result.exitCode).toBe(42);
  });

  it("injects env variables", async () => {
    const result = await executeCommand("echo $MY_VAR", { MY_VAR: "injected" });
    expect(result.stdout).toBe("injected");
  });

  it("records a positive durationMs", async () => {
    const result = await executeCommand("true");
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});

describe("runTask", () => {
  const baseTask: Task = {
    name: "greet",
    command: "echo Hello ${name}",
  };

  it("interpolates inputs into the command", async () => {
    const result = await runTask(baseTask, { name: "World" });
    expect(result.stdout).toBe("Hello World");
  });

  it("replaces missing inputs with empty string", async () => {
    const result = await runTask(baseTask, {});
    expect(result.stdout).toBe("Hello");
  });

  it("throws when exit code matches failOn", async () => {
    const task: Task = { name: "fail", command: "exit 1", failOn: 1 };
    await expect(runTask(task)).rejects.toThrow('Task "fail" failed');
  });

  it("does not throw when exit code differs from failOn", async () => {
    const task: Task = { name: "ok", command: "exit 2", failOn: 1 };
    const result = await runTask(task);
    expect(result.exitCode).toBe(2);
  });
});
