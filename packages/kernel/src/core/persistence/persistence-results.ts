import type { PersistenceDiagnostic, PersistenceError, PersistenceOperation, PersistenceResult } from "@veltryx/contracts";

interface Context { readonly operation: PersistenceOperation; readonly namespace: string; readonly collection: string; readonly recordId?: string }

export function persistenceSuccess<T>(data: T, context: Context, now: () => Date): PersistenceResult<T> {
  const diagnostic = diagnosticFor("persistence.operationCompleted", "Persistence operation completed.", "info", now);
  return Object.freeze({ ok: true, data, warnings: Object.freeze([]), diagnostics: Object.freeze([diagnostic]) });
}

export function persistenceFailure<T>(code: string, message: string, context: Context, now: () => Date): PersistenceResult<T> {
  const error: PersistenceError = Object.freeze({ code, message, operation: context.operation, namespace: context.namespace, collection: context.collection, recordId: context.recordId });
  const diagnostic = diagnosticFor(code, message, "error", now);
  return Object.freeze({ ok: false, error, warnings: Object.freeze([]), diagnostics: Object.freeze([diagnostic]) });
}

function diagnosticFor(code: string, message: string, level: "info" | "error", now: () => Date): PersistenceDiagnostic {
  return Object.freeze({ code, message, level, timestamp: now().toISOString() });
}
