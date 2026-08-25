import { describe, expect, it } from "vitest";
import type { ModuleDescriptor, ModuleManifest } from "@veltryx/contracts";

import {
  KernelModuleCycleDetector,
  KernelModuleDependencyGraph,
  KernelModuleDependencyResolver,
  KernelModuleDescriptor,
  KernelModuleTopologicalSorter
} from "../src/index.js";

const baseManifest: ModuleManifest = {
  id: "kernel.base",
  name: "Kernel Base",
  version: "1.0.0",
  description: "Base module used by resolver tests",
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
  compatibility: ModuleManifest["compatibility"] = baseManifest.compatibility
): ModuleDescriptor {
  return new KernelModuleDescriptor({
    ...baseManifest,
    id,
    name: `Module ${id}`,
    dependencies,
    compatibility
  });
}

function ids(descriptors: readonly ModuleDescriptor[]): readonly string[] {
  return descriptors.map((moduleDescriptor) => moduleDescriptor.manifest.id);
}

describe("KernelModuleDependencyGraph", () => {
  it("adds modules and exposes dependencies and dependents", () => {
    const graph = new KernelModuleDependencyGraph();
    const core = descriptor("kernel.core");
    const crm = descriptor("kernel.crm", [{ id: "kernel.core" }]);

    graph.addModule(crm);
    graph.addModule(core);
    graph.addDependency("kernel.crm", "kernel.core");

    expect(graph.getModuleIds()).toEqual(["kernel.core", "kernel.crm"]);
    expect(graph.getModule("kernel.core")).toBe(core);
    expect(graph.hasModule("kernel.crm")).toBe(true);
    expect(graph.getDependencies("kernel.crm")).toEqual([
      { from: "kernel.crm", to: "kernel.core", optional: false }
    ]);
    expect(graph.getDependents("kernel.core")).toEqual([
      { from: "kernel.crm", to: "kernel.core", optional: false }
    ]);
  });


  it("sorts multiple dependents deterministically", () => {
    const graph = new KernelModuleDependencyGraph();
    const core = descriptor("kernel.core");
    const billing = descriptor("kernel.billing");
    const accounts = descriptor("kernel.accounts");

    graph.addModule(core);
    graph.addModule(billing);
    graph.addModule(accounts);
    graph.addDependency("kernel.billing", "kernel.core", true);
    graph.addDependency("kernel.accounts", "kernel.core");

    expect(graph.getDependents("kernel.core")).toEqual([
      { from: "kernel.accounts", to: "kernel.core", optional: false },
      { from: "kernel.billing", to: "kernel.core", optional: true }
    ]);
  });
  it("rejects duplicate modules and unknown edge endpoints", () => {
    const graph = new KernelModuleDependencyGraph();
    const core = descriptor("kernel.core");

    graph.addModule(core);

    expect(() => graph.addModule(core)).toThrow(
      "Module already exists in dependency graph: kernel.core"
    );
    expect(() => graph.addDependency("kernel.crm", "kernel.core")).toThrow(
      "Module not found in dependency graph: kernel.crm"
    );
    expect(() => graph.addDependency("kernel.core", "kernel.crm")).toThrow(
      "Dependency not found in dependency graph: kernel.crm"
    );
  });
});

