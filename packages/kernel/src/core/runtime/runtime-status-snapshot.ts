import type {
  IRuntimeStatusSnapshotService,
  RuntimeContext,
  RuntimeStatusSnapshot
} from "@veltryx/contracts";
import { createRuntimeEntry, toRuntimeDiagnostic } from "./runtime-diagnostics.js";

export class RuntimeStatusSnapshotService implements IRuntimeStatusSnapshotService {
  constructor(private readonly now: () => Date = () => new Date()) {}

  snapshot(context: RuntimeContext): RuntimeStatusSnapshot {
    const generatedAt = this.now().toISOString();
    const bootTime = context.bootstrappedAt ? Date.parse(context.bootstrappedAt) : undefined;
    const uptimeMs =
      bootTime === undefined || Number.isNaN(bootTime)
        ? undefined
        : Math.max(0, this.now().getTime() - bootTime);
    return Object.freeze({
      status: context.lifecycle,
      generatedAt,
      runtimeId: context.runtimeId,
      environment: context.environment,
      runtimeMode: context.runtimeMode,
      bootstrappedAt: context.bootstrappedAt,
      uptimeMs,
      configurationStatus: context.configuration.status,
      serviceRegistryStatus: context.services.status,
      dependencyInjectionStatus: context.dependencyInjection.status,
      moduleSystemStatus: context.modules.status,
      metadataStatus: context.metadata.status,
      metadataNamespacesRegistered: context.metadata.namespacesRegistered,
      metadataResourcesRegistered: context.metadata.resourcesRegistered,
      metadataEntitiesRegistered: context.metadata.entitiesRegistered,
      metadataPagesRegistered: context.metadata.pagesRegistered,
      componentRegistryStatus: context.componentRegistry?.status,
      componentsRegistered: context.componentRegistry?.componentsRegistered,
      uiCompositionStatus: context.uiComposition?.status,
      compositionsGenerated: context.uiComposition?.compositionsGenerated,
      persistence: context.persistence,
      metadataPersistence: context.metadataPersistence,
      configurationPersistence: context.configurationPersistence,
      componentPersistence: context.componentPersistence,
      uiCompositionPersistence: context.uiCompositionPersistence,
      snapshotRetentionAudit: context.snapshotRetentionAudit,
      servicesAvailable: context.services.available,
      providersRegistered: context.dependencyInjection.providersRegistered,
      providersResolved: context.dependencyInjection.providersResolved,
      modulesDiscovered: context.modules.discovered,
      modulesResolved: context.modules.resolved,
      modulesLoaded: context.modules.loaded,
      warnings: Object.freeze([...context.warnings]),
      errors: Object.freeze([...context.errors]),
      diagnostics: Object.freeze([
        ...context.diagnostics,
        toRuntimeDiagnostic(
          createRuntimeEntry(
            "runtime.snapshot.generated",
            "Runtime Status Snapshot generated.",
            generatedAt
          ),
          "info"
        )
      ])
    });
  }
}


