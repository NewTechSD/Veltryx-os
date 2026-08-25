import type {
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
  readonly services: IServiceRegistry;
  readonly modules: IModuleLoader;
  readonly metadata: IMetadataRegistry;
  readonly runtime: IRuntime;
}

export interface KernelStatusServiceOptions {
  readonly kernelState: () => KernelStatus;
  readonly bootTimestamp: () => Date | undefined;
  readonly environment?: string;
  readonly includeTechnicalDetails?: boolean;
}

export class KernelStatusService implements IKernelStatusService {
  constructor(
    private readonly dependencies: KernelStatusServiceDependencies,
    private readonly options: KernelStatusServiceOptions
  ) {}

  async snapshot(): Promise<KernelStatusSnapshot> {
    const warnings: KernelDiagnosticEntry[] = [
      createKernelDiagnosticEntry(
        "KERNEL_METADATA_GLOBAL_SUMMARY_NOT_IMPLEMENTED",
        "Metadata registry does not expose a global count snapshot.",
        "warning",
        "metadata",
        "The public metadata contract supports namespace queries only."
      )
    ];
    const errors: KernelDiagnosticEntry[] = [];

    const moduleSnapshot = await this.collectModuleSnapshot(errors);
    const services = this.collectServices(errors);
    const runtimeStatus = this.collectRuntimeStatus(errors);
    const moduleMetrics = this.createModuleMetrics(moduleSnapshot);

    return createKernelStatusSnapshot({
      kernelStatus: errors.length > 0 ? "error" : this.options.kernelState(),
      bootStatus: this.toBootStatus(errors.length > 0),
      bootTimestamp: this.options.bootTimestamp()?.toISOString(),
      environment: this.options.environment ?? process.env.NODE_ENV ?? "development",
      servicesRegistered: services,
      modulesDiscovered: moduleMetrics.discovered,
      modulesResolved: moduleMetrics.resolved,
      modulesLoaded: moduleMetrics.loaded,
      moduleSystemStatus: {
        status: moduleSnapshot ? "available" : "unavailable",
        discovered: moduleMetrics.discovered,
        resolved: moduleMetrics.resolved,
        loaded: moduleMetrics.loaded
      },
      metadataRegistryStatus: this.collectMetadataRegistryStatus(),
      runtimeStatus,
      warnings,
      errors,
      diagnostics: [...warnings, ...errors]
    });
  }

  private async collectModuleSnapshot(errors: KernelDiagnosticEntry[]): Promise<ModuleSystemSnapshot | undefined> {
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
        discovered: createKernelStatusMetric("unavailable", "Module System public snapshot is unavailable."),
        resolved: createKernelStatusMetric("unavailable", "Module System public snapshot is unavailable."),
        loaded: createKernelStatusMetric("unavailable", "Module System public snapshot is unavailable.")
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

  private collectServices(errors: KernelDiagnosticEntry[]): KernelStatusMetric {
    try {
      return createKernelStatusMetric(
        "available",
        "Service tokens exposed by the Kernel service registry public contract.",
        this.dependencies.services.list().length
      );
    } catch (error) {
      errors.push(this.toDiagnostic(error, "KERNEL_SERVICE_REGISTRY_FAILED", "services"));

      return createKernelStatusMetric("unavailable", "Kernel service registry is unavailable.");
    }
  }

  private collectMetadataRegistryStatus(): KernelRegistryStatus {
    return {
      status: "available",
      detail: "Metadata registry public contract is available. Global registry counts are not part of the contract."
    };
  }

  private collectRuntimeStatus(errors: KernelDiagnosticEntry[]): KernelStatusSnapshot["runtimeStatus"] {
    try {
      return this.dependencies.runtime.state();
    } catch (error) {
      errors.push(this.toDiagnostic(error, "KERNEL_RUNTIME_STATUS_FAILED", "runtime"));

      return "unavailable";
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

    return createKernelDiagnosticEntry(code, "Unknown Kernel status snapshot failure", "error", source);
  }
}

