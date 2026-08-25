import type {
  IModuleCycleDetector,
  IModuleDependencyGraph,
  ModuleDependencyCycle
} from "@veltryx/contracts";

export class KernelModuleCycleDetector implements IModuleCycleDetector {
  detect(graph: IModuleDependencyGraph): readonly ModuleDependencyCycle[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const stack: string[] = [];
    const cycles = new Map<string, ModuleDependencyCycle>();

    for (const moduleId of graph.getModuleIds()) {
      visit(moduleId, graph, visited, visiting, stack, cycles);
    }

    return [...cycles.values()].sort((left, right) =>
      left.moduleIds.join(" > ").localeCompare(right.moduleIds.join(" > "))
    );
  }
}

function visit(
  moduleId: string,
  graph: IModuleDependencyGraph,
  visited: Set<string>,
  visiting: Set<string>,
  stack: string[],
  cycles: Map<string, ModuleDependencyCycle>
): void {
  if (visited.has(moduleId)) {
    return;
  }

  if (visiting.has(moduleId)) {
    const cycleStart = stack.indexOf(moduleId);
    const cycle = [...stack.slice(cycleStart), moduleId];
    cycles.set(canonicalCycleKey(cycle), { moduleIds: cycle });
    return;
  }

  visiting.add(moduleId);
  stack.push(moduleId);

  for (const edge of graph.getDependencies(moduleId)) {
    visit(edge.to, graph, visited, visiting, stack, cycles);
  }

  stack.pop();
  visiting.delete(moduleId);
  visited.add(moduleId);
}

function canonicalCycleKey(cycle: readonly string[]): string {
  const withoutClosingNode = cycle.slice(0, -1);
  const rotations = withoutClosingNode.map((_, index) => [
    ...withoutClosingNode.slice(index),
    ...withoutClosingNode.slice(0, index)
  ]);
  const canonical = rotations
    .map((rotation) => rotation.join("\u0000"))
    .sort()[0];

  return canonical ?? cycle.join("\u0000");
}