import type {
  ComposeAndPersistInput, CompositionDiagnosticEntry, CompositionError, CompositionSnapshotEntry,
  CompositionSnapshotEntrySummary, CompositionTree, CompositionWarning, DeleteCompositionSnapshotInput,
  IMetadataRegistry, IPersistenceService, IUICompositionPersistenceService, IUICompositionRuntime,
  ISnapshotRetentionAuditService,
  ListCompositionSnapshotsInput, LoadCompositionSnapshotInput, LoadLatestCompositionSnapshotInput,
  PersistCompositionSnapshotInput, PersistenceRecordData, UICompositionPersistenceResult,
  UICompositionPersistenceSnapshot
} from "@veltryx/contracts";
import { cloneAndFreezeCompositionValue, createCompositionDiagnostic, createCompositionError, createCompositionWarning } from "../composition-diagnostics.js";
import { UICompositionPersistenceMapper } from "./ui-composition-persistence-mapper.js";
import { UICompositionPersistenceValidator } from "./ui-composition-persistence-validator.js";
import { SnapshotChecksumService } from "./policy/snapshot-checksum-service.js";

const SCOPE = "ui-composition";
const SNAPSHOTS = "composition.snapshots";
const LATEST = "composition.latest";

export class UICompositionPersistenceService implements IUICompositionPersistenceService {
  private readonly warnings: CompositionWarning[] = [];
  private readonly errors: CompositionError[] = [];
  private readonly diagnostics: CompositionDiagnosticEntry[] = [];
  private readonly persisted = new Set<string>();
  private readonly latest = new Set<string>();
  private loaded = 0;
  private sequence = 0;
  private readonly validator: UICompositionPersistenceValidator;
  private readonly checksum: SnapshotChecksumService;

  constructor(private readonly runtime: IUICompositionRuntime, metadata: IMetadataRegistry, private readonly persistence: IPersistenceService, private readonly mapper = new UICompositionPersistenceMapper(), private readonly now: () => Date = () => new Date(), private readonly retentionAudit?: ISnapshotRetentionAuditService) { this.validator = new UICompositionPersistenceValidator(runtime, metadata); this.checksum = new SnapshotChecksumService(now); }

  async persistCompositionSnapshot(input: PersistCompositionSnapshotInput): Promise<UICompositionPersistenceResult<CompositionSnapshotEntry>> {
    try {
      const invalid = this.validator.validate(input.tree, input.namespace, input.sourceId);
      if (invalid) return this.failure("composition.persistence.invalidSnapshot", invalid);
      const snapshotId = this.mapper.snapshotId(input.snapshotId ?? this.createId());
      const checksum = this.retentionAudit?.computeSnapshotChecksum({ tree: input.tree }).data?.checksum ?? this.checksum.compute(input.tree).checksum;
      const entry: CompositionSnapshotEntry = cloneAndFreezeCompositionValue({ snapshotId, sourceType: input.tree.sourceType, namespace: input.namespace, sourceId: input.sourceId, purpose: input.purpose, tree: input.tree, generatedAt: input.tree.generatedAt, persistedAt: this.now().toISOString(), checksum, ...(input.metadata ? { metadata: input.metadata } : {}) });
      if (!await this.upsert(SNAPSHOTS, snapshotId, this.mapper.toData(entry))) return this.failure("composition.persistence.writeFailed", "Composition snapshot could not be persisted.");
      const latestId = this.mapper.sourceKey(entry.sourceType, entry.namespace, entry.sourceId);
      if (!await this.upsert(LATEST, latestId, this.mapper.latestData(snapshotId))) return this.failure("composition.persistence.latestFailed", "Latest composition snapshot index could not be updated.");
      this.persisted.add(snapshotId); this.latest.add(latestId);
      await this.audit("persist", entry, "Composition snapshot persisted.");
      return this.success(entry, "composition.persistence.saved", "Composition snapshot persisted.");
    } catch { return this.failure("composition.persistence.invalidSnapshot", "Composition snapshot is not persistable."); }
  }

  async composeAndPersist(input: ComposeAndPersistInput): Promise<UICompositionPersistenceResult<CompositionSnapshotEntry>> {
    const tree = this.runtime.compose(input.composition);
    const result = await this.persistCompositionSnapshot({ tree, namespace: input.composition.namespace ?? "default", sourceId: input.composition.sourceId, purpose: input.purpose, snapshotId: input.snapshotId, metadata: input.metadata });
    if (result.data) await this.audit("composeAndPersist", result.data, "Composition generated and persisted.");
    return result;
  }

