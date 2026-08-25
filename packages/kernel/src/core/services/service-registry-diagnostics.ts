import type { ServiceDescriptorSnapshot, ServiceRegistryDiagnosticEntry } from "@veltryx/contracts";

export function createRegistrySummaryDiagnostics(
  services: readonly ServiceDescriptorSnapshot[],
  replacements: number,
  lastRegistration?: string,
  lastReplacement?: string
): readonly ServiceRegistryDiagnosticEntry[] {
  const byCategory = countBy(services, (service) => service.category);
  const byScope = countBy(services, (service) => service.scope);
  return Object.freeze([
    diagnostic(
      "SERVICE_REGISTRY_CATEGORY_SUMMARY",
      "Service counts by category.",
      JSON.stringify(byCategory)
    ),
    diagnostic(
      "SERVICE_REGISTRY_SCOPE_SUMMARY",
      "Service counts by scope.",
      JSON.stringify(byScope)
    ),
    diagnostic(
      "SERVICE_REGISTRY_REPLACEMENT_SUMMARY",
      "Controlled service replacements.",
      String(replacements)
    ),
    diagnostic(
      "SERVICE_REGISTRY_LAST_REGISTRATION",
      "Last known service registration.",
      lastRegistration ?? "unavailable"
    ),
    diagnostic(
      "SERVICE_REGISTRY_LAST_REPLACEMENT",
      "Last known controlled replacement.",
      lastReplacement ?? "unavailable"
    )
  ]);
}

function countBy(
  services: readonly ServiceDescriptorSnapshot[],
  select: (service: ServiceDescriptorSnapshot) => string
): Readonly<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const service of services) counts[select(service)] = (counts[select(service)] ?? 0) + 1;
  return Object.freeze(counts);
}

function diagnostic(code: string, message: string, detail: string): ServiceRegistryDiagnosticEntry {
  return Object.freeze({ code, message, severity: "info", source: "service-registry", detail });
}
