import { TaskContext } from "./context";

export interface BudgetEntry {
  taskId: string;
  limitMs: number;
  warnMs?: number;
  startedAt?: number;
}

export interface BudgetStore {
  entries: Map<string, BudgetEntry>;
  violations: BudgetViolation[];
}

export interface BudgetViolation {
  taskId: string;
  limitMs: number;
  actualMs: number;
  kind: "warn" | "exceeded";
  timestamp: number;
}

export function createBudgetStore(): BudgetStore {
  return { entries: new Map(), violations: [] };
}

export function registerBudget(
  store: BudgetStore,
  entry: BudgetEntry
): BudgetStore {
  return { ...store, entries: new Map(store.entries).set(entry.taskId, entry) };
}

export function startBudget(
  store: BudgetStore,
  taskId: string
): BudgetStore {
  const entry = store.entries.get(taskId);
  if (!entry) return store;
  const updated = new Map(store.entries);
  updated.set(taskId, { ...entry, startedAt: Date.now() });
  return { ...store, entries: updated };
}

export function checkBudget(
  store: BudgetStore,
  taskId: string
): BudgetViolation | null {
  const entry = store.entries.get(taskId);
  if (!entry || entry.startedAt === undefined) return null;
  const elapsed = Date.now() - entry.startedAt;
  if (elapsed > entry.limitMs) {
    return { taskId, limitMs: entry.limitMs, actualMs: elapsed, kind: "exceeded", timestamp: Date.now() };
  }
  if (entry.warnMs !== undefined && elapsed > entry.warnMs) {
    return { taskId, limitMs: entry.warnMs, actualMs: elapsed, kind: "warn", timestamp: Date.now() };
  }
  return null;
}

export function recordViolation(
  store: BudgetStore,
  violation: BudgetViolation
): BudgetStore {
  return { ...store, violations: [...store.violations, violation] };
}

export function summarizeBudget(store: BudgetStore): string {
  if (store.violations.length === 0) return "No budget violations.";
  return store.violations
    .map(
      (v) =>
        `[${v.kind.toUpperCase()}] ${v.taskId}: ${v.actualMs}ms (limit ${v.limitMs}ms)`
    )
    .join("\n");
}
