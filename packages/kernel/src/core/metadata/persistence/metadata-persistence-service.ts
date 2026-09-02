import type {
  HydrateMetadataRegistryInput, IMetadataPersistenceService, IMetadataRegistry,
  IPersistenceService, ListMetadataResourcesInput, LoadMetadataResourceInput,
  MetadataDiagnosticEntry, MetadataError, MetadataHydrationResult, MetadataNamespace,
  MetadataPersistenceResult, MetadataPersistenceSnapshot, MetadataResource, MetadataWarning,
  PersistMetadataNamespaceInput, PersistMetadataResourceInput, PersistenceRecordData
} from "@veltryx/contracts";
import {
  cloneAndFreezeMetadataValue, createMetadataDiagnostic, createMetadataError,
  createMetadataWarning, freezeMetadataValue
} from "../metadata-diagnostics.js";
import { MetadataPersistenceMapper } from "./metadata-persistence-mapper.js";

const SCOPE = "metadata";
const NAMESPACES = "metadata.namespaces";
const RESOURCES = "metadata.resources";

export class MetadataPersistenceService implements IMetadataPersistenceService {
  private readonly warnings: MetadataWarning[] = [];
  private readonly errors: MetadataError[] = [];
  private readonly diagnostics: MetadataDiagnosticEntry[] = [];
  private readonly namespaceIds = new Set<string>();
  private readonly resourceIds = new Set<string>();
  private hydrated = 0;

  constructor(
    private readonly metadata: IMetadataRegistry,
    private readonly persistence: IPersistenceService,
    private readonly mapper = new MetadataPersistenceMapper(),
    private readonly now: () => Date = () => new Date()
  ) {}

  async persistNamespace(input: PersistMetadataNamespaceInput): Promise<MetadataPersistenceResult<MetadataNamespace>> {
    try {
      const id = this.mapper.namespaceId(input.namespace);
      const data = this.mapper.toNamespaceData(input.namespace);
      const result = await this.upsert(NAMESPACES, id, data);
      if (!result) return this.failure("metadataPersistence.persistNamespaceFailed", "Metadata namespace could not be persisted.");
      this.namespaceIds.add(id);
      return this.success(input.namespace, "metadataPersistence.namespacePersisted", "Metadata namespace persisted.");
    } catch {
      return this.failure("metadataPersistence.invalidNamespace", "Metadata namespace is not persistable.");
    }
  }

  async persistResource(input: PersistMetadataResourceInput): Promise<MetadataPersistenceResult<MetadataResource>> {
    try {
      const id = this.mapper.resourceId(input.resource);
      const data = this.mapper.toResourceData(input.resource);
      const result = await this.upsert(RESOURCES, id, data);
      if (!result) return this.failure("metadataPersistence.persistResourceFailed", "Metadata resource could not be persisted.");
      this.resourceIds.add(id);
      return this.success(input.resource, "metadataPersistence.resourcePersisted", "Metadata resource persisted.");
    } catch {
      return this.failure("metadataPersistence.invalidResource", "Metadata resource is not persistable.");
    }
  }

  async loadResource(input: LoadMetadataResourceInput): Promise<MetadataPersistenceResult<MetadataResource | null>> {
    const listed = await this.listResources({ namespace: input.namespace, limit: 1000 });
    if (!listed.ok) return freezeMetadataValue({ ok: false, warnings: listed.warnings, errors: listed.errors, diagnostics: listed.diagnostics });
    return this.success(listed.data?.find((resource) => resource.id === input.id) ?? null, "metadataPersistence.resourceLoaded", "Metadata resource load completed.");
  }

  async listResources(input: ListMetadataResourcesInput = {}): Promise<MetadataPersistenceResult<readonly MetadataResource[]>> {
    const result = await this.repository(RESOURCES).list({ namespace: SCOPE, collection: RESOURCES, limit: input.limit ?? 1000, offset: input.offset ?? 0 });
    if (!result.ok) return this.failure("metadataPersistence.listFailed", "Persisted metadata resources could not be listed.");
    const resources: MetadataResource[] = [];
    for (const record of result.data?.items ?? []) {
      const resource = this.mapper.fromResourceData(record.data);
      if (resource && (!input.namespace || resource.namespace === input.namespace)) {
        resources.push(resource);
        this.resourceIds.add(record.id);
      }
    }
    return this.success(resources, "metadataPersistence.resourcesListed", "Persisted metadata resources listed.");
  }

