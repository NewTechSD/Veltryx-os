import { describe, expect, it } from "vitest";
import {
  ConfigurationProvider,
  KernelModuleLoader,
  KernelServiceRegistry,
  RuntimeBootstrapService,
  VeltryxKernel,
  createBootstrapContext
} from "../src/index.js";

describe("RuntimeBootstrapService", () => {
  it("starts idle, reads official snapshots and reports non-critical warnings", async () => {
    const service = new RuntimeBootstrapService(
      {
        configuration: new ConfigurationProvider(),
        services: new KernelServiceRegistry(),
        modules: new KernelModuleLoader()
      },
      () => new Date("2026-08-25T12:00:00Z")
    );
    expect(service.status().status).toBe("idle");
    const result = await service.bootstrap();
    expect(result.success).toBe(true);
    expect(result.status).toMatchObject({
      status: "warning",
      environment: "test",
      runtimeMode: "preview",
      bootstrappedAt: "2026-08-25T12:00:00.000Z"
    });
    expect(Object.isFrozen(result.status)).toBe(true);
    expect(service.context()?.warnings).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "runtime.noModulesLoaded" })])
    );
    expect(service.snapshot()?.status).toBe("warning");
    service.stop();
    expect(service.status().status).toBe("stopped");
    expect(service.context()?.lifecycle).toBe("stopped");
    expect(service.snapshot()?.status).toBe("stopped");
  });

  it("supports a controlled repeated bootstrap", async () => {
    const service = new RuntimeBootstrapService({
      configuration: new ConfigurationProvider(),
      services: new KernelServiceRegistry(),
      modules: new KernelModuleLoader()
    });
    await service.bootstrap(createBootstrapContext().snapshot());
    const repeated = await service.bootstrap(createBootstrapContext().snapshot());
    expect(repeated.success).toBe(true);
    expect(repeated.status.warnings).toContainEqual(
      expect.objectContaining({ code: "runtime.bootstrapAlreadyExecuted" })
    );
  });

  it("normalizes snapshot failures", async () => {
    const modules = new KernelModuleLoader();
    modules.snapshot = async () => {
      throw new Error("stack-sensitive detail");
    };
    const service = new RuntimeBootstrapService({
      configuration: new ConfigurationProvider(),
      services: new KernelServiceRegistry(),
      modules
    });
    const result = await service.bootstrap();
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.status)).not.toContain("stack-sensitive");
  });

  it("is resolved by the Kernel container and preserves the legacy runtime API", async () => {
    const kernel = new VeltryxKernel();
    const context = createBootstrapContext();
    expect(kernel.container().snapshot().providersRegistered).toBeGreaterThan(0);
    await kernel.bootstrap(context);
    await kernel.initialize(context);
    expect(kernel.runtime().state()).toBe("ready");
    expect(kernel.runtimeBootstrap()?.status().status).toBe("warning");
    expect(kernel.runtime().context()).toBeDefined();
    expect(kernel.runtime().snapshot()).toBeDefined();
    expect(kernel.runtime().status()).toBe("warning");
    expect(kernel.services().has("kernel.runtimeBootstrap")).toBe(true);
  });
});
