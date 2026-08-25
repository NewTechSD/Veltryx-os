import type {
  IModuleDependencyGraph,
  IModuleTopologicalSorter,
  ModuleDescriptor
} from "@veltryx/contracts";

export class KernelModuleTopologicalSorter implements IModuleTopologicalSorter {
  sort(graph: IModuleDependencyGraph): readonly ModuleDescriptor[] {
    const sorted: ModuleDescriptor[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    for (const moduleId of graph.getModuleIds()) {
      visit(moduleId, graph, visited, visiting, sorted);
    }

    return sorted;
  }
}

function visit(
  moduleId: string,
  graph: IModuleDependencyGraph,
  visited: Set<string>,
  visiting: Set<string>,
  sorted: ModuleDescriptor[]
): void {
  if (visited.has(moduleId)) {
    return;
  }

  if (visiting.has(moduleId)) {
    throw new Error(`Cannot sort dependency graph with cycle at module: ${moduleId}`);
  }

  const descriptor = graph.getModule(moduleId);

  if (!descriptor) {
    throw new Error(`Module not found in dependency graph: ${moduleId}`);
  }

  visiting.add(moduleId);

  for (const edge of graph.getDependencies(moduleId)) {
    visit(edge.to, graph, visited, visiting, sorted);
  }

  visiting.delete(moduleId);
  visited.add(moduleId);
  sorted.push(descriptor);
}