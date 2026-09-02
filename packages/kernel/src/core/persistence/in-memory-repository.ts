import type { CountRecordsInput, CreateRecordInput, IRepository, ListRecordsInput, PersistenceKey, PersistenceListResult, PersistenceRecord, PersistenceRecordData, PersistenceResult, RepositoryInput, UpdateRecordInput } from "@veltryx/contracts";
import { cloneRecordMetadata, cloneSerializableData, validatePersistenceKey } from "./persistence-validator.js";
import { persistenceFailure, persistenceSuccess } from "./persistence-results.js";

export type PersistenceStore = Map<string, Map<string, PersistenceRecord>>;

export class InMemoryRepository<TData extends PersistenceRecordData = PersistenceRecordData> implements IRepository<TData> {
  constructor(private readonly scope: RepositoryInput, private readonly store: PersistenceStore, private readonly now: () => Date) {}

  async create(input: CreateRecordInput<TData>): Promise<PersistenceResult<PersistenceRecord<TData>>> {
    const context = this.context("create", input?.id); const invalid = validatePersistenceKey(input, this.scope);
    if (invalid) return persistenceFailure("persistence.invalidKey", invalid, context, this.now);
    const records = this.records(); if (records.has(input.id)) return persistenceFailure("persistence.duplicate", "Persistence record already exists.", context, this.now);
    try {
      const timestamp = this.now().toISOString();
      const record = this.record(input.id, 1, cloneSerializableData(input.data), cloneRecordMetadata(input.metadata), timestamp, timestamp);
      records.set(input.id, record as PersistenceRecord); return persistenceSuccess(record, context, this.now);
    } catch { return persistenceFailure("persistence.invalidData", "Persistence data is not serializable.", context, this.now); }
  }

  async get(key: PersistenceKey): Promise<PersistenceResult<PersistenceRecord<TData> | null>> {
    const context = this.context("read", key?.id); const invalid = validatePersistenceKey(key, this.scope);
    if (invalid) return persistenceFailure("persistence.invalidKey", invalid, context, this.now);
    return persistenceSuccess((this.records().get(key.id) as PersistenceRecord<TData> | undefined) ?? null, context, this.now);
  }

  async update(input: UpdateRecordInput<TData>): Promise<PersistenceResult<PersistenceRecord<TData>>> {
    const context = this.context("update", input?.id); const invalid = validatePersistenceKey(input, this.scope);
    if (invalid) return persistenceFailure("persistence.invalidKey", invalid, context, this.now);
    const records = this.records(); const current = records.get(input.id) as PersistenceRecord<TData> | undefined;
    if (!current) return persistenceFailure("persistence.notFound", "Persistence record does not exist.", context, this.now);
    try {
      const metadata = { ...current.metadata, ...cloneRecordMetadata(input.metadata) };
      const record = this.record(input.id, current.version + 1, cloneSerializableData(input.data), cloneRecordMetadata(metadata), current.createdAt, this.now().toISOString());
      records.set(input.id, record as PersistenceRecord); return persistenceSuccess(record, context, this.now);
    } catch { return persistenceFailure("persistence.invalidData", "Persistence data is not serializable.", context, this.now); }
  }

  async delete(key: PersistenceKey): Promise<PersistenceResult<boolean>> {
    const context = this.context("delete", key?.id); const invalid = validatePersistenceKey(key, this.scope);
    if (invalid) return persistenceFailure("persistence.invalidKey", invalid, context, this.now);
    return persistenceSuccess(this.records().delete(key.id), context, this.now);
  }

  async list(input: ListRecordsInput): Promise<PersistenceResult<PersistenceListResult<TData>>> {
    const context = this.context("list");
    if (input?.namespace !== this.scope.namespace || input?.collection !== this.scope.collection) return persistenceFailure("persistence.invalidScope", "List input is outside the repository scope.", context, this.now);
    const offset = validInteger(input.offset, 0, 0, Number.MAX_SAFE_INTEGER); const limit = validInteger(input.limit, 50, 1, 1000);
    if (offset === undefined || limit === undefined) return persistenceFailure("persistence.invalidPagination", "Persistence pagination is invalid.", context, this.now);
    const all = [...this.records().values()] as PersistenceRecord<TData>[];
    const result: PersistenceListResult<TData> = Object.freeze({ items: Object.freeze(all.slice(offset, offset + limit)), total: all.length, limit, offset });
    return persistenceSuccess(result, context, this.now);
  }

  async exists(key: PersistenceKey): Promise<PersistenceResult<boolean>> {
    const context = this.context("exists", key?.id); const invalid = validatePersistenceKey(key, this.scope);
    if (invalid) return persistenceFailure("persistence.invalidKey", invalid, context, this.now);
    return persistenceSuccess(this.records().has(key.id), context, this.now);
  }

  async count(input: CountRecordsInput): Promise<PersistenceResult<number>> {
    const context = this.context("count");
    if (input?.namespace !== this.scope.namespace || input?.collection !== this.scope.collection) return persistenceFailure("persistence.invalidScope", "Count input is outside the repository scope.", context, this.now);
    return persistenceSuccess(this.records().size, context, this.now);
  }

  private records(): Map<string, PersistenceRecord> { let records = this.store.get(this.scope.collection); if (!records) { records = new Map(); this.store.set(this.scope.collection, records); } return records; }
  private record(id: string, version: number, data: TData, metadata: ReturnType<typeof cloneRecordMetadata>, createdAt: string, updatedAt: string): PersistenceRecord<TData> { return Object.freeze({ id, namespace: this.scope.namespace, collection: this.scope.collection, version, data, metadata, createdAt, updatedAt }); }
  private context(operation: "create" | "read" | "update" | "delete" | "list" | "exists" | "count", recordId?: string) { return { operation, namespace: this.scope.namespace, collection: this.scope.collection, recordId }; }
}

function validInteger(value: number | undefined, fallback: number, minimum: number, maximum: number): number | undefined { const candidate = value ?? fallback; return Number.isInteger(candidate) && candidate >= minimum && candidate <= maximum ? candidate : undefined; }
