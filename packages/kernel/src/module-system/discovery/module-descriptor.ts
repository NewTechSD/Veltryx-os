import type { ModuleDescriptor, ModuleLifecycleState, ModuleManifest } from "@veltryx/contracts";

export class KernelModuleDescriptor implements ModuleDescriptor {
  constructor(
    readonly manifest: ModuleManifest,
    readonly state: ModuleLifecycleState = "discovered",
    readonly source?: string
  ) {}
}
