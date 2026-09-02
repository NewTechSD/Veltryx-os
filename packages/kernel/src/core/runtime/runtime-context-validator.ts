import type {
  IRuntimeContextValidator,
  RuntimeContext,
  RuntimeContextValidationResult,
  RuntimeError,
  RuntimeLifecycleStatus
} from "@veltryx/contracts";
import { createRuntimeEntry } from "./runtime-diagnostics.js";

const LIFECYCLES: readonly RuntimeLifecycleStatus[] = [
  "idle",
  "bootstrapping",
  "ready",
  "warning",
  "error",
  "stopped"
];
const ENVIRONMENTS = ["development", "test", "preview", "production"] as const;
const MODES = ["development", "preview", "production", "test"] as const;

export class RuntimeContextValidator implements IRuntimeContextValidator {
  validate(context: RuntimeContext): RuntimeContextValidationResult {
    const errors: RuntimeError[] = [];
    if (!context.runtimeId.trim())
      errors.push(this.error("RUNTIME_CONTEXT_ID_INVALID", "Runtime id must be defined."));
    if (!LIFECYCLES.includes(context.lifecycle))
      errors.push(this.error("RUNTIME_CONTEXT_LIFECYCLE_INVALID", "Runtime lifecycle is invalid."));
    if (!ENVIRONMENTS.includes(context.environment))
      errors.push(
        this.error("RUNTIME_CONTEXT_ENVIRONMENT_INVALID", "Runtime environment is invalid.")
      );
    if (!MODES.includes(context.runtimeMode))
      errors.push(this.error("RUNTIME_CONTEXT_MODE_INVALID", "Runtime mode is invalid."));
    for (const value of this.counters(context))
      if (!Number.isInteger(value) || value < 0)
        errors.push(
          this.error(
            "RUNTIME_CONTEXT_COUNTER_INVALID",
            "Runtime counters must be non-negative integers."
          )
        );
    if (this.containsFunction(context))
      errors.push(
        this.error("RUNTIME_CONTEXT_UNSAFE_VALUE", "Runtime Context cannot contain functions.")
      );
    return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
  }

  private counters(context: RuntimeContext): readonly number[] {
    return [
      context.services.registered,
      context.services.available,
      context.services.withWarnings,
      context.services.withErrors,
      context.dependencyInjection.providersRegistered,
      context.dependencyInjection.providersResolved,
      context.dependencyInjection.singletonProviders,
      context.dependencyInjection.transientProviders,
      context.dependencyInjection.providersWithWarnings,
      context.dependencyInjection.providersWithErrors,
      context.modules.discovered,
      context.modules.resolved,
      context.modules.loaded,
      context.modules.withWarnings,
      context.metadata.namespacesRegistered,
      context.metadata.resourcesRegistered,
      context.metadata.entitiesRegistered,
      context.metadata.pagesRegistered,
      context.componentRegistry?.componentsRegistered ?? 0,
      context.uiComposition?.compositionsGenerated ?? 0,
      context.persistence?.namespaces ?? 0,
      context.persistence?.collections ?? 0,
      context.persistence?.records ?? 0,
      context.persistence?.warnings ?? 0,
      context.persistence?.errors ?? 0,
      context.persistence?.diagnostics ?? 0,
      context.modules.withErrors
    ];
  }

  private containsFunction(value: unknown, seen = new Set<unknown>()): boolean {
    if (typeof value === "function") return true;
    if (typeof value !== "object" || value === null || seen.has(value)) return false;
    seen.add(value);
    return Object.values(value).some((nested) => this.containsFunction(nested, seen));
  }

  private error(code: string, message: string): RuntimeError {
    return createRuntimeEntry(code, message);
  }
}


