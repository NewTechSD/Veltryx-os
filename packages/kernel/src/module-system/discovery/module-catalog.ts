import type { IModuleCatalog, ModuleDescriptor } from "@veltryx/contracts";

export class KernelModuleCatalog implements IModuleCatalog {
  private readonly modules = new Map<string, ModuleDescriptor>();

  register(descriptor: ModuleDescriptor): void {
    if (this.modules.has(descriptor.manifest.id)) {
      throw new Error(`Module already cataloged: ${descriptor.manifest.id}`);
    }

    this.modules.set(descriptor.manifest.id, descriptor);
  }

  remove(moduleId: string): boolean {
    return this.modules.delete(moduleId);
  }

  find(moduleId: string): ModuleDescriptor | undefined {
    return this.modules.get(moduleId);
  }

  list(): readonly ModuleDescriptor[] {
    return [...this.modules.values()];
  }

  has(moduleId: string): boolean {
    return this.modules.has(moduleId);
  }
}
