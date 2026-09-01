import type { ComponentRegistryDiagnosticEntry, ComponentRegistryError, ComponentRegistryWarning } from "@veltryx/contracts";

const SECRET_KEY_PATTERN = /(password|secret|token|privatekey|api_?key|credential)/i;
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
  Object.freeze(["factory"]),
  Object.freeze(["mapping"])
]);

export function createComponentDiagnostic(input: {
  readonly code: string;
  readonly message: string;
  readonly severity: ComponentRegistryDiagnosticEntry["severity"];
  readonly details?: Readonly<Record<string, unknown>>;
  readonly timestamp?: string;
}): ComponentRegistryDiagnosticEntry {
  return freezeComponentValue({
    code: input.code,
    message: input.message,
    severity: input.severity,
    source: "components",
    details: input.details ? sanitizeDetails(input.details) : undefined,
    timestamp: input.timestamp
  });
}

export function createComponentWarning(
  code: string,
  message: string,
  details?: Readonly<Record<string, unknown>>,
  timestamp?: string
): ComponentRegistryWarning {
  const diagnostic = createComponentDiagnostic({ code, message, severity: "warning", details, timestamp });
  return freezeComponentValue({
    code: diagnostic.code,
    message: diagnostic.message,
    source: diagnostic.source,
    details: diagnostic.details,
    timestamp: diagnostic.timestamp
  });
}

export function createComponentError(
  code: string,
  message: string,
  details?: Readonly<Record<string, unknown>>,
  timestamp?: string
): ComponentRegistryError {
  const diagnostic = createComponentDiagnostic({ code, message, severity: "error", details, timestamp });
  return freezeComponentValue({
    code: diagnostic.code,
    message: diagnostic.message,
    source: diagnostic.source,
    details: diagnostic.details,
    timestamp: diagnostic.timestamp
  });
}

export function freezeComponentValue<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    for (const item of value) freezeComponentValue(item);
    return Object.freeze(value) as T;
  }
  for (const key of Object.keys(value as Record<string, unknown>)) {
    freezeComponentValue((value as Record<string, unknown>)[key]);
  }
  return Object.freeze(value);
}

export function cloneComponentValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function cloneAndFreezeComponentValue<T>(value: T): T {
  return freezeComponentValue(cloneComponentValue(value));
}

export function isPlainComponentObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function hasUnsafeComponentValue(value: unknown): boolean {
  if (typeof value === "function" || typeof value === "symbol" || typeof value === "bigint") return true;
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.some((item) => hasUnsafeComponentValue(item));
  if (typeof value === "object") {
    if (!isPlainComponentObject(value)) return true;
    return Object.entries(value).some(([key, nested]) => SECRET_KEY_PATTERN.test(key) || isPlatformBoundComponentKey(key) || hasUnsafeComponentValue(nested));
  }
  return false;
}

function sanitizeDetails(details: Readonly<Record<string, unknown>>): Readonly<Record<string, unknown>> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details)) {
    if (SECRET_KEY_PATTERN.test(key) || isPlatformBoundComponentKey(key)) continue;
    if (typeof value === "function" || typeof value === "symbol" || typeof value === "bigint") continue;
    if (value instanceof Error) {
      safe[key] = value.message;
      continue;
    }
    if (value === null || ["string", "number", "boolean"].includes(typeof value)) safe[key] = value;
  }
  return freezeComponentValue(safe);
}

function isPlatformBoundComponentKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return PLATFORM_BOUND_KEY_PARTS.some((parts) => normalized === parts.join("").toLowerCase());
}

