import { describe, expect, it, vi } from "vitest";
import {
  getModuleSystemViewModel,
  mapDependencyToViewModel,
  mapModuleSystemSnapshotToViewModel,
  type AdminModuleSystemSnapshot
} from "./module-system-adapter";
import { sanitizeModuleDiagnostics } from "./module-system-diagnostics";
import { moduleDependencyStatusLabel } from "./module-system-labels";

const generatedAt = "2026-08-18T12:00:00.000Z";

function snapshot(overrides: Partial<AdminModuleSystemSnapshot> = {}): AdminModuleSystemSnapshot {
  return {
    status: "ready",
    generatedAt,
    modulesDiscovered: 1,
    modulesValid: 1,
    modulesInvalid: 0,
    modulesDuplicated: 0,
    modulesResolved: 1,
    modulesLoaded: 1,
    modulesRejected: 0,
    modules: [
      {
        id: "admin.module.sample",
        name: "Admin Module Sample",
        version: "1.0.0",
        description: "Sample module",
        state: "loaded",
        status: "warning",
        discoveryStatus: "valid",
        resolutionStatus: "resolved",
        loadingStatus: "loaded",
        dependencies: [
          {
            moduleId: "admin.module.core",
            required: true,
            version: "^1.0.0",
            status: "resolved"
          }
        ],
        optionalDependencies: [
          {
            moduleId: "admin.module.optional",
            required: false,
            status: "optionalMissing",
            reason: "Optional dependency is not present."
          }
        ],
        warnings: [
          {
            code: "MODULE_OPTIONAL_DEPENDENCY_MISSING",
            message: "Optional dependency is missing: admin.module.optional",
            source: "resolution",
            moduleId: "admin.module.sample"
          }
        ],
        errors: [],
        metadata: { author: "kernel" }
      }
    ],
    warnings: [
      {
        code: "MODULE_SYSTEM_WARNING",
        message: "Module System warning",
        source: "module-system",
        detail: "warning-detail"
      }
    ],
    errors: [],
    diagnostics: [
      {
        code: "MODULE_REGISTRY_SUMMARY",
        message: "Module registry snapshot collected.",
        severity: "info",
        source: "registry",
        detail: "modules=1"
      }
    ],
    reports: {},
    ...overrides
  };
}

describe("getModuleSystemViewModel", () => {
  it("consumes only kernel.modules().snapshot() and returns a valid ViewModel", async () => {
    const moduleSnapshot = snapshot();
    const snapshotSpy = vi.fn(async () => moduleSnapshot);
    const discoverSpy = vi.fn(() => {
      throw new Error("discover must not be called");
    });
    const resolveSpy = vi.fn(() => {
      throw new Error("resolver must not be called");
    });
    const loadSpy = vi.fn(() => {
      throw new Error("loader must not be called");
    });

    const viewModel = await getModuleSystemViewModel({
      createKernel: () => ({
        modules: () => ({
          snapshot: snapshotSpy,
          discover: discoverSpy,
          resolveDependencies: resolveSpy,
          load: loadSpy
        }) as never
      }),
      environment: "test"
    });

    expect(snapshotSpy).toHaveBeenCalledTimes(1);
    expect(discoverSpy).not.toHaveBeenCalled();
    expect(resolveSpy).not.toHaveBeenCalled();
    expect(loadSpy).not.toHaveBeenCalled();
    expect(viewModel.status).toBe("ready");
    expect(viewModel.statusLabel).toBe("Ready");
    expect(viewModel.hasModules).toBe(true);
    expect(viewModel.modules[0]?.id).toBe("admin.module.sample");
  });

  it("returns a controlled production error ViewModel when Kernel snapshot fails", async () => {
    const viewModel = await getModuleSystemViewModel({
      createKernel: () => ({
        modules: () => ({
          snapshot: async () => {
            const error = new Error("C:/projects/Veltryx-so/secret stack detail");
            error.stack = "Error: secret\n    at C:/projects/Veltryx-so/internal.ts:1:1";
            throw error;
          }
        })
      }),
      environment: "production",
      now: () => new Date(generatedAt)
    });

    expect(viewModel.status).toBe("error");
    expect(viewModel.generatedAt).toBe(generatedAt);
    expect(viewModel.modules).toEqual([]);
    expect(viewModel.hasErrors).toBe(true);
    expect(viewModel.errors).toEqual([
      {
        code: "ADMIN_MODULE_SYSTEM_SNAPSHOT_FAILED",
        message: "Module System snapshot unavailable.",
        severity: "error",
        source: "admin",
        details: undefined
      }
    ]);
    expect(JSON.stringify(viewModel)).not.toContain("C:/projects");
    expect(JSON.stringify(viewModel)).not.toContain("stack");
  });

  it("keeps controlled technical details in development fallback without exposing stack", async () => {
    const viewModel = await getModuleSystemViewModel({
      createKernel: () => ({
        modules: () => ({
          snapshot: async () => {
            throw new Error("Snapshot failed");
          }
        })
      }),
      environment: "development",
      now: () => new Date(generatedAt)
    });

    expect(viewModel.errors[0]).toMatchObject({
      message: "Snapshot failed",
      details: "Snapshot failed"
    });
    expect(JSON.stringify(viewModel)).not.toContain("at ");
  });
});


  it("returns an empty ViewModel from the default Kernel without running module lifecycle", async () => {
    const viewModel = await getModuleSystemViewModel({ environment: "test", now: () => new Date(generatedAt) });

    expect(viewModel.status).toBe("empty");
    expect(viewModel.isEmpty).toBe(true);
    expect(viewModel.modules).toEqual([]);
  });

  it("normalizes non-Error adapter failures", async () => {
    const viewModel = await getModuleSystemViewModel({
      createKernel: () => ({
        modules: () => ({
          snapshot: async () => {
            throw "snapshot-string-failure";
          }
        })
      }),
      environment: "production",
      now: () => new Date(generatedAt)
    });

    expect(viewModel.errors[0]).toEqual({
      code: "ADMIN_MODULE_SYSTEM_SNAPSHOT_FAILED",
      message: "Module System snapshot unavailable.",
      severity: "error",
      source: "admin"
    });
  });

