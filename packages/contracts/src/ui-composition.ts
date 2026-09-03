import type { RuntimeContextSnapshot } from "./runtime.js";

export type CompositionStatus = "empty" | "ready" | "partial" | "error";
export type CompositionDiagnosticSeverity = "info" | "warning" | "error";
export type CompositionSourceType = "page" | "view" | "form" | "list" | "menu" | "custom";

export interface CompositionInput {
  readonly sourceType: CompositionSourceType;
  readonly sourceId: string;
  readonly namespace?: string;
  readonly metadata?: unknown;
  readonly runtimeContext?: RuntimeContextSnapshot;
}

export interface CompositionBinding {
  readonly prop: string;
  readonly source: string;
  readonly path?: string;
}

export interface CompositionActionBinding {
  readonly action: string;
  readonly target?: string;
  readonly payload?: Readonly<Record<string, unknown>>;
}

export interface CompositionVisibilityRule {
  readonly condition: string;
  readonly source?: string;
}

export interface CompositionDiagnosticEntry {
  readonly code: string;
  readonly message: string;
  readonly severity: CompositionDiagnosticSeverity;
  readonly source: "ui-composition";
  readonly details?: Readonly<Record<string, unknown>>;
  readonly timestamp?: string;
}

export type CompositionWarning = Omit<CompositionDiagnosticEntry, "severity">;
export type CompositionError = Omit<CompositionDiagnosticEntry, "severity">;

export interface CompositionNode {
  readonly id: string;
  readonly componentKey: string;
  readonly componentVersion?: string;
  readonly props?: Readonly<Record<string, unknown>>;
  readonly bindings?: readonly CompositionBinding[];
  readonly children?: readonly CompositionNode[];
  readonly slots?: Readonly<Record<string, readonly CompositionNode[]>>;
  readonly actions?: readonly CompositionActionBinding[];
  readonly visibility?: CompositionVisibilityRule;
  readonly diagnostics?: readonly CompositionDiagnosticEntry[];
}

export interface CompositionTree {
  readonly id: string;
  readonly source: string;
  readonly sourceType: CompositionSourceType;
  readonly root: CompositionNode;
  readonly generatedAt: string;
  readonly warnings: readonly CompositionWarning[];
  readonly errors: readonly CompositionError[];
  readonly diagnostics: readonly CompositionDiagnosticEntry[];
}

export interface CompositionValidationResult {
  readonly valid: boolean;
  readonly warnings: readonly CompositionWarning[];
  readonly errors: readonly CompositionError[];
}

export interface CompositionResolutionResult {
  readonly valid: boolean;
  readonly missingComponents: readonly string[];
  readonly warnings: readonly CompositionWarning[];
  readonly errors: readonly CompositionError[];
}

export interface UICompositionSnapshot {
  readonly status: CompositionStatus;
  readonly generatedAt: string;
  readonly compositionsGenerated: number;
  readonly lastCompositionAt?: string;
  readonly lastSourceType?: string;
  readonly lastSourceId?: string;
  readonly warnings: readonly CompositionWarning[];
  readonly errors: readonly CompositionError[];
  readonly diagnostics: readonly CompositionDiagnosticEntry[];
}

export interface ICompositionValidator {
  validate(tree: CompositionTree): CompositionValidationResult;
}

export interface ICompositionResolver {
  resolve(tree: CompositionTree): CompositionResolutionResult;
}

export interface ICompositionSnapshotService {
  snapshot(input: {
    readonly compositionsGenerated: number;
    readonly lastCompositionAt?: string;
    readonly lastSourceType?: string;
    readonly lastSourceId?: string;
    readonly warnings: readonly CompositionWarning[];
    readonly errors: readonly CompositionError[];
    readonly diagnostics: readonly CompositionDiagnosticEntry[];
  }): UICompositionSnapshot;
}

export interface IUICompositionRuntime {
  compose(input: CompositionInput): CompositionTree;
  validate(tree: CompositionTree): CompositionValidationResult;
  snapshot(): UICompositionSnapshot;
}

