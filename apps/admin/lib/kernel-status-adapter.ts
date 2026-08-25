import {
  VeltryxKernel,
  createBootstrapContext,
  createKernelDiagnosticEntry,
  createKernelStatusMetric,
  createKernelStatusSnapshot
} from "@veltryx/kernel";

import type { KernelStatusSnapshot } from "./kernel-status-types";

interface KernelStatusAdapterOptions {
  readonly createKernel?: () => VeltryxKernel;
  readonly environment?: string;
  readonly now?: () => Date;
  readonly includeTechnicalDetails?: boolean;
}

export async function getKernelStatusSnapshot(
  options: KernelStatusAdapterOptions = {}
): Promise<KernelStatusSnapshot> {
  const environment = options.environment ?? process.env.NODE_ENV ?? "development";
  const includeTechnicalDetails = options.includeTechnicalDetails ?? environment === "development";
  const fallbackTimestamp = (options.now ?? (() => new Date()))().toISOString();

  try {
    const kernel = options.createKernel?.() ?? new VeltryxKernel();
    const context = createBootstrapContext();

    await kernel.bootstrap(context);
    await kernel.initialize(context);
    await kernel.ready(context);

    return kernel.status({ environment, includeTechnicalDetails }).snapshot();
  } catch (error) {
    const issue = toSnapshotIssue(error, includeTechnicalDetails);

    return createKernelStatusSnapshot({
      kernelStatus: "error",
      bootStatus: "failed",
      bootTimestamp: fallbackTimestamp,
      environment,
      modulesDiscovered: createKernelStatusMetric("unavailable", "Kernel did not finish bootstrapping."),
      modulesResolved: createKernelStatusMetric("unavailable", "Kernel did not finish dependency resolution."),
      modulesLoaded: createKernelStatusMetric("unavailable", "Kernel did not finish module loading status collection."),
      servicesRegistered: createKernelStatusMetric("unavailable", "Kernel services were not available after bootstrap failure."),
      moduleSystemStatus: {
        status: "unavailable",
        discovered: createKernelStatusMetric("unavailable", "Kernel did not finish bootstrapping."),
        resolved: createKernelStatusMetric("unavailable", "Kernel did not finish dependency resolution."),
        loaded: createKernelStatusMetric("unavailable", "Kernel did not finish module loading status collection.")
      },
      metadataRegistryStatus: {
        status: "notBootstrapped",
        detail: "Metadata registry status is unavailable because Kernel bootstrap failed."
      },
      runtimeStatus: "notBootstrapped",
      errors: [issue],
      warnings: [],
      diagnostics: [issue]
    });
  }
}

function toSnapshotIssue(error: unknown, includeTechnicalDetails: boolean) {
  if (error instanceof Error) {
    return createKernelDiagnosticEntry(
      "KERNEL_BOOTSTRAP_FAILED",
      error.message,
      "error",
      "bootstrap",
      undefined,
      includeTechnicalDetails ? error.stack : undefined
    );
  }

  return createKernelDiagnosticEntry(
    "KERNEL_BOOTSTRAP_FAILED",
    "Unknown Kernel bootstrap failure",
    "error",
    "bootstrap"
  );
}
