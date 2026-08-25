import type {
  IRuntimeBootstrapService,
  RuntimeBootstrapDependencies,
  RuntimeBootstrapStatus,
  RuntimeDiagnosticEntry,
  RuntimeError,
  RuntimeStructuralBootstrapResult,
  RuntimeWarning
} from "@veltryx/contracts";

export class RuntimeBootstrapService implements IRuntimeBootstrapService {
  private current: RuntimeBootstrapStatus;

  constructor(
    private readonly dependencies: RuntimeBootstrapDependencies,
    private readonly now: () => Date = () => new Date()
  ) {
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

  async bootstrap(): Promise<RuntimeStructuralBootstrapResult> {
    this.current = this.freezeStatus({ ...this.current, status: "bootstrapping" });
    try {
      const configuration = this.dependencies.configuration.snapshot();
      const services = this.dependencies.services.snapshot();
      const modules = await this.dependencies.modules.snapshot();
      const warnings: RuntimeWarning[] = [];
      const errors: RuntimeError[] = [];
      if (configuration.errors.length > 0)
        errors.push(
          this.entry("RUNTIME_CONFIGURATION_INVALID", "Configuration snapshot reports errors.")
        );
      if (services.status === "error")
        errors.push(
          this.entry("RUNTIME_SERVICES_UNAVAILABLE", "Service Registry snapshot reports errors.")
        );
      if (modules.status === "error")
        errors.push(
          this.entry("RUNTIME_MODULE_SYSTEM_UNAVAILABLE", "Module System snapshot reports errors.")
        );
      if (
        configuration.warnings.length > 0 ||
        services.warnings.length > 0 ||
        modules.warnings.length > 0
      )
        warnings.push(
          this.entry("RUNTIME_DEPENDENCY_WARNING", "A structural dependency reports warnings.")
        );
      const status = errors.length > 0 ? "error" : warnings.length > 0 ? "warning" : "ready";
      const diagnostics: RuntimeDiagnosticEntry[] = [
        ...warnings.map((entry) => ({ ...entry, severity: "warning" as const })),
        ...errors.map((entry) => ({ ...entry, severity: "error" as const })),
        {
          ...this.entry("RUNTIME_BOOTSTRAP_COMPLETED", "Runtime structural bootstrap completed."),
          severity: "info"
        }
      ];
      this.current = this.freezeStatus({
        status,
        bootstrappedAt: this.now().toISOString(),
        runtimeMode: configuration.runtimeMode,
        environment: configuration.environment,
        servicesAvailable: services.servicesAvailable,
        modulesAvailable: modules.modulesLoaded,
        warnings,
        errors,
        diagnostics
      });
    } catch {
      const error = this.entry("RUNTIME_BOOTSTRAP_FAILED", "Runtime structural bootstrap failed.");
      this.current = this.freezeStatus({
        ...this.current,
        status: "error",
        errors: [error],
        diagnostics: [{ ...error, severity: "error" }]
      });
    }
    return Object.freeze({ status: this.status(), success: this.current.status !== "error" });
  }

  status(): RuntimeBootstrapStatus {
    return this.freezeStatus(this.current);
  }
  stop(): void {
    this.current = this.freezeStatus({ ...this.current, status: "stopped" });
  }

  private entry(code: string, message: string): RuntimeWarning {
    return Object.freeze({ code, message, source: "runtime" });
  }

  private freezeStatus(status: RuntimeBootstrapStatus): RuntimeBootstrapStatus {
    return Object.freeze({
      ...status,
      warnings: Object.freeze([...status.warnings]),
      errors: Object.freeze([...status.errors]),
      diagnostics: Object.freeze([...status.diagnostics])
    });
  }
}
