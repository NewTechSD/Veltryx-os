import type {
  AdminModuleSystemDiagnosticEntry,
  AdminModuleSystemError,
  AdminModuleSystemWarning
} from "./module-system-view-model";

import type { ModuleDiagnosticViewModel } from "./module-system-view-model";

export interface ModuleDiagnosticOptions {
  readonly includeTechnicalDetails?: boolean;
}

type ModuleDiagnosticInput = AdminModuleSystemDiagnosticEntry | AdminModuleSystemWarning | AdminModuleSystemError;

export function mapModuleWarningToViewModel(warning: AdminModuleSystemWarning): ModuleDiagnosticViewModel {
  return freezeDiagnostic({
    code: warning.code,
    message: warning.message,
    severity: "warning",
    source: warning.source,
    details: warning.detail
  });
}

export function mapModuleErrorToViewModel(error: AdminModuleSystemError): ModuleDiagnosticViewModel {
  return freezeDiagnostic({
    code: error.code,
    message: error.message,
    severity: "error",
    source: error.source,
    details: error.detail
  });
}

export function mapModuleDiagnosticToViewModel(diagnostic: AdminModuleSystemDiagnosticEntry): ModuleDiagnosticViewModel {
  return freezeDiagnostic({
    code: diagnostic.code,
    message: diagnostic.message,
    severity: diagnostic.severity,
    source: diagnostic.source,
    details: diagnostic.detail
  });
}

export function createModuleSystemAdapterError(
  error: unknown,
  options: ModuleDiagnosticOptions = {}
): ModuleDiagnosticViewModel {
  const includeTechnicalDetails = options.includeTechnicalDetails === true;

  if (error instanceof Error) {
    return freezeDiagnostic({
      code: "ADMIN_MODULE_SYSTEM_SNAPSHOT_FAILED",
      message: includeTechnicalDetails ? error.message : "Module System snapshot unavailable.",
      severity: "error",
      source: "admin",
      details: includeTechnicalDetails ? error.message : undefined
    });
  }

  return freezeDiagnostic({
    code: "ADMIN_MODULE_SYSTEM_SNAPSHOT_FAILED",
    message: "Module System snapshot unavailable.",
    severity: "error",
    source: "admin"
  });
}

export function sanitizeModuleDiagnostics(
  diagnostics: readonly ModuleDiagnosticInput[],
  options: ModuleDiagnosticOptions = {}
): readonly ModuleDiagnosticViewModel[] {
  const includeTechnicalDetails = options.includeTechnicalDetails === true;

  return Object.freeze(diagnostics.map((entry) => {
    const severity = "severity" in entry ? entry.severity : "code" in entry && entry.code.includes("WARNING") ? "warning" : "error";
    const detail = includeTechnicalDetails ? entry.detail : entry.detail;

    return freezeDiagnostic({
      code: entry.code,
      message: entry.message,
      severity,
      source: entry.source,
      details: detail
    });
  }));
}

function freezeDiagnostic(diagnostic: ModuleDiagnosticViewModel): ModuleDiagnosticViewModel {
  return Object.freeze({ ...diagnostic });
}