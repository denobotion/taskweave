import { createHash } from "crypto";

export type OutputFormat = "text" | "json" | "silent";

export interface TaskOutput {
  taskId: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
}

export interface FormattedOutput {
  raw: string;
  parsed?: unknown;
  truncated: boolean;
}

const MAX_OUTPUT_BYTES = 1024 * 512; // 512KB

export function formatOutput(
  output: TaskOutput,
  format: OutputFormat
): FormattedOutput {
  if (format === "silent") {
    return { raw: "", truncated: false };
  }

  const raw = output.stdout.trimEnd();
  const truncated = Buffer.byteLength(raw) > MAX_OUTPUT_BYTES;
  const trimmed = truncated
    ? raw.slice(0, MAX_OUTPUT_BYTES) + "\n[output truncated]"
    : raw;

  if (format === "json") {
    try {
      const parsed = JSON.parse(trimmed);
      return { raw: trimmed, parsed, truncated };
    } catch {
      return { raw: trimmed, truncated };
    }
  }

  return { raw: trimmed, truncated };
}

export function summarizeOutput(output: TaskOutput): string {
  const status = output.exitCode === 0 ? "✓" : "✗";
  const duration = `${output.durationMs}ms`;
  const lines = output.stdout.trim().split("\n").length;
  return `${status} [${output.taskId}] exited ${output.exitCode} in ${duration} (${lines} lines)`;
}

export function fingerprintOutput(output: TaskOutput): string {
  return createHash("sha1")
    .update(output.stdout)
    .update(String(output.exitCode))
    .digest("hex")
    .slice(0, 12);
}
