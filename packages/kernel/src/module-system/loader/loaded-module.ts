import type { LoadedModule, ModuleDescriptor } from "@veltryx/contracts";

export class KernelLoadedModule implements LoadedModule {
  readonly manifest;
  readonly state = "loaded" as const;
  readonly loadedAt: Date;
  readonly source?: string;

  constructor(readonly descriptor: ModuleDescriptor, loadedAt: Date = new Date()) {
    this.manifest = descriptor.manifest;
    this.loadedAt = loadedAt;
    this.source = descriptor.source;
  }
}