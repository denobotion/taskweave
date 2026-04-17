import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parse as parseYaml } from 'yaml';
import { validateTask } from '../schema/validate';
import type { Task } from '../schema/task';

export interface LoadResult {
  tasks: Task[];
  filePath: string;
}

export function loadTaskFile(filePath: string): LoadResult {
  const resolved = resolve(process.cwd(), filePath);

  let raw: string;
  try {
    raw = readFileSync(resolved, 'utf-8');
  } catch {
    throw new Error(`Cannot read task file: ${resolved}`);
  }

  let parsed: unknown;
  try {
    parsed = parseYaml(raw);
  } catch (err) {
    throw new Error(`Failed to parse YAML in ${resolved}: ${(err as Error).message}`);
  }

  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as Record<string, unknown>).tasks)) {
    throw new Error(`Task file must have a top-level "tasks" array`);
  }

  const rawTasks = (parsed as { tasks: unknown[] }).tasks;
  const tasks: Task[] = rawTasks.map((t, i) => {
    const result = validateTask(t);
    if (!result.success) {
      throw new Error(`Task[${i}] validation failed:\n${result.errors?.join('\n')}`);
    }
    return result.data!;
  });

  return { tasks, filePath: resolved };
}
