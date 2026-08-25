import type {
  IModuleDependencyGraph,
  ModuleDependencyEdge,
  ModuleDescriptor
} from "@veltryx/contracts";

export class KernelModuleDependencyGraph implements IModuleDependencyGraph {
  private readonly modules = new Map<string, ModuleDescriptor>();
  private readonly dependencies = new Map<string, Map<string, ModuleDependencyEdge>>();
  private readonly dependents = new Map<string, Map<string, ModuleDependencyEdge>>();

  addModule(descriptor: ModuleDescriptor): void {
    const moduleId = descriptor.manifest.id;

    if (this.modules.has(moduleId)) {
      throw new Error(`Module already exists in dependency graph: ${moduleId}`);
    }

    this.modules.set(moduleId, descriptor);
    this.dependencies.set(moduleId, new Map());
    this.dependents.set(moduleId, new Map());
  }

  addDependency(moduleId: string, dependencyId: string, optional = false): void {
    if (!this.modules.has(moduleId)) {
      throw new Error(`Module not found in dependency graph: ${moduleId}`);
    }

    if (!this.modules.has(dependencyId)) {
      throw new Error(`Dependency not found in dependency graph: ${dependencyId}`);
    }

    const edge: ModuleDependencyEdge = { from: moduleId, to: dependencyId, optional };
    this.dependencies.get(moduleId)?.set(dependencyId, edge);
    this.dependents.get(dependencyId)?.set(moduleId, edge);
  }

  getModule(moduleId: string): ModuleDescriptor | undefined {
    return this.modules.get(moduleId);
  }

  getModuleIds(): readonly string[] {
    return [...this.modules.keys()].sort();
  }

  getDependencies(moduleId: string): readonly ModuleDependencyEdge[] {
    return sortEdges(this.dependencies.get(moduleId)?.values() ?? []);
  }

  getDependents(moduleId: string): readonly ModuleDependencyEdge[] {
    return sortEdges(this.dependents.get(moduleId)?.values() ?? []);
  }

  hasModule(moduleId: string): boolean {
    return this.modules.has(moduleId);
  }
}

function sortEdges(edges: Iterable<ModuleDependencyEdge>): readonly ModuleDependencyEdge[] {
  return [...edges].sort((left, right) => {
    const byFrom = left.from.localeCompare(right.from);

    if (byFrom !== 0) {
      return byFrom;
    }

    return left.to.localeCompare(right.to);
  });
}