import type {
  IRuntimeContextFactory,
  RuntimeContext,
  RuntimeContextFactoryInput,
  RuntimeDiagnosticEntry,
  RuntimeError,
  RuntimeWarning
} from "@veltryx/contracts";
import { createRuntimeEntry, toRuntimeDiagnostic } from "./runtime-diagnostics.js";
import { RuntimeContextValidator } from "./runtime-context-validator.js";

export class RuntimeContextFactory implements IRuntimeContextFactory {
  constructor(
    private readonly validator = new RuntimeContextValidator(),
    private readonly now: () => Date = () => new Date()
  ) {}

  create(input: RuntimeContextFactoryInput): RuntimeContext {
    const generatedAt = this.now().toISOString();
    const warnings = this.warnings(input, generatedAt);
    const errors = this.errors(input, generatedAt);
    const diagnostics: RuntimeDiagnosticEntry[] = [
      ...warnings.map((entry) => toRuntimeDiagnostic(entry, "warning")),
      ...errors.map((entry) => toRuntimeDiagnostic(entry, "error")),
      toRuntimeDiagnostic(
        createRuntimeEntry("runtime.context.generated", "Runtime Context generated.", generatedAt),
        "info"
      )
    ];
    const context: RuntimeContext = {
      runtimeId: input.runtimeId,
      lifecycle: input.lifecycle,
      environment: input.configuration.environment,
      runtimeMode: input.configuration.runtimeMode,
      bootstrappedAt: input.bootstrap.bootstrappedAt,
      generatedAt,
      configuration: Object.freeze({
        status: input.configuration.errors.length
          ? "error"
          : input.configuration.warnings.length
            ? "warning"
            : "ready",
        appName: input.configuration.appName,
        appVersion: input.configuration.appVersion,
        debugEnabled: input.configuration.debugEnabled
      }),
      services: Object.freeze({
        status: input.services.status,
        registered: input.services.servicesRegistered,
        available: input.services.servicesAvailable,
        withWarnings: input.services.servicesWithWarnings,
        withErrors: input.services.servicesWithErrors
      }),
      dependencyInjection: Object.freeze({
        status: input.dependencyInjection.status,
        providersRegistered: input.dependencyInjection.providersRegistered,
        providersResolved: input.dependencyInjection.providersResolved,
        singletonProviders: input.dependencyInjection.singletonProviders,
        transientProviders: input.dependencyInjection.transientProviders,
        providersWithWarnings: input.dependencyInjection.providersWithWarnings,
        providersWithErrors: input.dependencyInjection.providersWithErrors
      }),
      modules: Object.freeze({
        status: input.modules.status,
        discovered: input.modules.modulesDiscovered,
        resolved: input.modules.modulesResolved,
        loaded: input.modules.modulesLoaded,
        withWarnings: input.modules.modules.filter((module) => module.warnings.length > 0).length,
        withErrors: input.modules.modules.filter((module) => module.errors.length > 0).length
      }),
      metadata: Object.freeze({
        status: input.metadata?.status ?? "empty",
        namespacesRegistered: input.metadata?.namespacesRegistered ?? 0,
        resourcesRegistered: input.metadata?.resourcesRegistered ?? 0,
        entitiesRegistered: input.metadata?.entitiesRegistered ?? 0,
        pagesRegistered: input.metadata?.pagesRegistered ?? 0
      }),
      componentRegistry: Object.freeze({
        status: input.componentRegistry?.status ?? "empty",
        componentsRegistered: input.componentRegistry?.componentsRegistered ?? 0
      }),
      uiComposition: Object.freeze({
        status: input.uiComposition?.status ?? "empty",
        compositionsGenerated: input.uiComposition?.compositionsGenerated ?? 0
      }),
      persistence: input.persistence ? summary(input.persistence) : undefined,
      execution: input.execution
        ? Object.freeze({
            requestId: input.execution.requestId,
            correlationId: input.execution.correlationId,
            tenantAvailable: Boolean(input.execution.tenantContext),
            workspaceAvailable: Boolean(input.execution.workspaceContext),
            userAvailable: Boolean(input.execution.userContext)
          })
        : undefined,
      warnings: Object.freeze(warnings),
      errors: Object.freeze(errors),
      diagnostics: Object.freeze(diagnostics)
    };
    const validation = this.validator.validate(context);
    if (!validation.valid) throw new Error("Runtime Context validation failed.");
    return Object.freeze(context);
  }

  private warnings(input: RuntimeContextFactoryInput, timestamp: string): RuntimeWarning[] {
    const warnings: RuntimeWarning[] = [];
    if ((input.metadata?.status === "partial" || input.metadata?.warnings.length) && input.metadata.resourcesRegistered > 0)
      warnings.push(
        createRuntimeEntry(
          "runtime.metadataWarning",
          "Metadata Engine reports warnings.",
          timestamp
        )
      );
    if (input.modules.modulesLoaded === 0)
      warnings.push(
        createRuntimeEntry("runtime.noModulesLoaded", "No modules are loaded.", timestamp)
      );
    if (input.modules.status === "partial")
      warnings.push(
        createRuntimeEntry(
          "runtime.partialModuleSystem",
          "Module System is partially available.",
          timestamp
        )
      );
    if (input.dependencyInjection.status === "partial")
      warnings.push(
        createRuntimeEntry(
          "runtime.diPartial",
          "Dependency Injection is partially available.",
          timestamp
        )
      );
    if (input.services.status === "partial")
      warnings.push(
        createRuntimeEntry(
          "runtime.serviceRegistryPartial",
          "Service Registry is partially available.",
          timestamp
        )
      );
    if (input.configuration.warnings.length)
      warnings.push(
        createRuntimeEntry(
          "runtime.configurationWarning",
          "Configuration reports warnings.",
          timestamp
        )
      );
    if (!input.execution)
      warnings.push(
        createRuntimeEntry(
          "runtime.executionContextMissing",
          "Execution Context summary is unavailable.",
          timestamp
        )
      );
    return warnings;
  }

  private errors(input: RuntimeContextFactoryInput, timestamp: string): RuntimeError[] {
    const errors: RuntimeError[] = [];
    if (input.configuration.errors.length)
      errors.push(
        createRuntimeEntry(
          "runtime.configurationUnavailable",
          "Configuration is unavailable.",
          timestamp
        )
      );
    if (input.services.status === "error")
      errors.push(
        createRuntimeEntry(
          "runtime.serviceRegistryUnavailable",
          "Service Registry is unavailable.",
          timestamp
        )
      );
    if (input.dependencyInjection.status === "error")
      errors.push(
        createRuntimeEntry(
          "runtime.diUnavailable",
          "Dependency Injection is unavailable.",
          timestamp
        )
      );
    if (input.metadata?.status === "error")
      errors.push(
        createRuntimeEntry(
          "runtime.metadataUnavailable",
          "Metadata Engine is unavailable.",
          timestamp
        )
      );
    if (input.modules.status === "error")
      errors.push(
        createRuntimeEntry(
          "runtime.moduleSystemUnavailable",
          "Module System is unavailable.",
          timestamp
        )
      );
    return errors;
  }
}

function summary(snapshot: NonNullable<RuntimeContextFactoryInput["persistence"]>) {
  return Object.freeze({ status: snapshot.status, providerId: snapshot.provider.id, providerKind: snapshot.provider.kind, namespaces: snapshot.namespaces, collections: snapshot.collections, records: snapshot.records, warnings: snapshot.warnings.length, errors: snapshot.errors.length, diagnostics: snapshot.diagnostics.length });
}




