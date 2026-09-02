export type PersistenceStatus = "ready" | "warning" | "error" | "empty";
export type PersistenceOperation = "create" | "read" | "update" | "delete" | "list" | "count" | "exists";
export type PersistenceProviderKind = "memory" | "database" | "external" | "custom";
export type PersistenceValue = string | number | boolean | null | readonly PersistenceValue[] | { readonly [key: string]: PersistenceValue };
export type PersistenceRecordData = { readonly [key: string]: PersistenceValue };
export type PersistenceRecordId = string;
export type PersistenceCollectionName = string;
export type PersistenceNamespace = string;

export interface PersistenceKey { readonly namespace: PersistenceNamespace; readonly collection: PersistenceCollectionName; readonly id: PersistenceRecordId }
export interface RepositoryInput { readonly namespace: PersistenceNamespace; readonly collection: PersistenceCollectionName }
export interface PersistenceRecordMetadata { readonly source?: string; readonly tenantId?: string; readonly workspaceId?: string; readonly createdBy?: string; readonly updatedBy?: string; readonly tags?: readonly string[] }
export interface PersistenceRecord<TData extends PersistenceRecordData = PersistenceRecordData> { readonly id: PersistenceRecordId; readonly namespace: PersistenceNamespace; readonly collection: PersistenceCollectionName; readonly version: number; readonly data: TData; readonly metadata: PersistenceRecordMetadata; readonly createdAt: string; readonly updatedAt: string }
export interface CreateRecordInput<TData extends PersistenceRecordData = PersistenceRecordData> extends PersistenceKey { readonly data: TData; readonly metadata?: PersistenceRecordMetadata }
export interface UpdateRecordInput<TData extends PersistenceRecordData = PersistenceRecordData> extends PersistenceKey { readonly data: TData; readonly metadata?: PersistenceRecordMetadata }
export interface ListRecordsInput { readonly namespace: PersistenceNamespace; readonly collection: PersistenceCollectionName; readonly limit?: number; readonly offset?: number }
export interface CountRecordsInput { readonly namespace: PersistenceNamespace; readonly collection: PersistenceCollectionName }
export interface PersistenceListResult<TData extends PersistenceRecordData = PersistenceRecordData> { readonly items: readonly PersistenceRecord<TData>[]; readonly total: number; readonly limit: number; readonly offset: number }

export interface PersistenceError { readonly code: string; readonly message: string; readonly operation?: PersistenceOperation; readonly namespace?: string; readonly collection?: string; readonly recordId?: string }
export interface PersistenceWarning { readonly code: string; readonly message: string; readonly operation?: PersistenceOperation; readonly namespace?: string; readonly collection?: string; readonly recordId?: string }
export interface PersistenceDiagnostic { readonly code: string; readonly message: string; readonly level: "info" | "warning" | "error"; readonly timestamp: string }
export interface PersistenceResult<T> { readonly ok: boolean; readonly data?: T; readonly error?: PersistenceError; readonly warnings: readonly PersistenceWarning[]; readonly diagnostics: readonly PersistenceDiagnostic[] }

export interface PersistenceProviderSnapshot { readonly id: string; readonly name: string; readonly kind: PersistenceProviderKind }
export interface PersistenceSnapshot { readonly status: PersistenceStatus; readonly generatedAt: string; readonly provider: PersistenceProviderSnapshot; readonly namespaces: number; readonly collections: number; readonly records: number; readonly warnings: readonly PersistenceWarning[]; readonly errors: readonly PersistenceError[]; readonly diagnostics: readonly PersistenceDiagnostic[] }
export interface PersistenceSummary { readonly status: PersistenceStatus; readonly providerId: string; readonly providerKind: PersistenceProviderKind; readonly namespaces: number; readonly collections: number; readonly records: number; readonly warnings: number; readonly errors: number; readonly diagnostics: number }

export interface IRepository<TData extends PersistenceRecordData = PersistenceRecordData> {
  create(input: CreateRecordInput<TData>): Promise<PersistenceResult<PersistenceRecord<TData>>>;
  get(key: PersistenceKey): Promise<PersistenceResult<PersistenceRecord<TData> | null>>;
  update(input: UpdateRecordInput<TData>): Promise<PersistenceResult<PersistenceRecord<TData>>>;
  delete(key: PersistenceKey): Promise<PersistenceResult<boolean>>;
  list(input: ListRecordsInput): Promise<PersistenceResult<PersistenceListResult<TData>>>;
  exists(key: PersistenceKey): Promise<PersistenceResult<boolean>>;
  count(input: CountRecordsInput): Promise<PersistenceResult<number>>;
}

export interface IPersistenceProvider {
  readonly id: string;
  readonly name: string;
  readonly kind: PersistenceProviderKind;
  repository<TData extends PersistenceRecordData = PersistenceRecordData>(input: RepositoryInput): IRepository<TData>;
  snapshot(): PersistenceSnapshot;
}

export interface IPersistenceService {
  provider(): IPersistenceProvider;
  repository<TData extends PersistenceRecordData = PersistenceRecordData>(input: RepositoryInput): IRepository<TData>;
  snapshot(): PersistenceSnapshot;
}
