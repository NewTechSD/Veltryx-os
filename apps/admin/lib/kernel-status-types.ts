import type {
  KernelDiagnosticEntry as PublicKernelDiagnosticEntry,
  KernelSnapshotAvailability as PublicKernelSnapshotAvailability,
  KernelStatus as PublicKernelStatus,
  KernelStatusMetric,
  KernelStatusSnapshot as PublicKernelStatusSnapshot
} from "@veltryx/kernel";

export type KernelSnapshotAvailability = PublicKernelSnapshotAvailability;
export type KernelSnapshotMetric = KernelStatusMetric;
export type KernelDiagnosticEntry = PublicKernelDiagnosticEntry;
export type KernelSnapshotIssue = KernelDiagnosticEntry;
export type KernelStatus = PublicKernelStatus;
export type KernelStatusSnapshot = PublicKernelStatusSnapshot;

export interface KernelStatusCard {
  readonly id: string;
  readonly title: string;
  readonly value: string;
  readonly description: string;
  readonly state: string;
  readonly scope: string;
  readonly tone: "critical" | "neutral" | "success" | "warning";
}

export interface KernelStatusSummary {
  readonly ready: number;
  readonly unavailable: number;
  readonly notImplemented: number;
  readonly errors: number;
}

export interface KernelStatusViewModel {
  readonly status: KernelStatus;
  readonly statusLabel: string;
  readonly generatedAt: string;
  readonly summary: KernelStatusSummary;
  readonly cards: readonly KernelStatusCard[];
  readonly errors: readonly KernelSnapshotIssue[];
  readonly warnings: readonly KernelSnapshotIssue[];
}


