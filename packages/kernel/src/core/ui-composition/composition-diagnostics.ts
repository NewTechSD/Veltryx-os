import type { CompositionDiagnosticEntry, CompositionError, CompositionWarning } from "@veltryx/contracts";
import { freezeComponentValue, hasUnsafeComponentValue, isPlainComponentObject } from "../components/component-diagnostics.js";

const PLATFORM_BOUND_KEY_PARTS: readonly (readonly string[])[] = Object.freeze([
  Object.freeze(["t", "sxPath"]),
  Object.freeze(["j", "sxPath"]),
  Object.freeze(["p", "hpTemplate"]),
  Object.freeze(["short", "code"]),
  Object.freeze(["block", "Json"]),
  Object.freeze(["component", "File"]),
  Object.freeze(["implementation", "Path"]),
  Object.freeze(["template", "Php"]),
  Object.freeze(["render"]),
  Object.freeze(["renderer"]),
  Object.freeze(["factory"])
]);

export function createCompositionDiagnostic(input: {
  readonly code: string;
  readonly message: string;
  readonly severity: CompositionDiagnosticEntry["severity"];
  readonly details?: Readonly<Record<string, unknown>>;
  readonly timestamp?: string;
}): CompositionDiagnosticEntry {
  return freezeComponentValue({
    code: input.code,
    message: input.message,
    severity: input.severity,
    source: "ui-composition",
    details: sanitizeDetails(input.details),
    timestamp: input.timestamp
  });
}

export function createCompositionWarning(code: string, message: string, details?: Readonly<Record<string, unknown>>, timestamp?: string): CompositionWarning {
  const diagnostic = createCompositionDiagnostic({ code, message, severity: "warning", details, timestamp });
  return freezeComponentValue({ code: diagnostic.code, message: diagnostic.message, source: diagnostic.source, details: diagnostic.details, timestamp: diagnostic.timestamp });
}

export function createCompositionError(code: string, message: string, details?: Readonly<Record<string, unknown>>, timestamp?: string): CompositionError {
  const diagnostic = createCompositionDiagnostic({ code, message, severity: "error", details, timestamp });
  return freezeComponentValue({ code: diagnostic.code, message: diagnostic.message, source: diagnostic.source, details: diagnostic.details, timestamp: diagnostic.timestamp });
}

export function cloneAndFreezeCompositionValue<T>(value: T): T {
  return freezeComponentValue(JSON.parse(JSON.stringify(value)) as T);
}

export function hasUnsafeCompositionValue(value: unknown): boolean {
  return hasUnsafeComponentValue(value) || hasPlatformElementShape(value) || hasPlatformBoundKeys(value);
}

function hasPlatformElementShape(value: unknown, seen = new Set<unknown>()): boolean {
  if (value === null || typeof value !== "object" || seen.has(value)) return false;
  seen.add(value);
  if (!Array.isArray(value) && isPlainComponentObject(value)) {
    const record = value as Record<string, unknown>;
    if ("$$typeof" in record || "owner" in record && "props" in record || "props" in record && "type" in record && "key" in record) return true;
  }
  return Object.values(value).some((nested) => hasPlatformElementShape(nested, seen));
}

function hasPlatformBoundKeys(value: unknown, seen = new Set<unknown>()): boolean {
  if (value === null || typeof value !== "object" || seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) return value.some((nested) => hasPlatformBoundKeys(nested, seen));
  return Object.entries(value).some(([key, nested]) => isPlatformBoundKey(key) || hasPlatformBoundKeys(nested, seen));
}

function isPlatformBoundKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return PLATFORM_BOUND_KEY_PARTS.some((parts) => normalized === parts.join("").toLowerCase());
}

function sanitizeDetails(details?: Readonly<Record<string, unknown>>): Readonly<Record<string, unknown>> | undefined {
  if (!details) return undefined;
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details)) {
    if (/(password|secret|token|privatekey|api_?key|credential|stack)/i.test(key)) continue;
    if (isPlatformBoundKey(key)) continue;
    if (value === null || ["string", "number", "boolean"].includes(typeof value)) safe[key] = value;
  }
  return freezeComponentValue(safe);
}