  async hydrateRegistry(input: HydrateMetadataRegistryInput = {}): Promise<MetadataPersistenceResult<MetadataHydrationResult>> {
    const warningStart = this.warnings.length;
    let namespacesHydrated = 0;
    let resourcesHydrated = 0;
    let conflicts = 0;
    let invalidRecords = 0;
    const namespaces = await this.repository(NAMESPACES).list({ namespace: SCOPE, collection: NAMESPACES, limit: 1000, offset: 0 });
    if (!namespaces.ok) return this.failure("metadataPersistence.hydrationFailed", "Persisted metadata namespaces could not be loaded.");
    for (const record of namespaces.data?.items ?? []) {
      const value = this.mapper.fromNamespaceData(record.data);
      if (!value) { invalidRecords++; this.warning("metadataPersistence.invalidRecord", "Invalid persisted metadata namespace was ignored."); continue; }
      this.namespaceIds.add(record.id);
      if (this.metadata.listNamespaces().some((item) => item.id === value.id)) { conflicts++; this.warning("metadataPersistence.conflict", "Existing metadata namespace was preserved."); continue; }
      try { this.metadata.registerNamespace(value); namespacesHydrated++; }
      catch { invalidRecords++; this.warning("metadataPersistence.invalidRecord", "Invalid persisted metadata namespace was ignored."); }
    }
    const records = await this.repository(RESOURCES).list({ namespace: SCOPE, collection: RESOURCES, limit: 1000, offset: 0 });
    if (!records.ok) return this.failure("metadataPersistence.hydrationFailed", "Persisted metadata resources could not be loaded.");
    for (const record of records.data?.items ?? []) {
      const value = this.mapper.fromResourceData(record.data);
      if (!value) { invalidRecords++; this.warning("metadataPersistence.invalidRecord", "Invalid persisted metadata resource was ignored."); continue; }
      if (input.namespace && value.namespace !== input.namespace) continue;
      this.resourceIds.add(record.id);
      if (this.metadata.resolve(value.namespace, value.id).found) { conflicts++; this.warning("metadataPersistence.conflict", "Existing metadata resource was preserved."); continue; }
      try { this.metadata.registerResource(value); resourcesHydrated++; this.hydrated++; }
      catch { invalidRecords++; this.warning("metadataPersistence.invalidRecord", "Invalid persisted metadata resource was ignored."); }
    }
    return this.success({ namespacesHydrated, resourcesHydrated, conflicts, invalidRecords }, "metadataPersistence.registryHydrated", "Metadata Registry hydration completed.", this.warnings.slice(warningStart));
  }

  snapshot(): MetadataPersistenceSnapshot {
    const provider = this.persistence.snapshot().provider;
    return freezeMetadataValue({
      status: this.errors.length ? "error" : this.warnings.length ? "warning" : "ready",
      generatedAt: this.now().toISOString(), provider: { id: provider.id, kind: provider.kind },
      namespacesPersisted: this.namespaceIds.size, resourcesPersisted: this.resourceIds.size,
      hydratedResources: this.hydrated, warnings: [...this.warnings], errors: [...this.errors],
      diagnostics: [...this.diagnostics]
    });
  }

  private repository(collection: string) {
    return this.persistence.repository<PersistenceRecordData>({ namespace: SCOPE, collection });
  }

  private async upsert(collection: string, id: string, data: PersistenceRecordData): Promise<boolean> {
    const repository = this.repository(collection);
    const key = { namespace: SCOPE, collection, id };
    const exists = await repository.exists(key);
    if (!exists.ok) return false;
    const result = exists.data ? await repository.update({ ...key, data }) : await repository.create({ ...key, data });
    return result.ok;
  }

  private success<T>(data: T, code: string, message: string, warnings: readonly MetadataWarning[] = []): MetadataPersistenceResult<T> {
    const diagnostic = createMetadataDiagnostic({ code, message, severity: "info", source: "metadata-persistence", timestamp: this.now().toISOString() });
    this.diagnostics.push(diagnostic);
    return freezeMetadataValue({ ok: true, data: cloneAndFreezeMetadataValue(data), warnings: [...warnings], errors: [], diagnostics: [diagnostic] });
  }

  private failure<T>(code: string, message: string): MetadataPersistenceResult<T> {
    const error = createMetadataError(code, message, "metadata-persistence", undefined, this.now().toISOString());
    const diagnostic = { ...error, severity: "error" as const };
    this.errors.push(error); this.diagnostics.push(diagnostic);
    return freezeMetadataValue({ ok: false, warnings: [], errors: [error], diagnostics: [diagnostic] });
  }

  private warning(code: string, message: string): void {
    const warning = createMetadataWarning(code, message, "metadata-persistence", undefined, this.now().toISOString());
    this.warnings.push(warning); this.diagnostics.push({ ...warning, severity: "warning" });
  }
}
