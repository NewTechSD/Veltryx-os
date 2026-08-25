import type { KernelDiagnosticEntry, KernelStatusSnapshot } from "./kernel-status-types";

export interface DiagnosticsStatus {
  readonly appName: string;
  readonly appVersion: string;
  readonly environment: string;
  readonly bootTimestamp: string;
  readonly uptime: string;
  readonly kernelStatus: KernelStatusSnapshot["kernelStatus"];
  readonly bootStatus: KernelStatusSnapshot["bootStatus"];
  readonly moduleSystemStatus: KernelStatusSnapshot["moduleSystemStatus"];
  readonly metadataRegistryStatus: KernelStatusSnapshot["metadataRegistryStatus"];
  readonly runtimeStatus: KernelStatusSnapshot["runtimeStatus"];
  readonly diagnostics: readonly KernelDiagnosticEntry[];
  readonly warnings: readonly KernelDiagnosticEntry[];
  readonly errors: readonly KernelDiagnosticEntry[];
}

export interface DiagnosticsStatusOptions {
  readonly appName?: string;
  readonly appVersion?: string;
  readonly environment?: string;
  readonly uptimeSeconds?: number;
  readonly includeTechnicalDetails?: boolean;
}

export function createDiagnosticsStatus(
  snapshot: KernelStatusSnapshot,
  options: DiagnosticsStatusOptions = {}
): DiagnosticsStatus {
  const includeTechnicalDetails = options.includeTechnicalDetails ?? snapshot.environment === "development";

  return {
    appName: options.appName ?? process.env.NEXT_PUBLIC_APP_NAME ?? process.env.npm_package_name ?? "unavailable",
    appVersion: options.appVersion ?? process.env.NEXT_PUBLIC_APP_VERSION ?? process.env.npm_package_version ?? "unavailable",
    environment: options.environment ?? process.env.NEXT_PUBLIC_APP_ENV ?? snapshot.environment,
    bootTimestamp: snapshot.bootTimestamp ?? "unavailable",
    uptime: options.uptimeSeconds === undefined ? "unavailable" : `${Math.max(0, Math.floor(options.uptimeSeconds))}s`,
    kernelStatus: snapshot.kernelStatus,
    bootStatus: snapshot.bootStatus,
    moduleSystemStatus: snapshot.moduleSystemStatus,
    metadataRegistryStatus: snapshot.metadataRegistryStatus,
    runtimeStatus: snapshot.runtimeStatus,
    diagnostics: sanitizeDiagnostics(snapshot.diagnostics, includeTechnicalDetails),
    warnings: sanitizeDiagnostics(snapshot.warnings, includeTechnicalDetails),
    errors: sanitizeDiagnostics(snapshot.errors, includeTechnicalDetails)
  };
}

function sanitizeDiagnostics(
  entries: readonly KernelDiagnosticEntry[],
  includeTechnicalDetails: boolean
): readonly KernelDiagnosticEntry[] {
  if (includeTechnicalDetails) {
    return entries;
  }

  return entries.map((entry) => ({
    code: entry.code,
    message: entry.message,
    severity: entry.severity,
    source: entry.source,
    detail: entry.detail
  }));
}


