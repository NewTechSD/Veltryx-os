import type {
  CompositionDiagnosticEntry, CompositionError, CompositionSnapshotEntry, CompositionWarning,
  ComputeSnapshotChecksumInput, EnforceSnapshotRetentionForSourceInput, EnforceSnapshotRetentionInput,
  IPersistenceService, ISnapshotRetentionAuditService, ListSnapshotAuditEntriesInput,
  PersistenceRecordData, RecordSnapshotAuditEntryInput, RepairLatestPointerInput, SnapshotAuditEntry,
  SnapshotChecksumResult, SnapshotChecksumVerificationResult, SnapshotLatestRepairResult,
  SnapshotRetentionAuditSnapshot, SnapshotRetentionResult, SnapshotRetentionRunSummary,
  VerifySnapshotChecksumInput
} from "@veltryx/contracts";
import { cloneAndFreezeCompositionValue, createCompositionDiagnostic, createCompositionError } from "../../composition-diagnostics.js";
import { UICompositionPersistenceMapper } from "../ui-composition-persistence-mapper.js";
import { SnapshotChecksumService } from "./snapshot-checksum-service.js";
import { DEFAULT_SNAPSHOT_RETENTION_POLICY, resolveSnapshotRetentionPolicy } from "./snapshot-retention-policy.js";

const SCOPE = "ui-composition";
const SNAPSHOTS = "composition.snapshots";
const LATEST = "composition.latest";
const AUDIT = "composition.audit";
const RUNS = "composition.retention-runs";

export class SnapshotRetentionAuditService implements ISnapshotRetentionAuditService {
  private readonly warnings: CompositionWarning[] = [];
  private readonly errors: CompositionError[] = [];
  private readonly diagnostics: CompositionDiagnosticEntry[] = [];
  private auditCount = 0;
  private retentionRuns = 0;
  private checksumsGenerated = 0;
  private checksumVerifications = 0;
  private latestPointersRepaired = 0;
  private sequence = 0;
  private readonly checksum: SnapshotChecksumService;

  constructor(private readonly persistence: IPersistenceService, private readonly policy = DEFAULT_SNAPSHOT_RETENTION_POLICY, private readonly mapper = new UICompositionPersistenceMapper(), private readonly now: () => Date = () => new Date()) { this.checksum = new SnapshotChecksumService(now); }

  async recordAuditEntry(input: RecordSnapshotAuditEntryInput): Promise<SnapshotRetentionResult<SnapshotAuditEntry>> {
    try {
      const entry: SnapshotAuditEntry = cloneAndFreezeCompositionValue({ ...input, id: input.id ?? this.id("audit"), occurredAt: input.occurredAt ?? this.now().toISOString() });
      const result = await this.repository(AUDIT).create({ namespace: SCOPE, collection: AUDIT, id: entry.id, data: entry as unknown as PersistenceRecordData });
      if (!result.ok) return this.failure("retention.audit.writeFailed", "Structural audit entry could not be recorded.");
      this.auditCount++;
      return this.success(entry, "retention.audit.recorded", "Structural audit entry recorded.");
    } catch { return this.failure("retention.audit.invalid", "Structural audit entry is invalid."); }
  }

  async listAuditEntries(input: ListSnapshotAuditEntriesInput = {}): Promise<SnapshotRetentionResult<readonly SnapshotAuditEntry[]>> {
    const result = await this.repository(AUDIT).list({ namespace: SCOPE, collection: AUDIT, limit: input.limit ?? 1000, offset: input.offset ?? 0 });
    if (!result.ok) return this.failure("retention.audit.listFailed", "Structural audit entries could not be listed.");
    const entries = (result.data?.items ?? []).map((record) => record.data as unknown as SnapshotAuditEntry).filter((entry) => (!input.operation || entry.operation === input.operation) && (!input.sourceType || entry.sourceType === input.sourceType) && (!input.namespace || entry.namespace === input.namespace) && (!input.sourceId || entry.sourceId === input.sourceId));
    this.auditCount = Math.max(this.auditCount, result.data?.total ?? 0);
    return this.success(entries, "retention.audit.listed", "Structural audit entries listed.");
  }

  computeSnapshotChecksum(input: ComputeSnapshotChecksumInput): SnapshotRetentionResult<SnapshotChecksumResult> {
    try { const result = this.checksum.compute(input.tree); this.checksumsGenerated++; return this.success(result, "retention.checksum.generated", "Snapshot checksum generated."); }
    catch { return this.failure("retention.checksum.invalidInput", "Snapshot checksum input is invalid."); }
  }