describe("KernelModuleDependencyResolver", () => {
  it("resolves a module without dependencies", () => {
    const resolver = new KernelModuleDependencyResolver();
    const module = descriptor("kernel.standalone");

    const result = resolver.resolve([module]);

    expect(result.valid).toBe(true);
    expect(ids(result.order)).toEqual(["kernel.standalone"]);
    expect(result.missing).toEqual([]);
    expect(result.conflicts).toEqual([]);
    expect(result.cycles).toEqual([]);
    expect(result.report).toMatchObject({ analyzed: 1, resolved: 1, order: ["kernel.standalone"] });
  });

  it("resolves a simple dependency chain in initialization order", () => {
    const resolver = new KernelModuleDependencyResolver();
    const api = descriptor("kernel.api", [{ id: "kernel.service" }]);
    const service = descriptor("kernel.service", [{ id: "kernel.core" }]);
    const core = descriptor("kernel.core");

    const result = resolver.resolve([api, service, core]);

    expect(result.valid).toBe(true);
    expect(ids(result.order)).toEqual(["kernel.core", "kernel.service", "kernel.api"]);
  });

  it("resolves multiple dependencies before the dependent module", () => {
    const resolver = new KernelModuleDependencyResolver();
    const sales = descriptor("kernel.sales", [
      { id: "kernel.accounts" },
      { id: "kernel.catalog" }
    ]);
    const catalog = descriptor("kernel.catalog");
    const accounts = descriptor("kernel.accounts");

    const result = resolver.resolve([sales, catalog, accounts]);

    expect(result.valid).toBe(true);
    expect(ids(result.order)).toEqual(["kernel.accounts", "kernel.catalog", "kernel.sales"]);
  });

  it("reports missing required dependencies and fails resolution", () => {
    const resolver = new KernelModuleDependencyResolver();
    const crm = descriptor("kernel.crm", [{ id: "kernel.accounts" }]);

    const result = resolver.resolve([crm]);

    expect(result.valid).toBe(false);
    expect(result.order).toEqual([]);
    expect(result.missing).toEqual([
      { moduleId: "kernel.crm", dependencyId: "kernel.accounts", optional: false }
    ]);
    expect(result.errors).toEqual(["missing dependency: kernel.crm requires kernel.accounts"]);
    expect(result.report.missing).toBe(1);
  });

  it("warns about missing optional dependencies without blocking resolution", () => {
    const resolver = new KernelModuleDependencyResolver();
    const crm = descriptor("kernel.crm", [{ id: "kernel.analytics", optional: true }]);

    const result = resolver.resolve([crm]);

    expect(result.valid).toBe(true);
    expect(ids(result.order)).toEqual(["kernel.crm"]);
    expect(result.warnings).toEqual([
      "optional dependency missing: kernel.crm references kernel.analytics"
    ]);
  });

  it("detects a simple dependency cycle", () => {
    const resolver = new KernelModuleDependencyResolver();
    const a = descriptor("kernel.a", [{ id: "kernel.b" }]);
    const b = descriptor("kernel.b", [{ id: "kernel.a" }]);

    const result = resolver.resolve([a, b]);

    expect(result.valid).toBe(false);
    expect(result.order).toEqual([]);
    expect(result.cycles).toEqual([{ moduleIds: ["kernel.a", "kernel.b", "kernel.a"] }]);
    expect(result.errors).toEqual(["dependency cycle: kernel.a -> kernel.b -> kernel.a"]);
  });

  it("detects a complex dependency cycle", () => {
    const resolver = new KernelModuleDependencyResolver();
    const a = descriptor("kernel.a", [{ id: "kernel.b" }]);
    const b = descriptor("kernel.b", [{ id: "kernel.c" }]);
    const c = descriptor("kernel.c", [{ id: "kernel.a" }]);
    const d = descriptor("kernel.d");

    const result = resolver.resolve([d, c, b, a]);

    expect(result.valid).toBe(false);
    expect(result.cycles).toEqual([{ moduleIds: ["kernel.a", "kernel.b", "kernel.c", "kernel.a"] }]);
    expect(result.report).toMatchObject({ analyzed: 4, resolved: 0, cycles: 1 });
  });

  it("orders multiple independent graphs deterministically", () => {
    const resolver = new KernelModuleDependencyResolver();
    const billing = descriptor("kernel.billing", [{ id: "kernel.accounts" }]);
    const accounts = descriptor("kernel.accounts");
    const projects = descriptor("kernel.projects", [{ id: "kernel.workspaces" }]);
    const workspaces = descriptor("kernel.workspaces");

    const result = resolver.resolve([projects, billing, workspaces, accounts]);

    expect(result.valid).toBe(true);
    expect(ids(result.order)).toEqual([
      "kernel.accounts",
      "kernel.billing",
      "kernel.workspaces",
      "kernel.projects"
    ]);
  });


  it("reports duplicate module ids during resolution", () => {
    const resolver = new KernelModuleDependencyResolver();
    const first = descriptor("kernel.duplicate");
    const second = descriptor("kernel.duplicate");

    const result = resolver.resolve([first, second]);

    expect(result.valid).toBe(false);
    expect(result.conflicts).toEqual([
      {
        moduleId: "kernel.duplicate",
        field: "id",
        message: "duplicate module id in dependency resolution: kernel.duplicate"
      }
    ]);
  });

  it("reports malformed compatibility fields", () => {
    const resolver = new KernelModuleDependencyResolver();
    const invalid = descriptor("kernel.invalid", [], { kernel: "" });

    const result = resolver.resolve([invalid]);

    expect(result.valid).toBe(false);
    expect(result.conflicts).toEqual([
      {
        moduleId: "kernel.invalid",
        field: "compatibility.kernel",
        message: "kernel.invalid compatibility.kernel must be a non-empty string"
      }
    ]);
  });
  it("reports structural compatibility conflicts", () => {
    const resolver = new KernelModuleDependencyResolver();
    const invalid = descriptor("kernel.invalid", [], [] as unknown as ModuleManifest["compatibility"]);

    const result = resolver.resolve([invalid]);

    expect(result.valid).toBe(false);
    expect(result.order).toEqual([]);
    expect(result.conflicts).toEqual([
      {
        moduleId: "kernel.invalid",
        field: "compatibility",
        message: "kernel.invalid compatibility must be an object"
      }
    ]);
  });

  it("reports malformed descriptor identity and dependency structure", () => {
    const resolver = new KernelModuleDependencyResolver();
    const invalid = new KernelModuleDescriptor({
      ...baseManifest,
      id: "",
      name: "",
      version: "",
      dependencies: "invalid" as unknown as ModuleManifest["dependencies"]
    });

    const result = resolver.resolve([invalid]);

    expect(result.valid).toBe(false);
    expect(result.missing).toEqual([]);
    expect(result.conflicts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "id" }),
        expect.objectContaining({ field: "name" }),
        expect.objectContaining({ field: "version" }),
        expect.objectContaining({ field: "dependencies" })
      ])
    );
  });
});

