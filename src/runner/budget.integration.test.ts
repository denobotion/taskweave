import { buildBudgetStore, onTaskStart, onTaskEnd, formatBudgetLine } from "./budget.integration";
import { TaskDefinition } from "../schema/task";

const makeTask = (id: string, limitMs?: number, warnMs?: number): TaskDefinition => ({
  id,
  command: `echo ${id}`,
  ...(limitMs !== undefined ? { budget: { limitMs, warnMs } } : {}),
} as any);

describe("budget integration", () => {
  it("builds store from tasks with budgets", () => {
    const tasks = [makeTask("build", 5000, 3000), makeTask("lint")];
    const store = buildBudgetStore(tasks);
    expect(store.entries.has("build")).toBe(true);
    expect(store.entries.has("lint")).toBe(false);
  });

  it("ignores tasks without budget", () => {
    const tasks = [makeTask("test")];
    const store = buildBudgetStore(tasks);
    expect(store.entries.size).toBe(0);
  });

  it("starts timer on task start", () => {
    const tasks = [makeTask("deploy", 10000)];
    let store = buildBudgetStore(tasks);
    store = onTaskStart(store, "deploy");
    expect(store.entries.get("deploy")?.startedAt).toBeDefined();
  });

  it("returns no violation for fast task", () => {
    const tasks = [makeTask("fast", 60000)];
    let store = buildBudgetStore(tasks);
    store = onTaskStart(store, "fast");
    const { violation } = onTaskEnd(store, "fast");
    expect(violation).toBeNull();
  });

  it("detects violation for slow task", () => {
    const tasks = [makeTask("slow", 0)];
    let store = buildBudgetStore(tasks);
    store = onTaskStart(store, "slow");
    const { violation } = onTaskEnd(store, "slow");
    expect(violation).not.toBeNull();
    expect(violation?.kind).toBe("exceeded");
  });

  it("formats a violation line", () => {
    const line = formatBudgetLine({
      taskId: "build",
      limitMs: 1000,
      actualMs: 1500,
      kind: "exceeded",
      timestamp: Date.now(),
    });
    expect(line).toContain("build");
    expect(line).toContain("500ms");
    expect(line).toContain("✗");
  });

  it("formats a warn violation line", () => {
    const line = formatBudgetLine({
      taskId: "lint",
      limitMs: 500,
      actualMs: 600,
      kind: "warn",
      timestamp: Date.now(),
    });
    expect(line).toContain("⚠");
    expect(line).toContain("lint");
  });
});