  async verifySnapshotChecksum(input: VerifySnapshotChecksumInput): Promise<SnapshotRetentionResult<SnapshotChecksumVerificationResult>> {
    this.checksumVerifications++;
    const entry = await this.getEntry(input.snapshotId);
    if (!entry) { await this.audit("verifyChecksum", "error", { snapshotId: input.snapshotId, message: "Snapshot is missing or invalid.", errors: 1 }); return this.failure("retention.checksum.snapshotMissing", "Snapshot checksum could not be verified."); }
    if (!entry.checksum) { await this.audit("verifyChecksum", "warning", { snapshotId: input.snapshotId, message: "Snapshot has no checksum.", warnings: 1 }); return this.failure("retention.checksum.missing", "Snapshot does not contain a checksum."); }
    const actual = this.checksum.compute(entry.tree).checksum;
    const data = { valid: actual === entry.checksum, snapshotId: entry.snapshotId, expected: entry.checksum, actual };
    await this.audit("verifyChecksum", data.valid ? "success" : "error", { ...this.source(entry), snapshotId: entry.snapshotId, checksum: actual, message: data.valid ? "Checksum verified." : "Checksum mismatch.", errors: data.valid ? 0 : 1 });
    return this.success(data, "retention.checksum.verified", "Snapshot checksum verification completed.");
  }

  async enforceRetentionForSource(input: EnforceSnapshotRetentionForSourceInput): Promise<SnapshotRetentionResult<SnapshotRetentionRunSummary>> {
    try {
      const policy = resolveSnapshotRetentionPolicy(input.policy);
      const dryRun = input.dryRun ?? policy.dryRunDefault;
      const entries = (await this.entries()).filter((entry) => entry.sourceType === input.sourceType && entry.namespace === input.namespace && entry.sourceId === input.sourceId && (!input.purpose || entry.purpose === input.purpose)).sort(newestFirst);
      const latest = await this.latestSnapshotId(input);
      const purposeSeen = new Map<string, number>();
      const remove = entries.filter((entry, index) => {
        const purposeIndex = purposeSeen.get(entry.purpose) ?? 0; purposeSeen.set(entry.purpose, purposeIndex + 1);
        const purposeLimit = policy.maxSnapshotsPerPurpose?.[entry.purpose];
        const expired = policy.maxAgeMs !== undefined && this.now().getTime() - Date.parse(entry.persistedAt) > policy.maxAgeMs;
        const excess = index >= policy.maxSnapshotsPerSource || (purposeLimit !== undefined && purposeIndex >= purposeLimit) || expired;
        return excess && !(policy.protectLatest && entry.snapshotId === latest);
      });
      if (!dryRun) for (const entry of remove) await this.repository(SNAPSHOTS).delete({ namespace: SCOPE, collection: SNAPSHOTS, id: entry.snapshotId });
      const repair = dryRun ? undefined : await this.repairLatestPointer(input);
      const summary = await this.runSummary("source", dryRun, entries.length, dryRun ? 0 : remove.length, entries.length - remove.length, repair?.data?.updated ? 1 : 0);
      await this.audit("prune", "success", { ...input, message: input.reason ?? "Source retention enforced.", diagnostics: 1 });
      return this.success(summary, "retention.source.enforced", "Source retention completed.");
    } catch { return this.failure("retention.source.failed", "Source retention could not be completed."); }
  }

  async enforceRetention(input: EnforceSnapshotRetentionInput = {}): Promise<SnapshotRetentionResult<SnapshotRetentionRunSummary>> {
    const entries = await this.entries();
    const sources = [...new Map(entries.map((entry) => [`${entry.sourceType}:${entry.namespace}:${entry.sourceId}`, this.source(entry)])).values()];
    let deleted = 0; let retained = 0; let repaired = 0; let errors = 0;
    for (const source of sources) { const result = await this.enforceRetentionForSource({ ...source, dryRun: input.dryRun, policy: input.policy, reason: input.reason }); if (result.data) { deleted += result.data.deletedSnapshots; retained += result.data.retainedSnapshots; repaired += result.data.latestPointersUpdated; } else errors++; }
    const summary = await this.runSummary("global", input.dryRun ?? resolveSnapshotRetentionPolicy(input.policy).dryRunDefault, entries.length, deleted, retained, repaired, errors);
    return this.success(summary, "retention.global.enforced", "Global retention completed.");
  }

  async repairLatestPointer(input: RepairLatestPointerInput): Promise<SnapshotRetentionResult<SnapshotLatestRepairResult>> {
    try {
      const key = this.mapper.sourceKey(input.sourceType, input.namespace, input.sourceId);
      const entries = (await this.entries()).filter((entry) => entry.sourceType === input.sourceType && entry.namespace === input.namespace && entry.sourceId === input.sourceId).sort(newestFirst);
      const current = await this.latestSnapshotId(input);
      const next = entries[0]?.snapshotId;
      let updated = current !== next;
      if (next) await this.upsert(LATEST, key, this.mapper.latestData(next)); else { const deleted = await this.repository(LATEST).delete({ namespace: SCOPE, collection: LATEST, id: key }); updated = updated || Boolean(deleted.data); }
      if (updated) this.latestPointersRepaired++;
      const data: SnapshotLatestRepairResult = cloneAndFreezeCompositionValue({ ...input, ...(next ? { snapshotId: next } : {}), updated });
      await this.audit("repairLatest", "success", { ...input, snapshotId: next, message: updated ? "Latest pointer repaired." : "Latest pointer already consistent.", diagnostics: 1 });
      return this.success(data, "retention.latest.repaired", "Latest pointer consistency checked.");
    } catch { return this.failure("retention.latest.failed", "Latest pointer could not be repaired."); }
  }