  async loadCompositionSnapshot(input: LoadCompositionSnapshotInput): Promise<UICompositionPersistenceResult<CompositionTree | null>> {
    try {
      const id = this.mapper.snapshotId(input.snapshotId);
      const result = await this.repository(SNAPSHOTS).get({ namespace: SCOPE, collection: SNAPSHOTS, id });
      if (!result.ok) return this.failure("composition.persistence.readFailed", "Composition snapshot could not be loaded.");
      if (!result.data) return this.success(null, "composition.persistence.notFound", "Composition snapshot was not found.");
      const entry = this.mapper.fromData(result.data.data);
      if (!entry || this.validator.validate(entry.tree, entry.namespace, entry.sourceId)) return this.failure("composition.persistence.invalidStoredSnapshot", "Persisted composition snapshot is invalid.");
      if (!entry.checksum || entry.checksum !== this.checksum.compute(entry.tree).checksum) { await this.audit("load", entry, "Composition snapshot checksum is invalid.", "error"); return this.failure("composition.persistence.integrityFailed", "Persisted composition snapshot integrity check failed."); }
      this.loaded++; this.persisted.add(id);
      await this.audit("load", entry, "Composition snapshot loaded.");
      return this.success(this.mapper.tree(entry), "composition.persistence.loaded", "Composition snapshot loaded.");
    } catch { return this.failure("composition.persistence.invalidId", "Composition snapshot id is invalid."); }
  }

  async loadLatestCompositionSnapshot(input: LoadLatestCompositionSnapshotInput): Promise<UICompositionPersistenceResult<CompositionTree | null>> {
    try {
      const id = this.mapper.sourceKey(input.sourceType, input.namespace, input.sourceId);
      const result = await this.repository(LATEST).get({ namespace: SCOPE, collection: LATEST, id });
      if (!result.ok) return this.failure("composition.persistence.latestReadFailed", "Latest composition snapshot could not be loaded.");
      if (!result.data) return this.success(null, "composition.persistence.latestNotFound", "Latest composition snapshot was not found.");
      const snapshotId = this.mapper.latestId(result.data.data);
      if (!snapshotId) return this.failure("composition.persistence.invalidLatest", "Latest composition snapshot index is invalid.");
      this.latest.add(id);
      const loaded = await this.loadCompositionSnapshot({ snapshotId });
      await this.retentionAudit?.recordAuditEntry({ operation: "loadLatest", status: loaded.ok ? "success" : "error", sourceType: input.sourceType, namespace: input.namespace, sourceId: input.sourceId, snapshotId, warnings: loaded.warnings.length, errors: loaded.errors.length, diagnostics: loaded.diagnostics.length });
      return loaded;
    } catch { return this.failure("composition.persistence.invalidSource", "Composition source is invalid."); }
  }

  async listCompositionSnapshots(input: ListCompositionSnapshotsInput = {}): Promise<UICompositionPersistenceResult<readonly CompositionSnapshotEntrySummary[]>> {
    const result = await this.repository(SNAPSHOTS).list({ namespace: SCOPE, collection: SNAPSHOTS, limit: input.limit ?? 1000, offset: input.offset ?? 0 });
    if (!result.ok) return this.failure("composition.persistence.listFailed", "Composition snapshots could not be listed.");
    const summaries: CompositionSnapshotEntrySummary[] = [];
    for (const record of result.data?.items ?? []) {
      const entry = this.mapper.fromData(record.data);
      if (!entry || this.validator.validate(entry.tree, entry.namespace, entry.sourceId)) { this.warning("composition.persistence.invalidStoredSnapshot", "An invalid persisted composition snapshot was ignored."); continue; }
      if ((input.sourceType && entry.sourceType !== input.sourceType) || (input.namespace && entry.namespace !== input.namespace) || (input.sourceId && entry.sourceId !== input.sourceId)) continue;
      summaries.push({ snapshotId: entry.snapshotId, sourceType: entry.sourceType, namespace: entry.namespace, sourceId: entry.sourceId, purpose: entry.purpose, generatedAt: entry.generatedAt, persistedAt: entry.persistedAt, checksum: entry.checksum }); this.persisted.add(record.id);
    }
    await this.retentionAudit?.recordAuditEntry({ operation: "list", status: "success", warnings: 0, errors: 0, diagnostics: 1 });
    return this.success(summaries, "composition.persistence.listed", "Composition snapshot summaries listed.");
  }

