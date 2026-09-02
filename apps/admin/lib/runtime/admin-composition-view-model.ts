export type AdminCompositionStatus = "ready" | "empty" | "warning" | "error";

export interface AdminCompositionIssueViewModel {
  readonly code: string;
  readonly message: string;
  readonly severity: "info" | "warning" | "error";
  readonly source: string;
  readonly timestamp?: string;
}

export interface AdminCompositionNodeViewModel {
  readonly id: string;
  readonly componentKey: string;
  readonly componentVersion?: string;
  readonly props: Readonly<Record<string, unknown>>;
  readonly children: readonly AdminCompositionNodeViewModel[];
  readonly slots: Readonly<Record<string, readonly AdminCompositionNodeViewModel[]>>;
}

export interface AdminCompositionTreeViewModel {
  readonly id: string;
  readonly source: string;
  readonly sourceType: string;
  readonly generatedAt: string;
  readonly root: AdminCompositionNodeViewModel;
}

export interface AdminCompositionScreenViewModel {
  readonly status: AdminCompositionStatus;
  readonly title: string;
  readonly description?: string;
  readonly sourceType: string;
  readonly sourceId: string;
  readonly namespace?: string;
  readonly generatedAt: string;
  readonly tree?: AdminCompositionTreeViewModel;
  readonly warnings: readonly AdminCompositionIssueViewModel[];
  readonly errors: readonly AdminCompositionIssueViewModel[];
  readonly diagnostics: readonly AdminCompositionIssueViewModel[];
}
