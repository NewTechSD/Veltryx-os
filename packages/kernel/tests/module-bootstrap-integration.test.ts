import { describe, expect, it } from "vitest";
import type { ModuleManifest } from "@veltryx/contracts";

import {
  KernelModuleLoader,
  VeltryxKernel,
  createBootstrapContext,
  createKernelDependencies
} from "../src/index.js";

const baseManifest: ModuleManifest = {
  id: "test.module.base",
  name: "Test Module Base",
  version: "1.0.0",
  dependencies: [],
  compatibility: { kernel: "^1.0.0" },
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
  return { ...baseManifest, id, name: `Test ${id}`, dependencies };
}

async function boot(loader: KernelModuleLoader): Promise<VeltryxKernel> {
  const kernel = new VeltryxKernel({ ...createKernelDependencies(), modules: loader });
  const context = createBootstrapContext();
  await kernel.bootstrap(context);
  await kernel.initialize(context);
  return kernel;
}

describe("OS-IMP-0002 module bootstrap integration", () => {
  it("keeps bootstrap valid with no candidates", async () => {
    const kernel = await boot(new KernelModuleLoader());
    const snapshot = await kernel.modules().snapshot();

    expect(snapshot.status).toBe("empty");
    expect(snapshot.modulesLoaded).toBe(0);
    expect(snapshot.reports.discovery).toMatchObject({ found: 0, valid: 0 });
  });

  it("admits and loads a valid host manifest", async () => {
    const loader = new KernelModuleLoader();
    await loader.register(manifest("test.module.valid"), "host:test");

    const kernel = await boot(loader);
    const snapshot = await kernel.modules().snapshot();

    expect(snapshot.status).toBe("ready");
    expect(snapshot.modulesLoaded).toBe(1);
    expect(snapshot.modules[0]).toMatchObject({
      id: "test.module.valid",
      state: "loaded",
      loadingStatus: "loaded",
      metadata: { source: "host:test" }
    });
  });

  it("rejects an invalid manifest during admission", async () => {
    const loader = new KernelModuleLoader();
    await expect(loader.register({ id: "invalid" } as unknown as ModuleManifest)).rejects.toThrow(
      "Invalid module manifest"
    );
    expect(await loader.list()).toEqual([]);
  });

  it("rejects duplicate identifiers without overwriting the staged manifest", async () => {
    const loader = new KernelModuleLoader();
    await loader.register(manifest("test.module.duplicate"), "first");

    await expect(
      loader.register({ ...manifest("test.module.duplicate"), name: "Second" }, "second")
    ).rejects.toThrow("Module already registered: test.module.duplicate");
    expect((await loader.list())[0]?.manifest.name).toBe("Test test.module.duplicate");
  });

  it("reports a missing required dependency and loads nothing", async () => {
    const loader = new KernelModuleLoader();
    await loader.register(manifest("test.module.missing", [{ id: "test.module.absent" }]));

    const kernel = await boot(loader);
    const snapshot = await kernel.modules().snapshot();

    expect(snapshot.status).toBe("partial");
    expect(snapshot.modulesLoaded).toBe(0);
    expect(snapshot.reports.resolution).toMatchObject({ missing: 1, resolved: 0 });
    expect(snapshot.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "MODULE_REQUIRED_DEPENDENCY_MISSING" })
      ])
    );
  });

  it("keeps optional missing dependencies non-blocking", async () => {
    const loader = new KernelModuleLoader();
    await loader.register(
      manifest("test.module.optional", [{ id: "test.module.optional-absent", optional: true }])
    );

    const kernel = await boot(loader);
    const snapshot = await kernel.modules().snapshot();

    expect(snapshot.status).toBe("partial");
    expect(snapshot.modulesLoaded).toBe(1);
    expect(snapshot.modules[0]?.optionalDependencies).toEqual([
      expect.objectContaining({
        moduleId: "test.module.optional-absent",
        status: "optionalMissing"
      })
    ]);
  });

  it("reports circular dependencies and does not invent a loading order", async () => {
    const loader = new KernelModuleLoader();
    await loader.register(manifest("test.module.cycle-a", [{ id: "test.module.cycle-b" }]));
    await loader.register(manifest("test.module.cycle-b", [{ id: "test.module.cycle-a" }]));

    const kernel = await boot(loader);
    const snapshot = await kernel.modules().snapshot();

    expect(snapshot.modulesLoaded).toBe(0);
    expect(snapshot.reports.resolution).toMatchObject({ cycles: 1, resolved: 0, order: [] });
    expect(snapshot.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "MODULE_RESOLUTION_CYCLE" })])
    );
  });

  it("resolves and loads dependencies in deterministic order", async () => {
    const loader = new KernelModuleLoader();
    await loader.register(manifest("test.module.app", [{ id: "test.module.service" }]));
    await loader.register(manifest("test.module.service", [{ id: "test.module.core" }]));
    await loader.register(manifest("test.module.core"));

    await boot(loader);
    const resolution = await loader.resolveDependencies();
    const snapshot = await loader.snapshot();

    expect(resolution.order.map((descriptor) => descriptor.manifest.id)).toEqual([
      "test.module.core",
      "test.module.service",
      "test.module.app"
    ]);
    expect(snapshot.reports.loading?.order).toEqual([
      "test.module.core",
      "test.module.service",
      "test.module.app"
    ]);
  });

  it("keeps the public snapshot consistent with discovery, resolution and loading", async () => {
    const loader = new KernelModuleLoader();
    await loader.register(manifest("test.module.snapshot"));

    const kernel = await boot(loader);
    const snapshot = await kernel.modules().snapshot();

    expect(snapshot.modulesDiscovered).toBe(snapshot.reports.discovery?.found);
    expect(snapshot.modulesValid).toBe(snapshot.reports.discovery?.valid);
    expect(snapshot.modulesResolved).toBe(snapshot.reports.resolution?.resolved);
    expect(snapshot.modulesLoaded).toBe(snapshot.reports.loading?.loaded);
    expect(snapshot.modules.every((module) => module.loadingStatus === "loaded")).toBe(true);
  });

  it("makes repeated initialization idempotent after a successful pipeline", async () => {
    const loader = new KernelModuleLoader();
    await loader.register(manifest("test.module.idempotent"));
    const kernel = await boot(loader);
    const before = await kernel.modules().snapshot();
    const context = createBootstrapContext();

    await kernel.initialize(context);
    const after = await kernel.modules().snapshot();

    expect(after.modulesLoaded).toBe(before.modulesLoaded);
    expect(after.reports.loading?.loaded).toBe(1);
    expect(after.modules).toHaveLength(1);
  });

  it("coalesces concurrent discovery calls into one pipeline execution", async () => {
    const loader = new KernelModuleLoader();
    await loader.register(manifest("test.module.concurrent"));

    await Promise.all([loader.discover(), loader.discover()]);
    const snapshot = await loader.snapshot();

    expect(snapshot.modulesLoaded).toBe(1);
    expect(snapshot.reports.discovery?.found).toBe(1);
    expect(snapshot.reports.loading?.loaded).toBe(1);
  });

  it("coalesces concurrent Kernel initialization calls", async () => {
    const loader = new KernelModuleLoader();
    await loader.register(manifest("test.module.kernel-concurrent"));
    const kernel = new VeltryxKernel({ ...createKernelDependencies(), modules: loader });
    const context = createBootstrapContext();
    await kernel.bootstrap(context);

    await Promise.all([kernel.initialize(context), kernel.initialize(context)]);

    expect(kernel.state()).toBe("initialized");
    expect((await kernel.modules().snapshot()).modulesLoaded).toBe(1);
  });

  it("rejects registration after the pipeline has started", async () => {
    const loader = new KernelModuleLoader();
    await loader.register(manifest("test.module.closed"));
    await loader.discover();

    await expect(loader.register(manifest("test.module.too-late"))).rejects.toThrow(
      "Module registration is closed after pipeline execution"
    );
  });
});
