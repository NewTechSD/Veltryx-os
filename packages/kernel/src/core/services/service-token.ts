import type { ServiceToken } from "@veltryx/contracts";

export const KERNEL_SERVICE_TOKENS = Object.freeze({
  configuration: "kernel.configuration",
  eventBus: "kernel.eventBus",
  moduleSystem: "kernel.moduleSystem",
  executionContextFactory: "kernel.executionContextFactory",
  status: "kernel.status",
  metadataRegistry: "kernel.metadataRegistry",
  metadataEngine: "kernel.metadataEngine",
  runtime: "kernel.runtime",
  serviceRegistry: "kernel.serviceRegistry",
  dependencyInjection: "kernel.dependencyInjection",
  runtimeBootstrap: "kernel.runtimeBootstrap",
  componentRegistry: "kernel.componentRegistry",
  uiCompositionRuntime: "kernel.uiCompositionRuntime",
  persistence: "kernel.persistence",
  metadataPersistence: "kernel.metadataPersistence",
  configurationPersistence: "kernel.configurationPersistence",
  componentPersistence: "kernel.componentPersistence",
  uiCompositionPersistence: "kernel.uiCompositionPersistence",
  snapshotRetentionAudit: "kernel.snapshotRetentionAudit",
  runtimeApi: "kernel.runtimeApi",
  auth: "kernel.auth"
} as const);

const TOKEN_PATTERN = /^[a-z][a-z0-9]*(?:[._-][A-Za-z0-9]+)+$/;

export function validateServiceTokenId(token: string): void {
  if (token.trim().length === 0) throw new Error("Service token must be a non-empty string");
  if (!TOKEN_PATTERN.test(token)) throw new Error(`Service token is malformed: ${token}`);
}

export function serviceTokenId(token: ServiceToken | string): string {
  const id = typeof token === "string" ? token : token.id;
  validateServiceTokenId(id);
  return id;
}

export function freezeServiceToken(token: ServiceToken): ServiceToken {
  validateServiceTokenId(token.id);
  if (!token.version.trim()) throw new Error("Service token version must be a non-empty string");
  if (!token.owner.trim()) throw new Error("Service token owner must be a non-empty string");
  return Object.freeze({ ...token });
}


