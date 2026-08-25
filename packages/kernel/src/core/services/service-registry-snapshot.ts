import type {
  ServiceDescriptorSnapshot,
  ServiceRegistryDiagnosticEntry,
  ServiceRegistryError,
  ServiceRegistrySnapshot,
  ServiceRegistryWarning
} from "@veltryx/contracts";
import { freezeDescriptor } from "./service-descriptor.js";

export function createServiceRegistrySnapshot(input: {
  readonly generatedAt: Date;
  readonly services: readonly ServiceDescriptorSnapshot[];
  readonly warnings: readonly ServiceRegistryWarning[];
  readonly errors: readonly ServiceRegistryError[];
  readonly diagnostics: readonly ServiceRegistryDiagnosticEntry[];
}): ServiceRegistrySnapshot {
  try {
    const services = Object.freeze(input.services.map(freezeDescriptor));
    const warnings = Object.freeze(
      unique([...input.warnings, ...services.flatMap((service) => service.warnings)]).map((entry) =>
        Object.freeze({ ...entry })
      )
    );
    const errors = Object.freeze(
      unique([...input.errors, ...services.flatMap((service) => service.errors)]).map((entry) =>
        Object.freeze({ ...entry })
      )
    );
    const diagnostics = Object.freeze(
      [...input.diagnostics, ...services.flatMap((service) => service.diagnostics)].map((entry) =>
        Object.freeze({ ...entry })
      )
    );
    const servicesWithWarnings = services.filter(
      (service) => service.warnings.length > 0 || service.status === "warning"
    ).length;
    const servicesWithErrors = services.filter(
      (service) => service.errors.length > 0 || service.status === "error"
    ).length;
    const status =
      errors.length > 0 || servicesWithErrors > 0
        ? "error"
        : services.length === 0
          ? "empty"
          : warnings.length > 0 || servicesWithWarnings > 0
            ? "partial"
            : "ready";
    return Object.freeze({
      status,
      generatedAt: input.generatedAt.toISOString(),
      servicesRegistered: services.length,
      servicesAvailable: services.filter(
        (service) => service.lifecycle === "available" || service.lifecycle === "replaced"
      ).length,
      servicesWithWarnings,
      servicesWithErrors,
      services,
      warnings,
      errors,
      diagnostics
    });
  } catch {
    const error = Object.freeze({
      code: "SERVICE_REGISTRY_SNAPSHOT_FAILED",
      message: "Service Registry snapshot unavailable.",
      source: "service-registry"
    });
    return Object.freeze({
      status: "error",
      generatedAt: safeDate(input.generatedAt),
      servicesRegistered: 0,
      servicesAvailable: 0,
      servicesWithWarnings: 0,
      servicesWithErrors: 0,
      services: Object.freeze([]),
      warnings: Object.freeze([]),
      errors: Object.freeze([error]),
      diagnostics: Object.freeze([{ ...error, severity: "error" as const }])
    });
  }
}

function safeDate(date: Date): string {
  return Number.isNaN(date.getTime()) ? "unavailable" : date.toISOString();
}

function unique<
  TEntry extends { readonly code: string; readonly message: string; readonly token?: string }
>(entries: readonly TEntry[]): readonly TEntry[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${entry.code}:${entry.token ?? "registry"}:${entry.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
