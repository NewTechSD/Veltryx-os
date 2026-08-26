import type { RuntimeDiagnosticEntry, RuntimeError, RuntimeWarning } from "@veltryx/contracts";

export function createRuntimeEntry(
  code: string,
  message: string,
  timestamp?: string,
  details?: Readonly<Record<string, unknown>>
): RuntimeWarning {
  return Object.freeze({ code, message, source: "runtime", timestamp, details });
}

export function toRuntimeDiagnostic(
  entry: RuntimeWarning | RuntimeError,
  severity: RuntimeDiagnosticEntry["severity"]
): RuntimeDiagnosticEntry {
  return Object.freeze({ ...entry, severity });
}
