import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import type { AuditLog } from "../runner/audit";
import { summarizeAuditLog, filterEvents } from "../runner/audit";

function printAuditLog(log: AuditLog, verbose: boolean): void {
  console.log(`Run ID : ${log.runId}`);
  console.log(`Started: ${new Date(log.startedAt).toISOString()}`);
  console.log(`Events : ${log.events.length}\n`);

  const summary = summarizeAuditLog(log);
  for (const [type, count] of Object.entries(summary)) {
    console.log(`  ${type.padEnd(20)} ${count}`);
  }

  if (verbose) {
    console.log("\nDetailed events:");
    for (const ev of log.events) {
      const ts = new Date(ev.timestamp).toISOString();
      const dur = ev.durationMs !== undefined ? ` (${ev.durationMs}ms)` : "";
      const err = ev.error ? ` — ${ev.error}` : "";
      console.log(`  [${ts}] ${ev.type.padEnd(16)} ${ev.taskName}${dur}${err}`);
    }
  }

  const failures = filterEvents(log, "task:failure");
  if (failures.length > 0) {
    console.log(`\nFailed tasks (${failures.length}):`);
    for (const f of failures) {
      console.log(`  - ${f.taskName}${f.error ? ": " + f.error : ""}`);
    }
  }
}

/**
 * Validates that a parsed object has the minimum shape required to be an AuditLog.
 * Catches cases where the file exists but contains unrelated JSON.
 */
function isValidAuditLog(value: unknown): value is AuditLog {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj["runId"] === "string" &&
    typeof obj["startedAt"] === "number" &&
    Array.isArray(obj["events"])
  );
}

export function runAuditCmd(args: string[]): void {
  const verbose = args.includes("--verbose") || args.includes("-v");
  const fileArg = args.find((a) => !a.startsWith("-"));
  const filePath = resolve(fileArg ?? "taskweave-audit.json");

  if (!existsSync(filePath)) {
    console.error(`Audit file not found: ${filePath}`);
    process.exit(1);
  }

  let log: AuditLog;
  try {
    const parsed: unknown = JSON.parse(readFileSync(filePath, "utf-8"));
    if (!isValidAuditLog(parsed)) {
      console.error("Audit file does not contain a valid audit log.");
      process.exit(1);
    }
    log = parsed;
  } catch {
    console.error("Failed to parse audit file.");
    process.exit(1);
  }

  printAuditLog(log, verbose);
}
