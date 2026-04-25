import {
  BudgetStore,
  BudgetViolation,
  createBudgetStore,
  registerBudget,
  startBudget,
  checkBudget,
  recordViolation,
} from "./budget";
import { TaskDefinition } from "../schema/task";

export function buildBudgetStore(tasks: TaskDefinition[]): BudgetStore {
  let store = createBudgetStore();
  for (const task of tasks) {
    if (task.budget) {
      store = registerBudget(store, {
        taskId: task.id,
        limitMs: task.budget.limitMs,
        warnMs: task.budget.warnMs,
      });
    }
  }
  return store;
}

export function onTaskStart(
  store: BudgetStore,
  taskId: string
): BudgetStore {
  return startBudget(store, taskId);
}

export function onTaskEnd(
  store: BudgetStore,
  taskId: string
): { store: BudgetStore; violation: BudgetViolation | null } {
  const violation = checkBudget(store, taskId);
  if (violation) {
    return { store: recordViolation(store, violation), violation };
  }
  return { store, violation: null };
}

export function formatBudgetLine(violation: BudgetViolation): string {
  const icon = violation.kind === "exceeded" ? "✗" : "⚠";
  const diff = violation.actualMs - violation.limitMs;
  return `${icon} [budget] ${violation.taskId} exceeded by ${diff}ms (limit: ${violation.limitMs}ms, actual: ${violation.actualMs}ms)`;
}
