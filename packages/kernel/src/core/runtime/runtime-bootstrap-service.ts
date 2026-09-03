import type {
  DependencyInjectionSnapshot,
  ExecutionContextSnapshot,
  IRuntimeBootstrapService,
  RuntimeBootstrapDependencies,
  RuntimeBootstrapStatus,
  RuntimeContext,
  RuntimeStructuralBootstrapResult,
  RuntimeStatusSnapshot,
  RuntimeWarning
} from "@veltryx/contracts";
import { RuntimeContextFactory } from "./runtime-context-factory.js";
import { createRuntimeEntry } from "./runtime-diagnostics.js";
import { RuntimeLifecycleController } from "./runtime-lifecycle-controller.js";
import { RuntimeStatusSnapshotService } from "./runtime-status-snapshot.js";

export class RuntimeBootstrapService implements IRuntimeBootstrapService {
  private current: RuntimeBootstrapStatus;
  private runtimeContext: RuntimeContext | undefined;
  private runtimeSnapshot: RuntimeStatusSnapshot | undefined;
  private readonly lifecycle = new RuntimeLifecycleController();
  private readonly runtimeId: string;
  private bootstrapped = false;

  constructor(
    private readonly dependencies: RuntimeBootstrapDependencies,
    private readonly now: () => Date = () => new Date(),
    private readonly contextFactory = new RuntimeContextFactory(undefined, now),
    private readonly snapshotService = new RuntimeStatusSnapshotService(now)
  ) {
    this.runtimeId = `veltryx-runtime-${this.now().getTime()}`;
    this.current = this.freezeStatus({
      status: "idle",
      runtimeMode: "preview",
      environment: "development",
      servicesAvailable: 0,
      modulesAvailable: 0,
      warnings: [],
      errors: [],
      diagnostics: []
    });
  }

  async bootstrap(execution?: ExecutionContextSnapshot): Promise<RuntimeStructuralBootstrapResult> {
    const repeated = this.bootstrapped;
    this.lifecycle.transition("bootstrapping");
    this.current = this.freezeStatus({ ...this.current, status: "bootstrapping" });
    try {
      const configuration = this.dependencies.configuration.snapshot();
      const services = this.dependencies.services.snapshot();
      const dependencyInjection =
        this.dependencies.dependencyInjection?.snapshot() ??
        this.emptyDependencyInjectionSnapshot();
      const modules = await this.dependencies.modules.snapshot();
      const metadata = this.dependencies.metadata?.snapshot();
      const componentRegistry = this.dependencies.componentRegistry?.snapshot();
      const uiComposition = this.dependencies.uiComposition?.snapshot();
      const persistence = this.dependencies.persistence?.snapshot();
      const metadataPersistence = this.dependencies.metadataPersistence?.snapshot();
      const configurationPersistence = this.dependencies.configurationPersistence?.snapshot();
      const componentPersistence = this.dependencies.componentPersistence?.snapshot();
      const warnings: RuntimeWarning[] = [];
      if (repeated)
        warnings.push(
          createRuntimeEntry(
            "runtime.bootstrapAlreadyExecuted",
            "Runtime bootstrap was executed again."
          )
        );
      if (
        configuration.warnings.length ||
        services.warnings.length ||
        dependencyInjection.warnings.length ||
        modules.warnings.length
      )
        warnings.push(
          createRuntimeEntry(
            "runtime.dependencyWarning",
            "A structural dependency reports warnings."
          )
        );
      const hasErrors =
        configuration.errors.length > 0 ||
        services.status === "error" ||
        dependencyInjection.status === "error" ||
        modules.status === "error";
      let lifecycle: "ready" | "warning" | "error" = hasErrors
        ? "error"
        : warnings.length
          ? "warning"
          : "ready";
      const bootstrappedAt = this.now().toISOString();
      this.current = this.freezeStatus({
        status: lifecycle,
        bootstrappedAt,
        runtimeMode: configuration.runtimeMode,
        environment: configuration.environment,
        servicesAvailable: services.servicesAvailable,
        modulesAvailable: modules.modulesLoaded,
        warnings,
        errors: hasErrors
          ? [
              createRuntimeEntry(
                "runtime.bootstrapFailed",
                "Runtime structural dependencies are unavailable."
              )
            ]
          : [],
        diagnostics: []
      });
      let context = this.contextFactory.create({
        runtimeId: this.runtimeId,
        lifecycle,
        configuration,
        services,
        dependencyInjection,
        modules,
        metadata,
        componentRegistry,
          uiComposition,
          persistence,
          metadataPersistence,
          configurationPersistence,
          componentPersistence,
        bootstrap: this.current,
        execution
      });
      if (lifecycle === "ready" && context.warnings.length) {
        lifecycle = "warning";
        this.current = this.freezeStatus({ ...this.current, status: lifecycle });
        context = this.contextFactory.create({
          runtimeId: this.runtimeId,
          lifecycle,
          configuration,
          services,
          dependencyInjection,
          modules,
          metadata,
        componentRegistry,
        uiComposition,
        persistence,
        metadataPersistence,
        configurationPersistence,
        componentPersistence,
          bootstrap: this.current,
          execution
        });
      }
      this.lifecycle.transition(lifecycle);
      this.runtimeContext = context;
      this.runtimeSnapshot = this.snapshotService.snapshot(context);
      this.bootstrapped = true;
    } catch {
      if (this.lifecycle.status() === "bootstrapping") this.lifecycle.transition("error");
      const error = createRuntimeEntry(
        "runtime.bootstrapFailed",
        "Runtime structural bootstrap failed."
      );
      this.current = this.freezeStatus({
        ...this.current,
        status: "error",
        errors: [error],
        diagnostics: []
      });
    }
    return Object.freeze({ status: this.status(), success: this.current.status !== "error" });
  }

  status(): RuntimeBootstrapStatus {
    return this.freezeStatus(this.current);
  }
  context(): RuntimeContext | undefined {
    return this.runtimeContext;
  }
  snapshot(): RuntimeStatusSnapshot | undefined {
    return this.runtimeSnapshot;
  }
  stop(): void {
    this.lifecycle.transition("stopped");
    this.current = this.freezeStatus({ ...this.current, status: "stopped" });
    if (this.runtimeContext) {
      this.runtimeContext = Object.freeze({ ...this.runtimeContext, lifecycle: "stopped" });
      this.runtimeSnapshot = this.snapshotService.snapshot(this.runtimeContext);
    }
  }

  private freezeStatus(status: RuntimeBootstrapStatus): RuntimeBootstrapStatus {
    return Object.freeze({
      ...status,
      warnings: Object.freeze([...status.warnings]),
      errors: Object.freeze([...status.errors]),
      diagnostics: Object.freeze([...status.diagnostics])
    });
  }

  private emptyDependencyInjectionSnapshot(): DependencyInjectionSnapshot {
    return Object.freeze({
      status: "empty",
      generatedAt: this.now().toISOString(),
      providersRegistered: 0,
      providersResolved: 0,
      singletonProviders: 0,
      transientProviders: 0,
      providersWithWarnings: 0,
      providersWithErrors: 0,
      providers: Object.freeze([]),
      warnings: Object.freeze([]),
      errors: Object.freeze([]),
      diagnostics: Object.freeze([])
    });
  }
}




