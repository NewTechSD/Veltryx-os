import { describe, expect, it } from "vitest";
import type {
  LoadedModule,
  ModuleDependencyResolutionResult,
  ModuleDescriptor,
  ModuleDiscoveryResult,
  ModuleLoadingResult,
  ModuleManifest
} from "@veltryx/contracts";

import {
  KernelModuleDependencyResolver,
  KernelModuleDescriptor,
  KernelModuleDiscovery,
  KernelModuleLoader,
  KernelResolvedModuleLoader,
  ModuleSystemSnapshotService,
  createModuleSystemSnapshot,
  VeltryxKernel,
  createKernelDependencies
} from "../src/index.js";

const loadedAt = new Date("2026-08-18T12:00:00.000Z");
const generatedAt = new Date("2026-08-18T13:00:00.000Z");

const baseManifest: ModuleManifest = {
  id: "kernel.snapshot.base",
  name: "Kernel Snapshot Base",
  version: "1.0.0",
  description: "Base module used by snapshot tests",
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

function manifest(id: string, dependencies: ModuleManifest["dependencies"] = []): ModuleManifest {
  return {
    ...baseManifest,
    id,
    name: `Module ${id}`,
    dependencies
  };
}

function descriptor(
  id: string,
  dependencies: ModuleManifest["dependencies"] = [],
  state: ModuleDescriptor["state"] = "discovered"
): ModuleDescriptor {
  return new KernelModuleDescriptor(manifest(id, dependencies), state);
}

describe("ModuleSystemSnapshotService", () => {
  it("generates an empty public snapshot", async () => {
    const snapshot = await new ModuleSystemSnapshotService({ generatedAt }).snapshot();

    expect(snapshot).toMatchObject({
      status: "empty",
      generatedAt: generatedAt.toISOString(),
      modulesDiscovered: 0,
      modulesValid: 0,
      modulesInvalid: 0,
      modulesDuplicated: 0,
      modulesResolved: 0,
      modulesLoaded: 0,
      modulesRejected: 0,
      modules: [],
      warnings: [],
      errors: []
    });
    expect(snapshot.diagnostics).toEqual([
      expect.objectContaining({ code: "MODULE_REGISTRY_SUMMARY", source: "registry" })
    ]);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.modules)).toBe(true);
  });

  it("generates a partial snapshot from registered modules without reports", async () => {
    const module = descriptor("kernel.snapshot.partial", [{ id: "kernel.snapshot.dep" }]);

    const snapshot = await new ModuleSystemSnapshotService({ modules: [module], generatedAt }).snapshot();

    expect(snapshot.status).toBe("partial");
    expect(snapshot.modulesDiscovered).toBe(1);
    expect(snapshot.modulesValid).toBe(1);
    expect(snapshot.modulesResolved).toBe(0);
    expect(snapshot.modulesLoaded).toBe(0);
    expect(snapshot.modules[0]).toMatchObject({
      id: "kernel.snapshot.partial",
      name: "Module kernel.snapshot.partial",
      version: "1.0.0",
      state: "discovered",
      status: "ok",
      discoveryStatus: "valid",
      resolutionStatus: "unknown",
      loadingStatus: "notLoaded",
      dependencies: [expect.objectContaining({ moduleId: "kernel.snapshot.dep", required: true, status: "unknown" })],
      optionalDependencies: []
    });
    expect(snapshot.warnings.map((warning) => warning.code)).toEqual(
      expect.arrayContaining([
        "MODULE_DISCOVERY_REPORT_UNAVAILABLE",
        "MODULE_RESOLUTION_REPORT_UNAVAILABLE",
        "MODULE_LOADING_REPORT_UNAVAILABLE"
      ])
    );
  });

  it("generates a ready snapshot with discovered, resolved and loaded modules", async () => {
    const discovery = new KernelModuleDiscovery();
    const discoveryResult = discovery.discover([
      manifest("kernel.snapshot.core"),
      manifest("kernel.snapshot.app", [{ id: "kernel.snapshot.core" }])
    ]);
    const resolutionResult = new KernelModuleDependencyResolver().resolve(discoveryResult.valid);
    const loadingResult = new KernelResolvedModuleLoader(undefined, undefined, () => loadedAt).load(resolutionResult);

    const snapshot = await new ModuleSystemSnapshotService({
      discoveryResult,
      resolutionResult,
      loadingResult,
      generatedAt
    }).snapshot();

    expect(snapshot.status).toBe("ready");
    expect(snapshot.modulesDiscovered).toBe(2);
    expect(snapshot.modulesValid).toBe(2);
    expect(snapshot.modulesResolved).toBe(2);
    expect(snapshot.modulesLoaded).toBe(2);
    expect(snapshot.modulesRejected).toBe(0);
    expect(snapshot.reports.discovery).toMatchObject({ found: 2, valid: 2 });
    expect(snapshot.reports.resolution).toMatchObject({ resolved: 2, missing: 0, cycles: 0 });
    expect(snapshot.reports.loading).toMatchObject({ loaded: 2, rejected: 0 });
    expect(snapshot.modules.map((module) => module.id)).toEqual([
      "kernel.snapshot.app",
      "kernel.snapshot.core"
    ]);
    expect(snapshot.modules.every((module) => module.loadingStatus === "loaded")).toBe(true);
  });

  it("exposes invalid and duplicated discovery entries as controlled module errors", async () => {
    const discovery = new KernelModuleDiscovery();
    const duplicate = manifest("kernel.snapshot.duplicate");
    const discoveryResult = discovery.discover([
      duplicate,
      { ...duplicate, name: "Duplicate" },
      { ...baseManifest, id: "", name: "" }
    ]);

    const snapshot = await new ModuleSystemSnapshotService({ discoveryResult, generatedAt }).snapshot();

    expect(snapshot.status).toBe("partial");
    expect(snapshot.modulesInvalid).toBe(1);
    expect(snapshot.modulesDuplicated).toBe(1);
    expect(snapshot.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining(["MODULE_DISCOVERY_INVALID", "MODULE_DISCOVERY_DUPLICATED"])
    );
    expect(snapshot.modules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "kernel.snapshot.duplicate", discoveryStatus: "duplicated", status: "error" }),
        expect.objectContaining({ id: "unavailable", discoveryStatus: "invalid", status: "error" })
      ])
    );
  });

  it("marks required missing, optional missing and structural conflicts in dependency snapshots", async () => {
    const resolver = new KernelModuleDependencyResolver();
    const missingRequired = descriptor("kernel.snapshot.required", [{ id: "kernel.snapshot.missing" }]);
    const missingOptional = descriptor("kernel.snapshot.optional", [{ id: "kernel.snapshot.optional-missing", optional: true }]);
    const invalid = new KernelModuleDescriptor({
      ...baseManifest,
      id: "kernel.snapshot.invalid",
      dependencies: "broken" as unknown as ModuleManifest["dependencies"]
    });

    const resolutionResult = resolver.resolve([missingRequired, missingOptional, invalid]);
    const snapshot = createModuleSystemSnapshot({
      modules: [missingRequired, missingOptional, invalid],
      resolutionResult,
      generatedAt
    });

    expect(snapshot.status).toBe("partial");
    expect(snapshot.modules.find((module) => module.id === "kernel.snapshot.required")).toMatchObject({
      resolutionStatus: "missingDependency",
      dependencies: [expect.objectContaining({ moduleId: "kernel.snapshot.missing", required: true, status: "missing" })]
    });
    expect(snapshot.modules.find((module) => module.id === "kernel.snapshot.optional")).toMatchObject({
      optionalDependencies: [expect.objectContaining({ moduleId: "kernel.snapshot.optional-missing", required: false, status: "optionalMissing" })]
    });
    expect(snapshot.modules.find((module) => module.id === "kernel.snapshot.invalid")).toMatchObject({
      resolutionStatus: "conflict",
      errors: expect.arrayContaining([expect.objectContaining({ code: "MODULE_RESOLUTION_CONFLICT" })])
    });
  });

  it("marks rejected loading results without mutating descriptors", async () => {
    const invalidState = descriptor("kernel.snapshot.invalid-state", [], "initialized");
    const resolutionResult = {
      valid: true,
      order: [invalidState],
      resolved: [invalidState],
      missing: [],
      conflicts: [],
      cycles: [],
      errors: [],
      warnings: [],
      report: {
        analyzed: 1,
        resolved: 1,
        order: [invalidState.manifest.id],
        missing: 0,
        conflicts: 0,
        cycles: 0,
        errors: [],
        warnings: []
      }
    };
    const loadingResult = new KernelResolvedModuleLoader(undefined, undefined, () => loadedAt).load(resolutionResult);

    const snapshot = createModuleSystemSnapshot({ modules: [invalidState], resolutionResult, loadingResult, generatedAt });

    expect(invalidState.state).toBe("initialized");
    expect(snapshot.modulesRejected).toBe(1);
    expect(snapshot.modules[0]).toMatchObject({
      id: "kernel.snapshot.invalid-state",
      state: "rejected",
      loadingStatus: "rejected",
      status: "error"
    });
  });

  it("returns an error snapshot for controlled snapshot failures", async () => {
    const service = new ModuleSystemSnapshotService({
      modules: [null as unknown as ModuleDescriptor],
      generatedAt
    });

    const snapshot = await service.snapshot();

    expect(snapshot.status).toBe("error");
    expect(snapshot.errors).toEqual([
      expect.objectContaining({ code: "MODULE_SYSTEM_SNAPSHOT_FAILED", source: "snapshot" })
    ]);
    expect(snapshot.modules).toEqual([]);
  });

  it("returns defensive immutable copies", async () => {
    const module = descriptor("kernel.snapshot.immutable", [{ id: "kernel.snapshot.dep", optional: true }]);
    const snapshot = await new ModuleSystemSnapshotService({ modules: [module], generatedAt }).snapshot();
    const publicModule = snapshot.modules[0];

    expect(Object.isFrozen(publicModule)).toBe(true);
    expect(Object.isFrozen(publicModule?.dependencies)).toBe(true);
    expect(Object.isFrozen(publicModule?.optionalDependencies)).toBe(true);
    expect(() => ((snapshot.modules as unknown as unknown[]).push(publicModule))).toThrow();
    expect(() => ((publicModule!.metadata as Record<string, unknown>).author = "mutated")).toThrow();
    expect(module.manifest.author).toBe("kernel");
  });
  it("consolidates cycles, loaded module registry entries and report issues", () => {
    const discovered = descriptor("kernel.snapshot.cycle-a", [{ id: "kernel.snapshot.cycle-b" }], "validated");
    const loadedDescriptor = descriptor("kernel.snapshot.registry-loaded", [], "loaded");
    const loadedModule: LoadedModule = {
      descriptor: loadedDescriptor,
      manifest: loadedDescriptor.manifest,
      state: "loaded",
      loadedAt,
      source: "registry"
    };
    const discoveryResult: ModuleDiscoveryResult = {
      found: [discovered.manifest, loadedDescriptor.manifest],
      valid: [discovered, loadedDescriptor],
      invalid: [],
      ignored: [],
      duplicated: [],
      total: 2,
      errors: undefined as unknown as readonly string[],
      report: {
        total: 2,
        found: 2,
        valid: 2,
        invalid: 0,
        duplicated: 0,
        ignored: 0,
        errors: ["discovery-report-error"],
        warnings: ["discovery-report-warning"]
      }
    };
    const resolutionResult: ModuleDependencyResolutionResult = {
      valid: false,
      order: [],
      resolved: [loadedDescriptor],
      missing: [],
      conflicts: [],
      cycles: [{ moduleIds: ["kernel.snapshot.cycle-a", "kernel.snapshot.cycle-b"] }],
      errors: undefined as unknown as readonly string[],
      warnings: ["resolution-warning"],
      report: {
        analyzed: 2,
        resolved: 1,
        order: [loadedDescriptor.manifest.id],
        missing: 0,
        conflicts: 0,
        cycles: 1,
        errors: ["resolution-report-error"],
        warnings: []
      }
    };
    const loadingResult: ModuleLoadingResult = {
      valid: true,
      loaded: [],
      ignored: [],
      rejected: [],
      duplicated: [],
      errors: undefined as unknown as readonly string[],
      warnings: ["loading-warning"],
      totalLoaded: 0,
      report: {
        requested: 1,
        loaded: 0,
        rejected: 0,
        ignored: 0,
        duplicated: 0,
        order: [],
        errors: ["loading-report-error"],
        warnings: []
      }
    };

    const snapshot = createModuleSystemSnapshot({
      discoveryResult,
      resolutionResult,
      loadingResult,
      loadedModules: [loadedModule],
      generatedAt
    });

    expect(snapshot.status).toBe("partial");
    expect(snapshot.modules.find((module) => module.id === "kernel.snapshot.registry-loaded")).toMatchObject({
      state: "loaded",
      resolutionStatus: "resolved",
      loadingStatus: "loaded"
    });
    expect(snapshot.modules.find((module) => module.id === "kernel.snapshot.cycle-a")).toMatchObject({
      state: "validated",
      resolutionStatus: "cycleDetected",
      status: "error"
    });
    expect(snapshot.modules.find((module) => module.id === "kernel.snapshot.cycle-b")).toMatchObject({
      name: "unavailable",
      resolutionStatus: "cycleDetected"
    });
    expect(snapshot.warnings.map((warning) => warning.message)).toEqual(
      expect.arrayContaining(["discovery-report-warning", "resolution-warning", "loading-warning"])
    );
    expect(snapshot.errors.map((error) => error.message)).toEqual(
      expect.arrayContaining(["discovery-report-error", "resolution-report-error", "loading-report-error"])
    );
    expect(Object.isFrozen(snapshot.reports.discovery?.warnings)).toBe(true);
    expect(Object.isFrozen(snapshot.reports.resolution?.order)).toBe(true);
    expect(Object.isFrozen(snapshot.reports.loading?.order)).toBe(true);
  });

  it("keeps known dependency failure status when merging duplicate module drafts", () => {
    const module = descriptor("kernel.snapshot.merge", [{ id: "kernel.snapshot.dep" }], "discovered");
    const resolutionResult: ModuleDependencyResolutionResult = {
      valid: false,
      order: [],
      resolved: [],
      missing: [{ moduleId: module.manifest.id, dependencyId: "kernel.snapshot.dep", optional: false }],
      conflicts: [],
      cycles: [],
      errors: [],
      warnings: [],
      report: {
        analyzed: 1,
        resolved: 0,
        order: [],
        missing: 1,
        conflicts: 0,
        cycles: 0,
        errors: [],
        warnings: []
      }
    };

    const snapshot = createModuleSystemSnapshot({
      modules: [module],
      discoveryResult: {
        found: [module.manifest],
        valid: [module],
        invalid: [],
        ignored: [],
        duplicated: [],
        total: 1,
        errors: [],
        report: {
          total: 1,
          found: 1,
          valid: 1,
          invalid: 0,
          duplicated: 0,
          ignored: 0,
          errors: [],
          warnings: []
        }
      },
      resolutionResult,
      generatedAt
    });

    expect(snapshot.modules[0]?.dependencies).toEqual([
      expect.objectContaining({ moduleId: "kernel.snapshot.dep", status: "missing" })
    ]);
  });

  it("returns partial when pipeline reports are available but modules are not fully resolved and loaded", () => {
    const module = descriptor("kernel.snapshot.pipeline-partial");
    const discoveryResult: ModuleDiscoveryResult = {
      found: [module.manifest],
      valid: [module],
      invalid: [],
      ignored: [],
      duplicated: [],
      total: 1,
      errors: [],
      report: {
        total: 1,
        found: 1,
        valid: 1,
        invalid: 0,
        duplicated: 0,
        ignored: 0,
        errors: [],
        warnings: []
      }
    };
    const resolutionResult: ModuleDependencyResolutionResult = {
      valid: true,
      order: [],
      resolved: [],
      missing: [],
      conflicts: [],
      cycles: [],
      errors: [],
      warnings: [],
      report: {
        analyzed: 1,
        resolved: 0,
        order: [],
        missing: 0,
        conflicts: 0,
        cycles: 0,
        errors: [],
        warnings: []
      }
    };
    const loadingResult: ModuleLoadingResult = {
      valid: true,
      loaded: [],
      ignored: [],
      rejected: [],
      duplicated: [],
      errors: [],
      warnings: [],
      totalLoaded: 0,
      report: {
        requested: 0,
        loaded: 0,
        rejected: 0,
        ignored: 0,
        duplicated: 0,
        order: [],
        errors: [],
        warnings: []
      }
    };

    const snapshot = createModuleSystemSnapshot({
      discoveryResult,
      resolutionResult,
      loadingResult,
      generatedAt
    });

    expect(snapshot.status).toBe("partial");
    expect(snapshot.warnings).toEqual([]);
    expect(snapshot.errors).toEqual([]);
    expect(snapshot.modules[0]).toMatchObject({
      id: "kernel.snapshot.pipeline-partial",
      resolutionStatus: "unknown",
      loadingStatus: "notLoaded"
    });
  });

  it("creates public module drafts from resolution results when no discovery report is present", () => {
    const resolved = descriptor("kernel.snapshot.resolution-only", [], "resolved");
    const resolutionResult: ModuleDependencyResolutionResult = {
      valid: true,
      order: [resolved],
      resolved: [resolved],
      missing: [],
      conflicts: [],
      cycles: [],
      errors: [],
      warnings: [],
      report: {
        analyzed: 1,
        resolved: 1,
        order: [resolved.manifest.id],
        missing: 0,
        conflicts: 0,
        cycles: 0,
        errors: [],
        warnings: []
      }
    };

    const snapshot = createModuleSystemSnapshot({ resolutionResult, generatedAt });

    expect(snapshot.modules).toEqual([
      expect.objectContaining({
        id: "kernel.snapshot.resolution-only",
        state: "resolved",
        resolutionStatus: "resolved"
      })
    ]);
  });
  it("returns a controlled snapshot error for non-Error failures", async () => {
    const service = new ModuleSystemSnapshotService({
      modules: [Object.defineProperty({ state: "discovered" }, "manifest", {
        get: () => {
          throw "snapshot-string-failure";
        }
      }) as unknown as ModuleDescriptor],
      generatedAt
    });

    const snapshot = await service.snapshot();

    expect(snapshot.status).toBe("error");
    expect(snapshot.errors[0]).toMatchObject({
      code: "MODULE_SYSTEM_SNAPSHOT_FAILED",
      message: "Unknown Module System snapshot failure"
    });
  });
});

describe("Kernel modules public snapshot API", () => {
  it("exposes kernel.modules().snapshot() without executing discovery, resolution or loading", async () => {
    const loader = new KernelModuleLoader();
    await loader.register(manifest("kernel.snapshot.api"));
    const kernel = new VeltryxKernel({ ...createKernelDependencies(), modules: loader });

    const before = await kernel.modules().list();
    const snapshot = await kernel.modules().snapshot();
    const after = await kernel.modules().list();

    expect(before).toEqual(after);
    expect(snapshot.status).toBe("partial");
    expect(snapshot.modulesDiscovered).toBe(1);
    expect(snapshot.modulesResolved).toBe(0);
    expect(snapshot.modulesLoaded).toBe(0);
    expect(snapshot.modules[0]).toMatchObject({ id: "kernel.snapshot.api", loadingStatus: "notLoaded" });
  });
});

