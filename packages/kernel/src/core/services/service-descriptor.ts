import type {
  ServiceDescriptorInput,
  ServiceDescriptorSnapshot,
  ServiceRegistryDiagnosticEntry,
  ServiceRegistryWarning,
  ServiceStatus,
  ServiceToken
} from "@veltryx/contracts";

export function createServiceDescriptor(
  token: ServiceToken,
  input: ServiceDescriptorInput,
  registeredAt: Date,
  available: boolean,
  replacement = false
): ServiceDescriptorSnapshot {
  const warnings: ServiceRegistryWarning[] = [...(input.warnings ?? [])];
  if ((input.tags ?? []).length === 0)
    warnings.push({
      code: "SERVICE_TAGS_EMPTY",
      message: "Service was registered without tags.",
      token: token.id,
      source: "service-registry"
    });
  if (replacement)
    warnings.push({
      code: "SERVICE_REPLACED",
      message: "Service registration replaced a previous entry through explicit authorization.",
      token: token.id,
      source: "service-registry"
    });

  const errors = [...(input.errors ?? [])];
  const lifecycle = replacement ? "replaced" : input.lifecycle;
  const status: ServiceStatus =
    errors.length > 0
      ? "error"
      : warnings.length > 0
        ? "warning"
        : (input.status ?? (available ? "ok" : "unknown"));
  const diagnostics: ServiceRegistryDiagnosticEntry[] = [...(input.diagnostics ?? [])];

  return freezeDescriptor({
    token: token.id,
    name: input.name.trim(),
    description: input.description,
    category: input.category,
    lifecycle,
    scope: input.scope,
    status,
    registeredAt: registeredAt.toISOString(),
    source: input.source ?? token.owner,
    version: input.version ?? token.version,
    tags: input.tags ?? [],
    warnings,
    errors,
    diagnostics
  });
}

export function freezeDescriptor(descriptor: ServiceDescriptorSnapshot): ServiceDescriptorSnapshot {
  return Object.freeze({
    ...descriptor,
    tags: Object.freeze([...descriptor.tags]),
    warnings: Object.freeze(descriptor.warnings.map((entry) => Object.freeze({ ...entry }))),
    errors: Object.freeze(descriptor.errors.map((entry) => Object.freeze({ ...entry }))),
    diagnostics: Object.freeze(descriptor.diagnostics.map((entry) => Object.freeze({ ...entry })))
  });
}
