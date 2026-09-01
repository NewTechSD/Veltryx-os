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
