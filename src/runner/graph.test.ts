import { describe, it, expect } from "vitest";
import { buildDependencyGraph, topologicalSort, getDependents, hasCycle } from "./graph";
import { Task } from "../schema/task";

const makeTask = (id: string, depends_on: string[] = []): Task =>
  ({ id, command: `echo ${id}`, depends_on } as Task);

describe("buildDependencyGraph", () => {
  it("builds nodes from tasks", () => {
    const tasks = [makeTask("a"), makeTask("b", ["a"])];
    const graph = buildDependencyGraph(tasks);
    expect(graph.nodes.get("b")).toEqual(["a"]);
  });

  it("ignores deps not in task list", () => {
    const tasks = [makeTask("a", ["missing"])];
    const graph = buildDependencyGraph(tasks);
    expect(graph.nodes.get("a")).toEqual([]);
  });

  it("returns topological order", () => {
    const tasks = [makeTask("b", ["a"]), makeTask("a")];
    const graph = buildDependencyGraph(tasks);
    expect(graph.order.indexOf("a")).toBeLessThan(graph.order.indexOf("b"));
  });
});

describe("topologicalSort", () => {
  it("sorts simple chain", () => {
    const nodes = new Map([["a", []], ["b", ["a"]], ["c", ["b"]]]);
    const order = topologicalSort(nodes);
    expect(order).toEqual(["a", "b", "c"]);
  });

  it("throws on circular dependency", () => {
    const nodes = new Map([["a", ["b"]], ["b", ["a"]]]);
    expect(() => topologicalSort(nodes)).toThrow("Circular");
  });
});

describe("getDependents", () => {
  it("returns tasks that depend on given id", () => {
    const tasks = [makeTask("a"), makeTask("b", ["a"]), makeTask("c", ["a"])];
    const graph = buildDependencyGraph(tasks);
    expect(getDependents(graph, "a").sort()).toEqual(["b", "c"]);
  });
});

describe("hasCycle", () => {
  it("returns false for acyclic graph", () => {
    const nodes = new Map([["a", []], ["b", ["a"]]]);
    expect(hasCycle(nodes)).toBe(false);
  });

  it("returns true for cyclic graph", () => {
    const nodes = new Map([["a", ["b"]], ["b", ["a"]]]);
    expect(hasCycle(nodes)).toBe(true);
  });
});
