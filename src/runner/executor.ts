import { spawn } from "child_process";
import { Task } from "../schema/task";

export interface ExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export function executeCommand(
  command: string,
  env: Record<string, string> = {}
): Promise<ExecutionResult> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    const proc = spawn("sh", ["-c", command], {
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    proc.stdout.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
    proc.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk));

    proc.on("error", reject);

    proc.on("close", (code) => {
      resolve({
        exitCode: code ?? 1,
        stdout: Buffer.concat(stdoutChunks).toString("utf8").trim(),
        stderr: Buffer.concat(stderrChunks).toString("utf8").trim(),
        durationMs: Date.now() - start,
      });
    });
  });
}

export async function runTask(
  task: Task,
  inputs: Record<string, string> = {}
): Promise<ExecutionResult> {
  const resolvedCommand = task.command.replace(
    /\$\{(\w+)\}/g,
    (_, key) => inputs[key] ?? ""
  );

  const result = await executeCommand(resolvedCommand, inputs);

  if (task.failOn !== undefined && result.exitCode === task.failOn) {
    throw new Error(
      `Task "${task.name}" failed with exit code ${result.exitCode}\n${result.stderr}`
    );
  }

  return result;
}
