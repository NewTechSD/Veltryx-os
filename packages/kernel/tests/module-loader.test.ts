import { describe, expect, it } from "vitest";
import type {
  ModuleDependencyResolutionResult,
  ModuleDescriptor,
  ModuleLifecycleState,
  ModuleManifest
} from "@veltryx/contracts";

import {
  KernelLoadedModule,
  KernelModuleDependencyResolver,
  KernelModuleDescriptor,
  KernelModuleRegistry,
  KernelModuleStateValidator,
  KernelResolvedModuleLoader
} from "../src/index.js";

const loadedAt = new Date("2026-08-18T12:00:00.000Z");
const baseManifest: ModuleManifest = {
  id: "kernel.loader.base",
  name: "Kernel Loader Base",
  version: "1.0.0",
  description: "Base module used by loader tests",
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

function descriptor(
  id: string,
  dependencies: ModuleManifest["dependencies"] = [],
  state: ModuleLifecycleState = "resolved"
): ModuleDescriptor {
  return new KernelModuleDescriptor(
    {
      ...baseManifest,
      id,
      name: `Module ${id}`,
      dependencies
    },
    state
  );
}

function resolve(modules: readonly ModuleDescriptor[]): ModuleDependencyResolutionResult {
  return new KernelModuleDependencyResolver().resolve(modules);
}

function ids(modules: readonly { readonly manifest: ModuleManifest }[]): readonly string[] {
  return modules.map((module) => module.manifest.id);
}

describe("KernelModuleRegistry", () => {
  it("registers, locates, lists and removes loaded modules", () => {
    const registry = new KernelModuleRegistry();
    const module = new KernelLoadedModule(descriptor("kernel.registry"), loadedAt);

    registry.register(module);

    expect(registry.has("kernel.registry")).toBe(true);
    expect(registry.find("kernel.registry")).toBe(module);
    expect(registry.list()).toEqual([module]);
    expect(registry.remove("kernel.registry")).toBe(true);
    expect(registry.remove("kernel.registry")).toBe(false);
    expect(registry.list()).toEqual([]);
  });

  it("prevents duplicate loaded module registrations", () => {
    const registry = new KernelModuleRegistry();
    const module = new KernelLoadedModule(descriptor("kernel.registry.duplicate"), loadedAt);

    registry.register(module);

    expect(() => registry.register(module)).toThrow(
      "Module already loaded: kernel.registry.duplicate"
    );
  });
});

describe("KernelModuleStateValidator", () => {
  it("allows only discovered to validated to resolved to loaded transitions", () => {
    const validator = new KernelModuleStateValidator();

    expect(validator.transition("discovered", "validated")).toBe("validated");
    expect(validator.transition("validated", "resolved")).toBe("resolved");
    expect(validator.transition("resolved", "loaded")).toBe("loaded");
    expect(validator.canTransition("loaded", "resolved")).toBe(false);
  });

  it("rejects invalid state transitions", () => {
    const validator = new KernelModuleStateValidator();

    expect(() => validator.transition("discovered", "loaded")).toThrow(
      "Invalid module state transition: discovered -> loaded"
    );
    expect(() => validator.transition("loaded", "validated")).toThrow(
      "Invalid module state transition: loaded -> validated"
    );
  });

  it("identifies states allowed during the loading phase", () => {
    const validator = new KernelModuleStateValidator();

    expect(validator.isAllowed("discovered")).toBe(true);
    expect(validator.isAllowed("validated")).toBe(true);
    expect(validator.isAllowed("resolved")).toBe(true);
    expect(validator.isAllowed("loaded")).toBe(true);
    expect(validator.isAllowed("initialized")).toBe(false);
  });
});

describe("KernelResolvedModuleLoader", () => {

  it("loads with default collaborators", () => {
    const loader = new KernelResolvedModuleLoader();
    const module = descriptor("kernel.loader.defaults");

    const result = loader.load(resolve([module]));

    expect(result.valid).toBe(true);
    expect(result.loaded[0]?.loadedAt).toBeInstanceOf(Date);
    expect(loader.getRegistry().has("kernel.loader.defaults")).toBe(true);
  });
  it("loads a valid module", () => {
    const loader = new KernelResolvedModuleLoader(undefined, undefined, () => loadedAt);
    const module = descriptor("kernel.loader.single");

    const result = loader.load(resolve([module]));

    expect(result.valid).toBe(true);
    expect(result.totalLoaded).toBe(1);
    expect(result.loaded[0]).toMatchObject({
      descriptor: expect.objectContaining({ manifest: expect.objectContaining({ id: "kernel.loader.single" }) }),
      manifest: expect.objectContaining({ id: "kernel.loader.single" }),
      state: "loaded",
      loadedAt
    });
    expect(loader.getRegistry().has("kernel.loader.single")).toBe(true);
  });

  it("loads multiple modules preserving resolver order", () => {
    const loader = new KernelResolvedModuleLoader(undefined, undefined, () => loadedAt);
    const api = descriptor("kernel.api", [{ id: "kernel.service" }]);
    const service = descriptor("kernel.service", [{ id: "kernel.core" }]);
    const core = descriptor("kernel.core");

    const result = loader.load(resolve([api, service, core]));

    expect(result.valid).toBe(true);
    expect(ids(result.loaded)).toEqual(["kernel.core", "kernel.service", "kernel.api"]);
    expect(result.report.order).toEqual(["kernel.core", "kernel.service", "kernel.api"]);
  });

  it("prevents duplicate loading against the registry", () => {
    const registry = new KernelModuleRegistry();
    const loader = new KernelResolvedModuleLoader(registry, undefined, () => loadedAt);
    const module = descriptor("kernel.loader.duplicate");

    const first = loader.load(resolve([module]));
    const second = loader.load(resolve([module]));

    expect(first.valid).toBe(true);
    expect(second.valid).toBe(false);
    expect(second.loaded).toEqual([]);
    expect(second.duplicated).toEqual([
      expect.objectContaining({ reason: "duplicate", message: "module already loaded: kernel.loader.duplicate" })
    ]);
    expect(second.ignored).toEqual([
      expect.objectContaining({
        reason: "duplicate",
        message: "module ignored because it is already loaded: kernel.loader.duplicate"
      })
    ]);
  });

  it("rejects invalid descriptors", () => {
    const loader = new KernelResolvedModuleLoader(undefined, undefined, () => loadedAt);
    const invalid = new KernelModuleDescriptor({ ...baseManifest, id: "" }, "resolved");
    const resolution: ModuleDependencyResolutionResult = {
      valid: true,
      order: [invalid],
      resolved: [invalid],
      missing: [],
      conflicts: [],
      cycles: [],
      errors: [],
      warnings: [],
      report: {
        analyzed: 1,
        resolved: 1,
        order: [""],
        missing: 0,
        conflicts: 0,
        cycles: 0,
        errors: [],
        warnings: []
      }
    };

    const result = loader.load(resolution);

    expect(result.valid).toBe(false);
    expect(result.loaded).toEqual([]);
    expect(result.rejected).toEqual([
      expect.objectContaining({
        reason: "invalid-descriptor",
        message: "loaded module descriptor requires a non-empty manifest id"
      })
    ]);
  });


  it("rejects descriptors without name or version", () => {
    const loader = new KernelResolvedModuleLoader(undefined, undefined, () => loadedAt);
    const withoutName = new KernelModuleDescriptor({ ...baseManifest, id: "kernel.without-name", name: "" }, "resolved");
    const withoutVersion = new KernelModuleDescriptor(
      { ...baseManifest, id: "kernel.without-version", version: "" },
      "resolved"
    );
    const resolution: ModuleDependencyResolutionResult = {
      valid: true,
      order: [withoutName, withoutVersion],
      resolved: [withoutName, withoutVersion],
      missing: [],
      conflicts: [],
      cycles: [],
      errors: [],
      warnings: [],
      report: {
        analyzed: 2,
        resolved: 2,
        order: ["kernel.without-name", "kernel.without-version"],
        missing: 0,
        conflicts: 0,
        cycles: 0,
        errors: [],
        warnings: []
      }
    };

    const result = loader.load(resolution);

    expect(result.valid).toBe(false);
    expect(result.rejected).toEqual([
      expect.objectContaining({
        reason: "invalid-descriptor",
        message: "loaded module descriptor requires a non-empty manifest name: kernel.without-name"
      }),
      expect.objectContaining({
        reason: "invalid-descriptor",
        message: "loaded module descriptor requires a non-empty manifest version: kernel.without-version"
      })
    ]);
  });
  it("rejects invalid states", () => {
    const loader = new KernelResolvedModuleLoader(undefined, undefined, () => loadedAt);
    const invalid = descriptor("kernel.loader.invalid-state", [], "initialized");
    const resolution: ModuleDependencyResolutionResult = {
      valid: true,
      order: [invalid],
      resolved: [invalid],
      missing: [],
      conflicts: [],
      cycles: [],
      errors: [],
      warnings: [],
      report: {
        analyzed: 1,
        resolved: 1,
        order: ["kernel.loader.invalid-state"],
        missing: 0,
        conflicts: 0,
        cycles: 0,
        errors: [],
        warnings: []
      }
    };

    const result = loader.load(resolution);

    expect(result.valid).toBe(false);
    expect(result.rejected).toEqual([
      expect.objectContaining({
        reason: "invalid-state",
        message: "module state cannot be loaded in this phase: kernel.loader.invalid-state is initialized"
      })
    ]);
  });

  it("rejects descriptors already marked as loaded", () => {
    const loader = new KernelResolvedModuleLoader(undefined, undefined, () => loadedAt);
    const alreadyLoaded = descriptor("kernel.loader.already-loaded", [], "loaded");
    const resolution: ModuleDependencyResolutionResult = {
      valid: true,
      order: [alreadyLoaded],
      resolved: [alreadyLoaded],
      missing: [],
      conflicts: [],
      cycles: [],
      errors: [],
      warnings: [],
      report: {
        analyzed: 1,
        resolved: 1,
        order: ["kernel.loader.already-loaded"],
        missing: 0,
        conflicts: 0,
        cycles: 0,
        errors: [],
        warnings: []
      }
    };

    const result = loader.load(resolution);

    expect(result.valid).toBe(false);
    expect(result.rejected).toEqual([
      expect.objectContaining({
        reason: "invalid-state",
        message: "module is already marked as loaded: kernel.loader.already-loaded"
      })
    ]);
  });

  it("rejects invalid resolution results without loading modules", () => {
    const loader = new KernelResolvedModuleLoader(undefined, undefined, () => loadedAt);
    const module = descriptor("kernel.loader.invalid-resolution");
    const resolution = resolve([descriptor("kernel.depends", [{ id: "kernel.missing" }])]);
    const invalidResolution: ModuleDependencyResolutionResult = {
      ...resolution,
      order: [module]
    };

    const result = loader.load(invalidResolution);

    expect(result.valid).toBe(false);
    expect(result.loaded).toEqual([]);
    expect(result.errors).toEqual([
      "missing dependency: kernel.depends requires kernel.missing",
      "module resolution is invalid: kernel.loader.invalid-resolution"
    ]);
  });

  it("loads descriptors from discovered and validated states through allowed transitions", () => {
    const loader = new KernelResolvedModuleLoader(undefined, undefined, () => loadedAt);
    const discovered = descriptor("kernel.loader.discovered", [], "discovered");
    const validated = descriptor("kernel.loader.validated", [], "validated");

    const resolution: ModuleDependencyResolutionResult = {
      valid: true,
      order: [discovered, validated],
      resolved: [discovered, validated],
      missing: [],
      conflicts: [],
      cycles: [],
      errors: [],
      warnings: [],
      report: {
        analyzed: 2,
        resolved: 2,
        order: ["kernel.loader.discovered", "kernel.loader.validated"],
        missing: 0,
        conflicts: 0,
        cycles: 0,
        errors: [],
        warnings: []
      }
    };

    const result = loader.load(resolution);

    expect(result.valid).toBe(true);
    expect(ids(result.loaded)).toEqual(["kernel.loader.discovered", "kernel.loader.validated"]);
  });
});