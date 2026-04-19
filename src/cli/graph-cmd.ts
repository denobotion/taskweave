import { loadTaskFile } from "./load";
import { buildTaskGraph } from "../runner/graph.integration";
import { hasCycle } from "../runner/graph";

export async function runGraphCmd(args: string[]): Promise<void> {
  const filePath = args[0] ?? "taskweave.yml";
  const tasks = await loadTaskFile(filePath);

  const graph = buildTaskGraph(tasks);

  if (hasCycle(graph.nodes)) {
    console.error("Error: Circular dependency detected in task graph.");
    process.exit(1);
  }

  console.log("Task Dependency Graph");
  console.log("=====================");
  console.log(`Tasks:      ${tasks.length}`);
  console.log(`Edges:      ${graph.summary.totalEdges}`);
  console.log(`Roots:      ${graph.summary.roots.join(", ") || "(none)"}`);
  console.log(`Leaves:     ${graph.summary.leaves.join(", ") || "(none)"}`);
  console.log("");
  console.log("Execution order:");
  graph.order.forEach((id, i) => {
    const deps = graph.nodes.get(id) ?? [];
    const depStr = deps.length ? ` <- [${deps.join(", ")}]` : "";
    console.log(`  ${i + 1}. ${id}${depStr}`);
  });
}