export type UICompositionPersistenceStatus = "ready" | "empty" | "warning" | "error";
export type UICompositionPersistenceOperation = "persistCompositionSnapshot" | "composeAndPersist" | "loadCompositionSnapshot" | "loadLatestCompositionSnapshot" | "listCompositionSnapshots" | "deleteCompositionSnapshot";
export type CompositionSnapshotPurpose = "preview" | "cache" | "audit" | "diagnostic" | "test";
export interface CompositionSnapshotEntry { readonly snapshotId: string; readonly sourceType: CompositionSourceType; readonly namespace: string; readonly sourceId: string; readonly purpose: CompositionSnapshotPurpose; readonly tree: CompositionTree; readonly generatedAt: string; readonly persistedAt: string; readonly checksum?: string; readonly metadata?: Readonly<{ persistedBy?: string; reason?: string }> }
export type CompositionSnapshotEntrySummary = Omit<CompositionSnapshotEntry, "tree" | "metadata">;
export interface PersistCompositionSnapshotInput { readonly tree: CompositionTree; readonly namespace: string; readonly sourceId: string; readonly purpose: CompositionSnapshotPurpose; readonly snapshotId?: string; readonly metadata?: Readonly<{ persistedBy?: string; reason?: string }> }
export interface ComposeAndPersistInput { readonly composition: CompositionInput; readonly purpose: CompositionSnapshotPurpose; readonly snapshotId?: string; readonly metadata?: Readonly<{ persistedBy?: string; reason?: string }> }
export interface LoadCompositionSnapshotInput { readonly snapshotId: string }
export interface LoadLatestCompositionSnapshotInput { readonly sourceType: CompositionSourceType; readonly namespace: string; readonly sourceId: string }
export interface ListCompositionSnapshotsInput { readonly sourceType?: CompositionSourceType; readonly namespace?: string; readonly sourceId?: string; readonly limit?: number; readonly offset?: number }
export interface DeleteCompositionSnapshotInput { readonly snapshotId: string }
export interface UICompositionPersistenceResult<T = undefined> { readonly ok: boolean; readonly data?: T; readonly warnings: readonly CompositionWarning[]; readonly errors: readonly CompositionError[]; readonly diagnostics: readonly CompositionDiagnosticEntry[] }
export interface UICompositionPersistenceSummary { readonly status: UICompositionPersistenceStatus; readonly providerId: string; readonly providerKind: import("./persistence.js").PersistenceProviderKind; readonly snapshotsPersisted: number; readonly snapshotsLoaded: number; readonly latestSnapshotsTracked: number; readonly warnings: number; readonly errors: number; readonly diagnostics: number }
export interface UICompositionPersistenceSnapshot { readonly status: UICompositionPersistenceStatus; readonly generatedAt: string; readonly provider: { readonly id: string; readonly kind: import("./persistence.js").PersistenceProviderKind }; readonly snapshotsPersisted: number; readonly snapshotsLoaded: number; readonly latestSnapshotsTracked: number; readonly warnings: readonly CompositionWarning[]; readonly errors: readonly CompositionError[]; readonly diagnostics: readonly CompositionDiagnosticEntry[] }
export interface IUICompositionPersistenceService {
  persistCompositionSnapshot(input: PersistCompositionSnapshotInput): Promise<UICompositionPersistenceResult<CompositionSnapshotEntry>>;
  composeAndPersist(input: ComposeAndPersistInput): Promise<UICompositionPersistenceResult<CompositionSnapshotEntry>>;
  loadCompositionSnapshot(input: LoadCompositionSnapshotInput): Promise<UICompositionPersistenceResult<CompositionTree | null>>;
  loadLatestCompositionSnapshot(input: LoadLatestCompositionSnapshotInput): Promise<UICompositionPersistenceResult<CompositionTree | null>>;
  listCompositionSnapshots(input?: ListCompositionSnapshotsInput): Promise<UICompositionPersistenceResult<readonly CompositionSnapshotEntrySummary[]>>;
  deleteCompositionSnapshot(input: DeleteCompositionSnapshotInput): Promise<UICompositionPersistenceResult<boolean>>;
  snapshot(): UICompositionPersistenceSnapshot;
}