describe("mapModuleSystemSnapshotToViewModel", () => {
  it("maps summary counters without recalculating Kernel values", () => {
    const viewModel = mapModuleSystemSnapshotToViewModel(snapshot({
      modulesDiscovered: 10,
      modulesValid: 8,
      modulesInvalid: 1,
      modulesDuplicated: 1,
      modulesResolved: 6,
      modulesLoaded: 5,
      modulesRejected: 2
    }));

    expect(viewModel.summary).toEqual({
      modulesDiscovered: 10,
      modulesValid: 8,
      modulesInvalid: 1,
      modulesDuplicated: 1,
      modulesResolved: 6,
      modulesLoaded: 5,
      modulesRejected: 2
    });
  });

  it("maps public modules to card ViewModels", () => {
    const viewModel = mapModuleSystemSnapshotToViewModel(snapshot());
    const moduleCard = viewModel.modules[0];

    expect(moduleCard).toMatchObject({
      id: "admin.module.sample",
      name: "Admin Module Sample",
      version: "1.0.0",
      description: "Sample module",
      state: "loaded",
      stateLabel: "Loaded",
      status: "warning",
      statusLabel: "Warning",
      discoveryStatus: "valid",
      discoveryStatusLabel: "Valid",
      resolutionStatus: "resolved",
      resolutionStatusLabel: "Resolved",
      loadingStatus: "loaded",
      loadingStatusLabel: "Loaded",
      dependenciesCount: 1,
      optionalDependenciesCount: 1,
      warningsCount: 1,
      errorsCount: 0
    });
    expect(moduleCard?.dependencies[0]).toMatchObject({
      moduleId: "admin.module.core",
      required: true,
      requiredLabel: "Required",
      version: "^1.0.0",
      status: "resolved",
      statusLabel: "Resolved"
    });
    expect(moduleCard?.optionalDependencies[0]).toMatchObject({
      moduleId: "admin.module.optional",
      required: false,
      requiredLabel: "Optional",
      status: "optionalMissing",
      statusLabel: "Optional Missing"
    });
    expect(moduleCard?.warnings[0]).toMatchObject({
      severity: "warning",
      source: "resolution"
    });
  });

  it("maps dependency statuses used by the public snapshot", () => {
    expect(mapDependencyToViewModel({ moduleId: "resolved", required: true, status: "resolved" }).statusLabel).toBe("Resolved");
    expect(mapDependencyToViewModel({ moduleId: "missing", required: true, status: "missing" }).statusLabel).toBe("Missing");
    expect(mapDependencyToViewModel({ moduleId: "optional", required: false, status: "optionalMissing" }).statusLabel).toBe("Optional Missing");
    expect(mapDependencyToViewModel({ moduleId: "incompatible", required: true, status: "incompatible" }).statusLabel).toBe("Incompatible");
    expect(mapDependencyToViewModel({ moduleId: "unknown", required: true, status: "unknown" }).statusLabel).toBe("Unknown");
  });

  it("maps warnings, errors and diagnostics safely", () => {
    const viewModel = mapModuleSystemSnapshotToViewModel(snapshot({
      status: "partial",
      errors: [
        {
          code: "MODULE_REQUIRED_DEPENDENCY_MISSING",
          message: "Required dependency is missing.",
          source: "resolution",
          detail: "dependency=admin.module.missing"
        }
      ],
      diagnostics: [
        {
          code: "MODULE_RESOLUTION_REPORT",
          message: "Last resolution report is available.",
          severity: "warning",
          source: "resolution",
          detail: "resolved=0"
        }
      ]
    }));

    expect(viewModel.hasWarnings).toBe(true);
    expect(viewModel.hasErrors).toBe(true);
    expect(viewModel.warnings[0]).toEqual({
      code: "MODULE_SYSTEM_WARNING",
      message: "Module System warning",
      severity: "warning",
      source: "module-system",
      details: "warning-detail"
    });
    expect(viewModel.errors[0]).toEqual({
      code: "MODULE_REQUIRED_DEPENDENCY_MISSING",
      message: "Required dependency is missing.",
      severity: "error",
      source: "resolution",
      details: "dependency=admin.module.missing"
    });
    expect(viewModel.diagnostics[0]).toMatchObject({
      severity: "warning",
      source: "resolution",
      details: "resolved=0"
    });
  });

  it("handles empty, partial, ready, error and notBootstrapped states", () => {
    const empty = mapModuleSystemSnapshotToViewModel(snapshot({
      status: "empty",
      modulesDiscovered: 0,
      modulesValid: 0,
      modulesResolved: 0,
      modulesLoaded: 0,
      modules: [],
      warnings: [],
      errors: [],
      diagnostics: []
    }));
    const partial = mapModuleSystemSnapshotToViewModel(snapshot({ status: "partial" }));
    const ready = mapModuleSystemSnapshotToViewModel(snapshot({ status: "ready", warnings: [], errors: [] }));
    const error = mapModuleSystemSnapshotToViewModel(snapshot({ status: "error", errors: [{ code: "ERR", message: "Failed", source: "snapshot" }] }));
    const notBootstrapped = mapModuleSystemSnapshotToViewModel(snapshot({ status: "notBootstrapped" }));

    expect(empty).toMatchObject({ status: "empty", statusLabel: "Empty", isEmpty: true, hasModules: false, hasErrors: false });
    expect(partial.statusLabel).toBe("Partial");
    expect(ready.statusLabel).toBe("Ready");
    expect(error).toMatchObject({ statusLabel: "Error", hasErrors: true });
    expect(notBootstrapped.statusLabel).toBe("Not Bootstrapped");
  });


  it("sanitizes mixed diagnostics and falls back to title case labels", () => {
    const diagnostics = sanitizeModuleDiagnostics([
      {
        code: "MODULE_DIAGNOSTIC",
        message: "Diagnostic",
        severity: "info",
        source: "snapshot",
        detail: "diagnostic-detail"
      },
      {
        code: "MODULE_WARNING_CUSTOM",
        message: "Warning",
        source: "snapshot"
      },
      {
        code: "MODULE_ERROR_CUSTOM",
        message: "Error",
        source: "snapshot"
      }
    ]);

    expect(diagnostics).toEqual([
      { code: "MODULE_DIAGNOSTIC", message: "Diagnostic", severity: "info", source: "snapshot", details: "diagnostic-detail" },
      { code: "MODULE_WARNING_CUSTOM", message: "Warning", severity: "warning", source: "snapshot", details: undefined },
      { code: "MODULE_ERROR_CUSTOM", message: "Error", severity: "error", source: "snapshot", details: undefined }
    ]);
    expect(Object.isFrozen(diagnostics)).toBe(true);
    expect(moduleDependencyStatusLabel("customStatus" as never)).toBe("Custom Status");
  });
  it("returns immutable defensive ViewModel copies", () => {
    const moduleSnapshot = snapshot();
    const viewModel = mapModuleSystemSnapshotToViewModel(moduleSnapshot);

    expect(Object.isFrozen(viewModel)).toBe(true);
    expect(Object.isFrozen(viewModel.modules)).toBe(true);
    expect(Object.isFrozen(viewModel.modules[0])).toBe(true);
    expect(Object.isFrozen(viewModel.modules[0]?.dependencies)).toBe(true);
    expect(() => ((viewModel.modules as unknown as unknown[]).push({}))).toThrow();
    expect(() => ((viewModel.modules[0] as unknown as { name: string }).name = "mutated")).toThrow();
    expect(moduleSnapshot.modules[0]?.name).toBe("Admin Module Sample");
  });
});