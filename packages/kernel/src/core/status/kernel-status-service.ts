import type {
  IConfigurationProvider,
  IKernelStatusService,
  IMetadataRegistry,
  IModuleLoader,
  IRuntime,
  IServiceRegistry,
  KernelBootStatus,
  KernelDiagnosticEntry,
  KernelRegistryStatus,
  KernelStatus,
  KernelStatusMetric,
  KernelStatusSnapshot,
  ModuleSystemSnapshot
} from "@veltryx/contracts";

import {
  createKernelDiagnosticEntry,
  createKernelStatusMetric,
  createKernelStatusSnapshot
} from "./kernel-status-snapshot.js";

export interface KernelStatusServiceDependencies {
  readonly configuration: IConfigurationProvider;
  readonly services: IServiceRegistry;
  readonly modules: IModuleLoader;
  readonly metadata: IMetadataRegistry;
  readonly runtime: IRuntime;
  readonly container?: import("@veltryx/contracts").IDependencyInjectionContainer;
}

export interface KernelStatusServiceOptions {
  readonly kernelState: () => KernelStatus;
  readonly bootTimestamp: () => Date | undefined;
  readonly environment?: string;
  readonly includeTechnicalDetails?: boolean;
  readonly runtimeBootstrapStatus?: () =>
    import("@veltryx/contracts").RuntimeLifecycleStatus | undefined;
}

export class KernelStatusService implements IKernelStatusService {
  constructor(
    private readonly dependencies: KernelStatusServiceDependencies,
    private readonly options: KernelStatusServiceOptions
  ) {}

  async snapshot(): Promise<KernelStatusSnapshot> {
    const warnings: KernelDiagnosticEntry[] = [];
    const errors: KernelDiagnosticEntry[] = [];

    const moduleSnapshot = await this.collectModuleSnapshot(errors);
    const services = this.collectServices(errors);
    const runtimeStatus = this.collectRuntimeStatus(errors);
    const runtimeSnapshot = this.dependencies.runtime.snapshot?.();
    const dependencyInjection = this.dependencies.container?.snapshot();
    const moduleMetrics = this.createModuleMetrics(moduleSnapshot);
    const configuration = this.collectConfiguration(errors);
    const metadata = this.collectMetadataSnapshot(errors);

    return createKernelStatusSnapshot({
      kernelStatus: errors.length > 0 ? "error" : this.options.kernelState(),
      bootStatus: this.toBootStatus(errors.length > 0),
      bootTimestamp: this.options.bootTimestamp()?.toISOString(),
      environment: this.options.environment ?? configuration.environment,
      appName: configuration.appName,
      appVersion: configuration.appVersion,
      runtimeMode: configuration.runtimeMode,
      servicesRegistered: services.metric,
      serviceRegistryStatus: services.status,
      modulesDiscovered: moduleMetrics.discovered,
      modulesResolved: moduleMetrics.resolved,
      modulesLoaded: moduleMetrics.loaded,
      moduleSystemStatus: {
        status: moduleSnapshot ? "available" : "unavailable",
        discovered: moduleMetrics.discovered,
        resolved: moduleMetrics.resolved,
        loaded: moduleMetrics.loaded
      },
      metadataRegistryStatus: metadata.status,
      metadataResourcesRegistered: metadata.resourcesRegistered,
      metadataEntitiesRegistered: metadata.entitiesRegistered,
      metadataPagesRegistered: metadata.pagesRegistered,
      runtimeStatus,
      dependencyInjectionStatus: dependencyInjection?.status,
      providersRegistered: dependencyInjection?.providersRegistered,
      providersResolved: dependencyInjection?.providersResolved,
      runtimeBootstrapStatus: this.options.runtimeBootstrapStatus?.(),
      runtimeLifecycle: runtimeSnapshot?.status,
      runtimeUptimeMs: runtimeSnapshot?.uptimeMs,
      runtimeWarnings: runtimeSnapshot?.warnings.length,
      runtimeErrors: runtimeSnapshot?.errors.length,
      warnings,
      errors,
      diagnostics: [...warnings, ...errors]
    });
  }

  private async collectModuleSnapshot(
    errors: KernelDiagnosticEntry[]
  ): Promise<ModuleSystemSnapshot | undefined> {
    try {
      return await this.dependencies.modules.snapshot();
    } catch (error) {
      errors.push(this.toDiagnostic(error, "KERNEL_MODULE_SNAPSHOT_FAILED", "modules"));
      return undefined;
    }
  }

  private createModuleMetrics(moduleSnapshot: ModuleSystemSnapshot | undefined): {
    readonly discovered: KernelStatusMetric;
    readonly resolved: KernelStatusMetric;
    readonly loaded: KernelStatusMetric;
  } {
    if (!moduleSnapshot) {
      return {
        discovered: createKernelStatusMetric(
          "unavailable",
          "Module System public snapshot is unavailable."
        ),
        resolved: createKernelStatusMetric(
          "unavailable",
          "Module System public snapshot is unavailable."
        ),
        loaded: createKernelStatusMetric(
          "unavailable",
          "Module System public snapshot is unavailable."
        )
      };
    }

    return {
      discovered: createKernelStatusMetric(
        "available",
        "Discovered modules reported by the Module System public snapshot.",
        moduleSnapshot.modulesDiscovered
      ),
      resolved: createKernelStatusMetric(
        "available",
        "Resolved modules reported by the Module System public snapshot.",
        moduleSnapshot.modulesResolved
      ),
      loaded: createKernelStatusMetric(
        "available",
        "Loaded modules reported by the Module System public snapshot.",
        moduleSnapshot.modulesLoaded
      )
    };
  }

