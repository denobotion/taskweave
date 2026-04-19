import { Task } from "../schema/task";

export interface DependencyGraph {
  nodes: Map<string, string[]>; // task id -> dependency ids
  order: string[];              // topological order
}

export function buildDependencyGraph(tasks: Task[]): DependencyGraph {
  const nodes = new Map<string, string[]>();
  const taskIds = new Set(tasks.map((t) => t.id));

  for (const task of tasks) {
    const deps = (task.depends_on ?? []).filter((d) => taskIds.has(d));
    nodes.set(task.id, deps);
  }

  return { nodes, order: topologicalSort(nodes) };
}

export function topologicalSort(nodes: Map<string, string[]>): string[] {
  const visited = new Set<string>();
  const result: string[] = [];

  function visit(id: string, ancestors: Set<string>) {
    if (ancestors.has(id)) throw new Error(`Circular dependency detected: ${id}`);
    if (visited.has(id)) return;
    ancestors.add(id);
    for (const dep of nodes.get(id) ?? []) visit(dep, new Set(ancestors));
    visited.add(id);
    result.push(id);
  }

  for (const id of nodes.keys()) visit(id, new Set());
  return result;
}

export function getDependents(graph: DependencyGraph, taskId: string): string[] {
  const result: string[] = [];
  for (const [id, deps] of graph.nodes) {
    if (deps.includes(taskId)) result.push(id);
  }
  return result;
}

export function hasCycle(nodes: Map<string, string[]>): boolean {
  try {
    topologicalSort(nodes);
    return false;
  } catch {
    return true;
  }
}