  snapshot(): SnapshotRetentionAuditSnapshot { const provider = this.persistence.snapshot().provider; return cloneAndFreezeCompositionValue({ status: this.errors.length ? "error" : this.warnings.length ? "warning" : this.auditCount || this.retentionRuns ? "ready" : "empty", generatedAt: this.now().toISOString(), provider: { id: provider.id, kind: provider.kind }, policy: this.policy, auditEntries: this.auditCount, retentionRuns: this.retentionRuns, checksumsGenerated: this.checksumsGenerated, checksumVerifications: this.checksumVerifications, latestPointersRepaired: this.latestPointersRepaired, warnings: this.warnings, errors: this.errors, diagnostics: this.diagnostics }); }

  private repository(collection: string) { return this.persistence.repository<PersistenceRecordData>({ namespace: SCOPE, collection }); }
  private async entries(): Promise<CompositionSnapshotEntry[]> { const result = await this.repository(SNAPSHOTS).list({ namespace: SCOPE, collection: SNAPSHOTS, limit: 1000, offset: 0 }); if (!result.ok) throw new Error("Snapshot list unavailable."); return (result.data?.items ?? []).map((record) => this.mapper.fromData(record.data)).filter((entry): entry is CompositionSnapshotEntry => Boolean(entry)); }
  private async getEntry(id: string): Promise<CompositionSnapshotEntry | undefined> { const result = await this.repository(SNAPSHOTS).get({ namespace: SCOPE, collection: SNAPSHOTS, id: this.mapper.snapshotId(id) }); return result.ok && result.data ? this.mapper.fromData(result.data.data) : undefined; }
  private async latestSnapshotId(input: RepairLatestPointerInput): Promise<string | undefined> { const id = this.mapper.sourceKey(input.sourceType, input.namespace, input.sourceId); const result = await this.repository(LATEST).get({ namespace: SCOPE, collection: LATEST, id }); return result.ok && result.data ? this.mapper.latestId(result.data.data) : undefined; }
  private async upsert(collection: string, id: string, data: PersistenceRecordData): Promise<boolean> { const repository = this.repository(collection); const key = { namespace: SCOPE, collection, id }; const exists = await repository.exists(key); if (!exists.ok) return false; return (exists.data ? await repository.update({ ...key, data }) : await repository.create({ ...key, data })).ok; }
  private async runSummary(scope: "source" | "global", dryRun: boolean, evaluated: number, deleted: number, retained: number, repaired: number, errors = 0): Promise<SnapshotRetentionRunSummary> { const summary = cloneAndFreezeCompositionValue({ runId: this.id("retention"), scope, dryRun, evaluatedSnapshots: evaluated, deletedSnapshots: deleted, retainedSnapshots: retained, latestPointersUpdated: repaired, warnings: 0, errors, diagnostics: 1 }); await this.repository(RUNS).create({ namespace: SCOPE, collection: RUNS, id: summary.runId, data: summary as unknown as PersistenceRecordData }); this.retentionRuns++; return summary; }
  private source(entry: CompositionSnapshotEntry) { return { sourceType: entry.sourceType, namespace: entry.namespace, sourceId: entry.sourceId }; }
  private async audit(operation: SnapshotAuditEntry["operation"], status: SnapshotAuditEntry["status"], input: Partial<RecordSnapshotAuditEntryInput>): Promise<void> { await this.recordAuditEntry({ operation, status, warnings: input.warnings ?? 0, errors: input.errors ?? 0, diagnostics: input.diagnostics ?? 0, sourceType: input.sourceType, namespace: input.namespace, sourceId: input.sourceId, snapshotId: input.snapshotId, purpose: input.purpose, checksum: input.checksum, message: input.message }); }
  private id(prefix: string): string { this.sequence++; return `${prefix}-${this.now().toISOString().replace(/[^0-9]/g, "").slice(0, 17)}-${this.sequence}`; }
  private success<T>(data: T, code: string, message: string): SnapshotRetentionResult<T> { const diagnostic = createCompositionDiagnostic({ code, message, severity: "info", timestamp: this.now().toISOString() }); this.diagnostics.push(diagnostic); return cloneAndFreezeCompositionValue({ ok: true, data, warnings: [], errors: [], diagnostics: [diagnostic] }); }
  private failure<T>(code: string, message: string): SnapshotRetentionResult<T> { const error = createCompositionError(code, message, undefined, this.now().toISOString()); const diagnostic = { ...error, severity: "error" as const }; this.errors.push(error); this.diagnostics.push(diagnostic); return cloneAndFreezeCompositionValue({ ok: false, warnings: [], errors: [error], diagnostics: [diagnostic] }); }
}

function newestFirst(left: CompositionSnapshotEntry, right: CompositionSnapshotEntry): number { return right.persistedAt.localeCompare(left.persistedAt) || right.snapshotId.localeCompare(left.snapshotId); }
