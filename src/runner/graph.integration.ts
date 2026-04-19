import { Task } from "../schema/task";
import { buildDependencyGraph, getDependents, DependencyGraph } from "./graph";

export interface GraphSummary {
  roots: string[];      // tasks with no dependencies
  leaves: string[];     // tasks nothing depends on
  totalEdges: number;
}

export function summarizeGraph(graph: DependencyGraph): GraphSummary {
  const roots: string[] = [];
  const leaves: string[] = [];
  let totalEdges = 0;

  for (const [id, deps] of graph.nodes) {
    if (deps.length === 0) roots.push(id);
    totalEdges += deps.length;
    if (getDependents(graph, id).length === 0) leaves.push(id);
  }

  return { roots, leaves, totalEdges };
}

export function filterReachable(graph: DependencyGraph, from: string): string[] {
  const visited = new Set<string>();
  const queue = [from];
  while (queue.length) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    for (const dep of graph.nodes.get(id) ?? []) queue.push(dep);
  }
  return [...visited];
}

export function buildTaskGraph(tasks: Task[]): DependencyGraph & { summary: GraphSummary } {
  const graph = buildDependencyGraph(tasks);
  const summary = summarizeGraph(graph);
  return { ...graph, summary };
}
