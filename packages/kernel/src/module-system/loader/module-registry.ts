import type { IModuleRegistry, LoadedModule } from "@veltryx/contracts";

export class KernelModuleRegistry implements IModuleRegistry {
  private readonly modules = new Map<string, LoadedModule>();

  register(module: LoadedModule): void {
    if (this.modules.has(module.manifest.id)) {
      throw new Error(`Module already loaded: ${module.manifest.id}`);
    }

    this.modules.set(module.manifest.id, module);
  }

  remove(moduleId: string): boolean {
    return this.modules.delete(moduleId);
  }

  find(moduleId: string): LoadedModule | undefined {
    return this.modules.get(moduleId);
  }

  list(): readonly LoadedModule[] {
    return [...this.modules.values()];
  }

  has(moduleId: string): boolean {
    return this.modules.has(moduleId);
  }
}