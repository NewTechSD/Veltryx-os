import type { MetadataDiagnosticEntry, MetadataError, MetadataWarning } from "@veltryx/contracts";

const SECRET_KEY_PATTERN = /(password|secret|token|privatekey|api_?key|credential)/i;

export function createMetadataDiagnostic(input: {
  readonly code: string;
  readonly message: string;
  readonly severity: MetadataDiagnosticEntry["severity"];
  readonly source?: string;
  readonly details?: Readonly<Record<string, unknown>>;
  readonly timestamp?: string;
}): MetadataDiagnosticEntry {
  const entry: MetadataDiagnosticEntry = {
    code: input.code,
    message: input.message,
    severity: input.severity,
    source: input.source ?? "metadata",
    details: input.details ? sanitizeDetails(input.details) : undefined,
    timestamp: input.timestamp
  };
  return freezeMetadataValue(entry);
}

export function createMetadataWarning(
  code: string,
  message: string,
  source = "metadata",
  details?: Readonly<Record<string, unknown>>,
  timestamp?: string
): MetadataWarning {
  const diagnostic = createMetadataDiagnostic({ code, message, severity: "warning", source, details, timestamp });
  return freezeMetadataValue({
    code: diagnostic.code,
    message: diagnostic.message,
    source: diagnostic.source,
    details: diagnostic.details,
    timestamp: diagnostic.timestamp
  });
}

export function createMetadataError(
  code: string,
  message: string,
  source = "metadata",
  details?: Readonly<Record<string, unknown>>,
  timestamp?: string
): MetadataError {
  const diagnostic = createMetadataDiagnostic({ code, message, severity: "error", source, details, timestamp });
  return freezeMetadataValue({
    code: diagnostic.code,
    message: diagnostic.message,
    source: diagnostic.source,
    details: diagnostic.details,
    timestamp: diagnostic.timestamp
  });
}

export function normalizeMetadataFailure(error: unknown, code = "metadata.snapshotFailed"): MetadataError {
  if (error instanceof Error) return createMetadataError(code, error.message || "Metadata operation failed.");
  return createMetadataError(code, "Metadata operation failed.");
}

export function freezeMetadataValue<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    for (const item of value) freezeMetadataValue(item);
    return Object.freeze(value) as T;
  }
  for (const key of Object.keys(value as Record<string, unknown>)) {
    freezeMetadataValue((value as Record<string, unknown>)[key]);
  }
  return Object.freeze(value);
}

export function cloneMetadataValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function cloneAndFreezeMetadataValue<T>(value: T): T {
  return freezeMetadataValue(cloneMetadataValue(value));
}

export function isPlainMetadataObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function hasUnsafeMetadataValue(value: unknown): boolean {
  if (typeof value === "function" || typeof value === "symbol" || typeof value === "bigint") return true;
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.some((item) => hasUnsafeMetadataValue(item));
  if (typeof value === "object") {
    if (!isPlainMetadataObject(value)) return true;
    return Object.entries(value).some(([key, nested]) => SECRET_KEY_PATTERN.test(key) || hasUnsafeMetadataValue(nested));
  }
  return false;
}

function sanitizeDetails(details: Readonly<Record<string, unknown>>): Readonly<Record<string, unknown>> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details)) {
    if (SECRET_KEY_PATTERN.test(key)) continue;
    if (typeof value === "function" || typeof value === "symbol" || typeof value === "bigint") continue;
    if (value instanceof Error) {
      safe[key] = value.message;
      continue;
    }
    if (value === null || ["string", "number", "boolean"].includes(typeof value)) safe[key] = value;
  }
  return freezeMetadataValue(safe);
}

