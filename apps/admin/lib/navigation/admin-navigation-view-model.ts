export type AdminNavigationStatus = "ready" | "empty" | "warning" | "error";

export interface AdminNavigationIssueViewModel {
  readonly code: string;
  readonly message: string;
  readonly severity: "info" | "warning" | "error";
  readonly source: string;
}

export interface AdminNavigationItemViewModel {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly active: boolean;
  readonly disabled: boolean;
  readonly badge?: string;
  readonly description?: string;
}

export interface AdminNavigationGroupViewModel {
  readonly id: string;
  readonly label: string;
  readonly items: readonly AdminNavigationItemViewModel[];
}

export interface AdminNavigationViewModel {
  readonly status: AdminNavigationStatus;
  readonly generatedAt: string;
  readonly currentPath?: string;
  readonly groups: readonly AdminNavigationGroupViewModel[];
  readonly warnings: readonly AdminNavigationIssueViewModel[];
  readonly errors: readonly AdminNavigationIssueViewModel[];
  readonly diagnostics: readonly AdminNavigationIssueViewModel[];
}