  async deleteCompositionSnapshot(input: DeleteCompositionSnapshotInput): Promise<UICompositionPersistenceResult<boolean>> {
    try { const id = this.mapper.snapshotId(input.snapshotId); const existing = await this.repository(SNAPSHOTS).get({ namespace: SCOPE, collection: SNAPSHOTS, id }); const entry = existing.data ? this.mapper.fromData(existing.data.data) : undefined; const result = await this.repository(SNAPSHOTS).delete({ namespace: SCOPE, collection: SNAPSHOTS, id }); if (!result.ok) return this.failure("composition.persistence.deleteFailed", "Composition snapshot could not be deleted."); this.persisted.delete(id); if (result.data && entry && this.retentionAudit) await this.retentionAudit.repairLatestPointer({ sourceType: entry.sourceType, namespace: entry.namespace, sourceId: entry.sourceId }); if (entry) await this.audit("delete", entry, "Composition snapshot delete completed."); return this.success(result.data ?? false, "composition.persistence.deleted", "Composition snapshot delete completed."); }
    catch { return this.failure("composition.persistence.invalidId", "Composition snapshot id is invalid."); }
  }

  snapshot(): UICompositionPersistenceSnapshot {
    const provider = this.persistence.snapshot().provider;
    return cloneAndFreezeCompositionValue({ status: this.errors.length ? "error" : this.warnings.length ? "warning" : this.persisted.size ? "ready" : "empty", generatedAt: this.now().toISOString(), provider: { id: provider.id, kind: provider.kind }, snapshotsPersisted: this.persisted.size, snapshotsLoaded: this.loaded, latestSnapshotsTracked: this.latest.size, warnings: this.warnings, errors: this.errors, diagnostics: this.diagnostics });
  }

  private repository(collection: string) { return this.persistence.repository<PersistenceRecordData>({ namespace: SCOPE, collection }); }
  private async upsert(collection: string, id: string, data: PersistenceRecordData): Promise<boolean> { const repository = this.repository(collection); const key = { namespace: SCOPE, collection, id }; const exists = await repository.exists(key); if (!exists.ok) return false; return (exists.data ? await repository.update({ ...key, data }) : await repository.create({ ...key, data })).ok; }
  private createId(): string { this.sequence++; return `cmp-${this.now().toISOString().replace(/[^0-9]/g, "").slice(0, 17)}-${this.sequence}`; }
  private async audit(operation: "persist" | "composeAndPersist" | "load" | "delete", entry: CompositionSnapshotEntry, message: string, status: "success" | "error" = "success"): Promise<void> { await this.retentionAudit?.recordAuditEntry({ operation, status, sourceType: entry.sourceType, namespace: entry.namespace, sourceId: entry.sourceId, snapshotId: entry.snapshotId, purpose: entry.purpose, checksum: entry.checksum, message, warnings: 0, errors: status === "error" ? 1 : 0, diagnostics: 1 }); }
  private success<T>(data: T, code: string, message: string): UICompositionPersistenceResult<T> { const diagnostic = createCompositionDiagnostic({ code, message, severity: "info", timestamp: this.now().toISOString() }); this.diagnostics.push(diagnostic); return cloneAndFreezeCompositionValue({ ok: true, data, warnings: [], errors: [], diagnostics: [diagnostic] }); }
  private failure<T>(code: string, message: string): UICompositionPersistenceResult<T> { const error = createCompositionError(code, message, undefined, this.now().toISOString()); const diagnostic = { ...error, severity: "error" as const }; this.errors.push(error); this.diagnostics.push(diagnostic); return cloneAndFreezeCompositionValue({ ok: false, warnings: [], errors: [error], diagnostics: [diagnostic] }); }
  private warning(code: string, message: string): void { const warning = createCompositionWarning(code, message, undefined, this.now().toISOString()); this.warnings.push(warning); this.diagnostics.push({ ...warning, severity: "warning" }); }
}
