import { describe, it, expect } from "vitest";
import { summarizeGraph, filterReachable, buildTaskGraph } from "./graph.integration";
import { buildDependencyGraph } from "./graph";
import { Task } from "../schema/task";

const makeTask = (id: string, depends_on: string[] = []): Task =>
  ({ id, command: `echo ${id}`, depends_on } as Task);

describe("summarizeGraph", () => {
  it("identifies roots and leaves", () => {
    const tasks = [makeTask("a"), makeTask("b", ["a"]), makeTask("c", ["b"])];
    const graph = buildDependencyGraph(tasks);
    const summary = summarizeGraph(graph);
    expect(summary.roots).toEqual(["a"]);
    expect(summary.leaves).toEqual(["c"]);
    expect(summary.totalEdges).toBe(2);
  });

  it("counts edges correctly", () => {
    const tasks = [makeTask("a"), makeTask("b", ["a"]), makeTask("c", ["a", "b"])];
    const graph = buildDependencyGraph(tasks);
    const { totalEdges } = summarizeGraph(graph);
    expect(totalEdges).toBe(3);
  });
});

describe("filterReachable", () => {
  it("returns all reachable deps from a node", () => {
    const tasks = [makeTask("a"), makeTask("b", ["a"]), makeTask("c", ["b"])];
    const graph = buildDependencyGraph(tasks);
    const reachable = filterReachable(graph, "c");
    expect(reachable.sort()).toEqual(["a", "b", "c"]);
  });

  it("returns only self for root node", () => {
    const tasks = [makeTask("a"), makeTask("b", ["a"])];
    const graph = buildDependencyGraph(tasks);
    expect(filterReachable(graph, "a")).toEqual(["a"]);
  });
});

describe("buildTaskGraph", () => {
  it("includes summary in result", () => {
    const tasks = [makeTask("a"), makeTask("b", ["a"])];
    const result = buildTaskGraph(tasks);
    expect(result.summary.roots).toContain("a");
    expect(result.summary.leaves).toContain("b");
  });
});
