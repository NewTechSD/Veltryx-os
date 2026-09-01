import type {
  MetadataDiagnosticEntry,
  MetadataEngineSnapshot,
  MetadataError,
  MetadataNamespace,
  MetadataResource,
  MetadataWarning
} from "@veltryx/contracts";
import { cloneAndFreezeMetadataValue, createMetadataDiagnostic, createMetadataWarning } from "./metadata-diagnostics.js";

export interface MetadataSnapshotInput {
  readonly namespaces: readonly MetadataNamespace[];
  readonly resources: readonly MetadataResource[];
  readonly warnings: readonly MetadataWarning[];
  readonly errors: readonly MetadataError[];
  readonly diagnostics: readonly MetadataDiagnosticEntry[];
}

export class MetadataSnapshotService {
  constructor(private readonly now: () => Date = () => new Date()) {}

  snapshot(input: MetadataSnapshotInput): MetadataEngineSnapshot {
    const generatedAt = this.now().toISOString();
    const resourcesByType: Record<string, number> = {};
    for (const resource of input.resources) resourcesByType[resource.type] = (resourcesByType[resource.type] ?? 0) + 1;
    const warnings = [...input.warnings];
    if (input.namespaces.length === 0) warnings.push(createMetadataWarning("metadata.noNamespaces", "No metadata namespaces are registered.", "metadata", undefined, generatedAt));
    if (input.resources.length === 0) warnings.push(createMetadataWarning("metadata.noResources", "No metadata resources are registered.", "metadata", undefined, generatedAt));
    const status = input.errors.length > 0 ? "error" : input.resources.length === 0 ? "empty" : warnings.length > 0 ? "partial" : "ready";
    const diagnostics = [
      ...input.diagnostics,
      ...warnings.map((warning) => ({ ...warning, severity: "warning" as const })),
      ...input.errors.map((error) => ({ ...error, severity: "error" as const })),
      createMetadataDiagnostic({ code: "metadata.snapshot.generated", message: "Metadata snapshot generated.", severity: "info", source: "metadata", timestamp: generatedAt })
    ];
    return cloneAndFreezeMetadataValue({
      status,
      generatedAt,
      namespacesRegistered: input.namespaces.length,
      resourcesRegistered: input.resources.length,
      entitiesRegistered: resourcesByType.entity ?? 0,
      pagesRegistered: resourcesByType.page ?? 0,
      menusRegistered: resourcesByType.menu ?? 0,
      resourcesByType,
      namespaces: input.namespaces.map((namespace) => ({
        id: namespace.id,
        name: namespace.name,
        description: namespace.description,
        source: namespace.source,
        version: namespace.version
      })),
      resources: input.resources.map((resource) => ({
        id: resource.id,
        namespace: resource.namespace,
        type: resource.type,
        label: resource.label,
        source: resource.source,
        version: resource.version
      })),
      warnings,
      errors: input.errors,
      diagnostics
    });
  }
}
