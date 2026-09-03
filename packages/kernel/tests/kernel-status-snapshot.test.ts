import { describe, expect, it } from "vitest";
import type { ModuleManifest, ServiceToken } from "@veltryx/contracts";

import {
  VeltryxKernel,
  createBootstrapContext,
  createKernelStatusMetric,
  createKernelStatusSnapshot
} from "../src/index.js";

const manifest: ModuleManifest = {
  id: "kernel.status.sample",
  name: "Kernel Status Sample",
  version: "1.0.0",
  description: "Sample module used by status snapshot tests",
  author: "kernel",
  dependencies: [],
  compatibility: {
    kernel: "^1.0.0",
    runtime: "^1.0.0",
    metadata: "^1.0.0"
  },
  permissions: [],
  routes: [],
  metadata: [],
  events: [],
  providers: [],
  components: [],
  migrations: [],
  seeds: []
};

const serviceToken: ServiceToken = {
  id: "kernel.status.service",
  version: "1.0.0",
  owner: "kernel",
  scope: "global",
  description: "Status service test token"
};

describe("Kernel public status snapshot", () => {
  it("generates a valid ready snapshot with public Kernel status fields", async () => {
    const kernel = new VeltryxKernel();
    const context = createBootstrapContext();

    await kernel.modules().register(manifest);
    await kernel.modules().transition(manifest.id, "loaded");
    await kernel.services().register({ token: serviceToken, resolve: () => ({ ready: true }) });
    await kernel.bootstrap(context);
    await kernel.initialize(context);
    await kernel.ready(context);

    const snapshot = await kernel.status({ environment: "test" }).snapshot();

    expect(snapshot.kernelStatus).toBe("ready");
    expect(snapshot.bootStatus).toBe("ready");
    expect(snapshot.bootTimestamp).toEqual(expect.any(String));
    expect(snapshot.environment).toBe("test");
    expect(snapshot.servicesRegistered).toMatchObject({ status: "available", value: 19 });
    expect(snapshot.dependencyInjectionStatus).toBe("ready");
    expect(snapshot.providersRegistered).toBe(17);
    expect(snapshot.providersResolved).toBe(15);
    expect(snapshot.runtimeBootstrapStatus).toBe("warning");
    expect(snapshot.runtimeLifecycle).toBe("warning");
    expect(snapshot.runtimeWarnings).toBeGreaterThan(0);
    expect(snapshot.runtimeErrors).toBe(0);
    expect(snapshot.modulesDiscovered).toMatchObject({ status: "available", value: 1 });
    expect(snapshot.modulesResolved).toMatchObject({ status: "available", value: 1 });
    expect(snapshot.modulesLoaded).toMatchObject({ status: "available", value: 1 });
    expect(snapshot.moduleSystemStatus).toMatchObject({ status: "available" });
    expect(snapshot.metadataRegistryStatus).toMatchObject({ status: "available" });
    expect(snapshot.runtimeStatus).toBe("ready");
    expect(snapshot.errors).toEqual([]);
    expect(snapshot.metadataResourcesRegistered).toBe(0);
    expect(snapshot.metadataEntitiesRegistered).toBe(0);
    expect(snapshot.metadataPagesRegistered).toBe(0);
    expect(snapshot.warnings).toEqual([]);
    expect(snapshot.diagnostics).toEqual([]);
  });

  it("returns explicit notBootstrapped state before bootstrap", async () => {
    const kernel = new VeltryxKernel();

    const snapshot = await kernel.status({ environment: "test" }).snapshot();

    expect(snapshot.kernelStatus).toBe("created");
    expect(snapshot.bootStatus).toBe("notBootstrapped");
    expect(snapshot.bootTimestamp).toBeUndefined();
    expect(snapshot.runtimeStatus).toBe("created");
  });

  it("returns structured errors when status collection fails", async () => {
    const kernel = new VeltryxKernel({
      configuration: {} as never,
      events: { publish: async () => undefined, subscribe: () => undefined } as never,
      modules: {
        discover: async () => [],
        register: async () => undefined,
        validate: async () => ({ valid: true, issues: [] }),
        resolveDependencies: async () => {
          throw new Error("Resolution failed");
        },
        transition: async () => undefined,
        list: async () => {
          throw new Error("List failed");
        }
      } as never,
      services: {
        register: async () => undefined,
        resolve: async () => undefined,
        has: () => false,
        list: () => {
          throw new Error("Services failed");
        }
      },
      metadata: {} as never,
      runtime: {
        bootstrap: async () => undefined,
        session: () => undefined,
        state: () => {
          throw new Error("Runtime failed");
        }
      } as never
    });

    const snapshot = await kernel
      .status({ environment: "test", includeTechnicalDetails: false })
      .snapshot();

    expect(snapshot.kernelStatus).toBe("error");
    expect(snapshot.bootStatus).toBe("failed");
    expect(snapshot.modulesDiscovered.status).toBe("unavailable");
    expect(snapshot.modulesResolved.status).toBe("unavailable");
    expect(snapshot.modulesLoaded.status).toBe("unavailable");
    expect(snapshot.servicesRegistered.status).toBe("unavailable");
    expect(snapshot.runtimeStatus).toBe("unavailable");
    expect(snapshot.errors.map((error) => error.code)).toEqual([
      "KERNEL_MODULE_SNAPSHOT_FAILED",
      "KERNEL_SERVICE_REGISTRY_FAILED",
      "KERNEL_RUNTIME_STATUS_FAILED"
    ]);
    expect(snapshot.errors.every((error) => error.stack === undefined)).toBe(true);
    expect(snapshot.diagnostics).toHaveLength(3);
  });
  it("reports bootstrapped and initialized boot states before ready", async () => {
    const kernel = new VeltryxKernel();
    const context = createBootstrapContext();

    await kernel.bootstrap(context);
    const bootstrapped = await kernel.status({ environment: "test" }).snapshot();

    await kernel.initialize(context);
    const initialized = await kernel.status({ environment: "test" }).snapshot();

    expect(bootstrapped.bootStatus).toBe("bootstrapped");
    expect(initialized.bootStatus).toBe("initialized");
  });

  it("keeps stack details only when technical details are enabled", async () => {
    const kernel = new VeltryxKernel({
      configuration: {} as never,
      events: { publish: async () => undefined, subscribe: () => undefined } as never,
      modules: {
        snapshot: async () => {
          throw new Error("Snapshot failed");
        }
      } as never,
      services: { list: () => [] } as never,
      metadata: {} as never,
      runtime: { state: () => "created" } as never
    });

    const snapshot = await kernel
      .status({ environment: "test", includeTechnicalDetails: true })
      .snapshot();

    expect(snapshot.errors[0]).toMatchObject({
      code: "KERNEL_MODULE_SNAPSHOT_FAILED",
      message: "Snapshot failed"
    });
    expect(snapshot.errors[0]?.stack).toEqual(expect.stringContaining("Snapshot failed"));
  });

  it("normalizes non-Error status collection failures", async () => {
    const kernel = new VeltryxKernel({
      configuration: {} as never,
      events: { publish: async () => undefined, subscribe: () => undefined } as never,
      modules: {
        snapshot: async () => {
          throw "snapshot-string-failure";
        }
      } as never,
      services: { list: () => [] } as never,
      metadata: {} as never,
      runtime: { state: () => "created" } as never
    });

    const snapshot = await kernel.status({ environment: "test" }).snapshot();

    expect(snapshot.errors).toEqual([
      expect.objectContaining({
        code: "KERNEL_MODULE_SNAPSHOT_FAILED",
        message: "Unknown Kernel status snapshot failure"
      })
    ]);
  });

  it("creates status snapshots with default diagnostics when explicit diagnostics are omitted", () => {
    const warning = {
      code: "KERNEL_STATUS_WARNING",
      message: "warning",
      severity: "warning" as const,
      source: "kernel" as const
    };
    const error = {
      code: "KERNEL_STATUS_ERROR",
      message: "error",
      severity: "error" as const,
      source: "kernel" as const
    };
    const unavailableMetric = createKernelStatusMetric("unavailable", "Unavailable.");
    const snapshot = createKernelStatusSnapshot({
      kernelStatus: "degraded",
      bootStatus: "failed",
      environment: "test",
      servicesRegistered: unavailableMetric,
      modulesDiscovered: unavailableMetric,
      modulesResolved: unavailableMetric,
      modulesLoaded: unavailableMetric,
      moduleSystemStatus: {
        status: "unavailable",
        discovered: unavailableMetric,
        resolved: unavailableMetric,
        loaded: unavailableMetric
      },
      metadataRegistryStatus: { status: "unavailable", detail: "Unavailable." },
      runtimeStatus: "unavailable",
      warnings: [warning],
      errors: [error]
    });

    expect(snapshot.diagnostics).toEqual([warning, error]);
  });
});


