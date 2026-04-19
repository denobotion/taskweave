import { createHash } from "crypto";

export interface DiffResult {
  changed: boolean;
  added: string[];
  removed: string[];
  summary: string;
}

export function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

export function diffLines(prev: string, next: string): DiffResult {
  const prevLines = prev.split("\n").filter(Boolean);
  const nextLines = next.split("\n").filter(Boolean);

  const prevSet = new Set(prevLines);
  const nextSet = new Set(nextLines);

  const added = nextLines.filter((l) => !prevSet.has(l));
  const removed = prevLines.filter((l) => !nextSet.has(l));
  const changed = added.length > 0 || removed.length > 0;

  const summary = changed
    ? `+${added.length} -${removed.length} lines changed`
    : "no changes";

  return { changed, added, removed, summary };
}

export function diffOutputs(
  prevOutput: string | undefined,
  nextOutput: string
): DiffResult {
  if (prevOutput === undefined) {
    const lines = nextOutput.split("\n").filter(Boolean);
    return {
      changed: true,
      added: lines,
      removed: [],
      summary: `+${lines.length} lines (new output)`,
    };
  }
  return diffLines(prevOutput, nextOutput);
}

export function formatDiff(result: DiffResult): string {
  const lines: string[] = [];
  for (const line of result.added) lines.push(`+ ${line}`);
  for (const line of result.removed) lines.push(`- ${line}`);
  return lines.join("\n");
}
