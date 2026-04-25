import {
  createBudgetStore,
  registerBudget,
  startBudget,
  checkBudget,
  recordViolation,
  summarizeBudget,
} from "./budget";

describe("budget", () => {
  it("creates an empty store", () => {
    const store = createBudgetStore();
    expect(store.entries.size).toBe(0);
    expect(store.violations).toHaveLength(0);
  });

  it("registers a budget entry", () => {
    const store = registerBudget(createBudgetStore(), {
      taskId: "build",
      limitMs: 5000,
      warnMs: 3000,
    });
    expect(store.entries.has("build")).toBe(true);
  });

  it("starts a budget timer", () => {
    let store = registerBudget(createBudgetStore(), { taskId: "test", limitMs: 1000 });
    store = startBudget(store, "test");
    const entry = store.entries.get("test");
    expect(entry?.startedAt).toBeDefined();
    expect(typeof entry?.startedAt).toBe("number");
  });

  it("returns null when within budget", () => {
    let store = registerBudget(createBudgetStore(), { taskId: "fast", limitMs: 60000 });
    store = startBudget(store, "fast");
    const violation = checkBudget(store, "fast");
    expect(violation).toBeNull();
  });

  it("detects exceeded budget", () => {
    let store = registerBudget(createBudgetStore(), { taskId: "slow", limitMs: 0 });
    store = startBudget(store, "slow");
    const violation = checkBudget(store, "slow");
    expect(violation).not.toBeNull();
    expect(violation?.kind).toBe("exceeded");
    expect(violation?.taskId).toBe("slow");
  });

  it("records violations", () => {
    let store = createBudgetStore();
    store = recordViolation(store, {
      taskId: "build",
      limitMs: 1000,
      actualMs: 1500,
      kind: "exceeded",
      timestamp: Date.now(),
    });
    expect(store.violations).toHaveLength(1);
  });

  it("summarizes violations", () => {
    let store = createBudgetStore();
    store = recordViolation(store, {
      taskId: "lint",
      limitMs: 500,
      actualMs: 800,
      kind: "warn",
      timestamp: Date.now(),
    });
    const summary = summarizeBudget(store);
    expect(summary).toContain("lint");
    expect(summary).toContain("WARN");
  });

  it("summarizes with no violations", () => {
    const store = createBudgetStore();
    expect(summarizeBudget(store)).toBe("No budget violations.");
  });
});
