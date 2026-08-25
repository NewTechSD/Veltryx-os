import type { ServiceDescriptorInput, ServiceProvider, ServiceToken } from "@veltryx/contracts";
import { freezeServiceToken } from "./service-token.js";

const CATEGORIES = new Set([
  "kernel",
  "configuration",
  "events",
  "modules",
  "metadata",
  "runtime",
  "execution",
  "status",
  "system"
]);
const SCOPES = new Set([
  "global",
  "singleton",
  "transient",
  "scoped",
  "request",
  "tenant",
  "workspace"
]);
const LIFECYCLES = new Set([
  "registered",
  "available",
  "unavailable",
  "replaced",
  "removed",
  "error"
]);
const STATUSES = new Set(["ok", "warning", "error", "unknown"]);

export class ServiceRegistryValidator {
  validateToken(token: ServiceToken): ServiceToken {
    return freezeServiceToken(token);
  }

  validateService(service: unknown): void {
    if (service === null || service === undefined)
      throw new Error("Service instance must be defined");
  }

  validateProvider(provider: ServiceProvider): ServiceToken {
    if (!provider || typeof provider.resolve !== "function")
      throw new Error("Service provider must expose a resolve function");
    return this.validateToken(provider.token);
  }

  validateDescriptor(descriptor: ServiceDescriptorInput): void {
    if (!descriptor || typeof descriptor !== "object")
      throw new Error("Service descriptor must be defined");
    if (!descriptor.name?.trim())
      throw new Error("Service descriptor name must be a non-empty string");
    if (!descriptor.category || !CATEGORIES.has(descriptor.category))
      throw new Error("Service descriptor category is invalid");
    if (!descriptor.scope || !SCOPES.has(descriptor.scope))
      throw new Error("Service descriptor scope is invalid");
    if (!descriptor.lifecycle || !LIFECYCLES.has(descriptor.lifecycle))
      throw new Error("Service descriptor lifecycle is invalid");
    if (descriptor.status !== undefined && !STATUSES.has(descriptor.status))
      throw new Error("Service descriptor status is invalid");
    if (descriptor.tags?.some((tag) => !tag.trim()))
      throw new Error("Service descriptor tags must be non-empty strings");
  }
}