  private collectServices(errors: KernelDiagnosticEntry[]): {
    readonly metric: KernelStatusMetric;
    readonly status: KernelRegistryStatus;
  } {
    try {
      if (typeof this.dependencies.services.snapshot === "function") {
        const snapshot = this.dependencies.services.snapshot();
        if (snapshot.status === "error") {
          errors.push(
            createKernelDiagnosticEntry(
              "KERNEL_SERVICE_REGISTRY_DEGRADED",
              "Service Registry public snapshot reports errors.",
              "error",
              "services"
            )
          );
        }
        const availability = snapshot.status === "error" ? "unavailable" : "available";
        return {
          metric: createKernelStatusMetric(
            availability,
            "Services reported by the Service Registry public snapshot.",
            snapshot.servicesRegistered
          ),
          status: {
            status: availability,
            detail: `Service Registry snapshot status: ${snapshot.status}.`
          }
        };
      }
      return {
        metric: createKernelStatusMetric(
          "available",
          "Service tokens exposed by the legacy Kernel service registry contract.",
          this.dependencies.services.list().length
        ),
        status: { status: "available", detail: "Legacy Service Registry contract is available." }
      };
    } catch (error) {
      errors.push(this.toDiagnostic(error, "KERNEL_SERVICE_REGISTRY_FAILED", "services"));
      return {
        metric: createKernelStatusMetric("unavailable", "Kernel service registry is unavailable."),
        status: {
          status: "unavailable",
          detail: "Service Registry public snapshot is unavailable."
        }
      };
    }
  }

  private collectMetadataSnapshot(errors: KernelDiagnosticEntry[]): {
    readonly status: KernelRegistryStatus;
    readonly resourcesRegistered?: number;
    readonly entitiesRegistered?: number;
    readonly pagesRegistered?: number;
  } {
    try {
      if (typeof this.dependencies.metadata.snapshot !== "function") {
        return {
          status: { status: "available", detail: "Legacy Metadata Registry contract is available." }
        };
      }
      const snapshot = this.dependencies.metadata.snapshot();
      if (snapshot.status === "error") {
        errors.push(
          createKernelDiagnosticEntry(
            "KERNEL_METADATA_REGISTRY_DEGRADED",
            "Metadata Registry public snapshot reports errors.",
            "error",
            "metadata"
          )
        );
      }
      const availability = snapshot.status === "error" ? "unavailable" : "available";
      return {
        status: { status: availability, detail: `Metadata Registry snapshot status: ${snapshot.status}.` },
        resourcesRegistered: snapshot.resourcesRegistered,
        entitiesRegistered: snapshot.entitiesRegistered,
        pagesRegistered: snapshot.pagesRegistered
      };
    } catch (error) {
      errors.push(this.toDiagnostic(error, "KERNEL_METADATA_REGISTRY_FAILED", "metadata"));
      return {
        status: { status: "unavailable", detail: "Metadata Registry public snapshot is unavailable." }
      };
    }
  }

  private collectRuntimeStatus(
    errors: KernelDiagnosticEntry[]
  ): KernelStatusSnapshot["runtimeStatus"] {
    try {
      return this.dependencies.runtime.state();
    } catch (error) {
      errors.push(this.toDiagnostic(error, "KERNEL_RUNTIME_STATUS_FAILED", "runtime"));

      return "unavailable";
    }
  }

  private collectConfiguration(errors: KernelDiagnosticEntry[]): {
    readonly environment: string;
    readonly appName?: string;
    readonly appVersion?: string;
    readonly runtimeMode?: string;
  } {
    try {
      if (typeof this.dependencies.configuration.getString !== "function") {
        return { environment: "development" };
      }
      return {
        environment: this.dependencies.configuration.getString("environment") ?? "development",
        appName: this.dependencies.configuration.getString("app.name"),
        appVersion: this.dependencies.configuration.getString("app.version"),
        runtimeMode: this.dependencies.configuration.getString("runtime.mode")
      };
    } catch (error) {
      errors.push(this.toDiagnostic(error, "KERNEL_CONFIGURATION_SNAPSHOT_FAILED", "kernel"));
      return { environment: "development" };
    }
  }

  private toBootStatus(hasErrors: boolean): KernelBootStatus {
    if (hasErrors) {
      return "failed";
    }

    const state = this.options.kernelState();

    if (state === "ready") {
      return "ready";
    }

    if (state === "initialized") {
      return "initialized";
    }

    if (state === "bootstrapped") {
      return "bootstrapped";
    }

    return "notBootstrapped";
  }

  private toDiagnostic(
    error: unknown,
    code: string,
    source: KernelDiagnosticEntry["source"]
  ): KernelDiagnosticEntry {
    if (error instanceof Error) {
      return createKernelDiagnosticEntry(
        code,
        error.message,
        "error",
        source,
        undefined,
        this.options.includeTechnicalDetails ? error.stack : undefined
      );
    }

    return createKernelDiagnosticEntry(
      code,
      "Unknown Kernel status snapshot failure",
      "error",
      source
    );
  }
}