describe("KernelModuleCycleDetector and KernelModuleTopologicalSorter", () => {

  it("sorts multiple detected cycles deterministically", () => {
    const graph = new KernelModuleDependencyGraph();
    const a = descriptor("kernel.a");
    const b = descriptor("kernel.b");
    const c = descriptor("kernel.c");
    const d = descriptor("kernel.d");

    graph.addModule(d);
    graph.addModule(c);
    graph.addModule(b);
    graph.addModule(a);
    graph.addDependency("kernel.b", "kernel.a");
    graph.addDependency("kernel.a", "kernel.b");
    graph.addDependency("kernel.d", "kernel.c");
    graph.addDependency("kernel.c", "kernel.d");

    expect(new KernelModuleCycleDetector().detect(graph)).toEqual([
      { moduleIds: ["kernel.a", "kernel.b", "kernel.a"] },
      { moduleIds: ["kernel.c", "kernel.d", "kernel.c"] }
    ]);
  });

  it("rejects sorting when the graph returns a missing descriptor", () => {
    const graph = {
      getModuleIds: () => ["kernel.missing"],
      getModule: () => undefined,
      getDependencies: () => []
    };

    expect(() => new KernelModuleTopologicalSorter().sort(graph as never)).toThrow(
      "Module not found in dependency graph: kernel.missing"
    );
  });
  it("detect cycles and reject sorting cyclic graphs", () => {
    const graph = new KernelModuleDependencyGraph();
    const a = descriptor("kernel.a");
    const b = descriptor("kernel.b");

    graph.addModule(a);
    graph.addModule(b);
    graph.addDependency("kernel.a", "kernel.b");
    graph.addDependency("kernel.b", "kernel.a");

    expect(new KernelModuleCycleDetector().detect(graph)).toEqual([
      { moduleIds: ["kernel.a", "kernel.b", "kernel.a"] }
    ]);
    expect(() => new KernelModuleTopologicalSorter().sort(graph)).toThrow(
      "Cannot sort dependency graph with cycle at module: kernel.a"
    );
  });
});