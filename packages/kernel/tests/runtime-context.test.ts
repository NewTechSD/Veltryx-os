import { describe, expect, it } from "vitest";
import type { RuntimeContext } from "@veltryx/contracts";
import {
  ConfigurationProvider,
  DependencyInjectionContainer,
  KernelModuleLoader,
  KernelServiceRegistry,
  RuntimeContextFactory,
  RuntimeContextValidator,
  RuntimeLifecycleController,
  RuntimeStatusSnapshotService,
  createBootstrapContext
} from "../src/index.js";

async function createFactoryInput() {
  const configuration = new ConfigurationProvider({
    environment: { NODE_ENV: "test", DATABASE_PASSWORD: "never-public" }
  }).snapshot();
  const services = new KernelServiceRegistry().snapshot();
  const dependencyInjection = new DependencyInjectionContainer().snapshot();
  const modules = await new KernelModuleLoader().snapshot();
  return {
    runtimeId: "runtime-test",
    lifecycle: "warning" as const,
    configuration,
    services,
    dependencyInjection,
    modules,
    bootstrap: {
      status: "warning" as const,
      bootstrappedAt: "2026-08-25T12:00:00.000Z",
      runtimeMode: configuration.runtimeMode,
      environment: configuration.environment,
      servicesAvailable: 0,
      modulesAvailable: 0,
      warnings: [],
      errors: [],
      diagnostics: []
    },
    execution: createBootstrapContext().snapshot()
  };
}

describe("Runtime Context", () => {
  it("creates an immutable context exclusively from public snapshots", async () => {
    const factory = new RuntimeContextFactory(undefined, () => new Date("2026-08-25T12:00:01Z"));
    const context = factory.create(await createFactoryInput());
    expect(context).toMatchObject({
      runtimeId: "runtime-test",
      lifecycle: "warning",
      environment: "test",
      runtimeMode: "preview",
      generatedAt: "2026-08-25T12:00:01.000Z",
      bootstrappedAt: "2026-08-25T12:00:00.000Z"
    });
    expect(context.execution).toMatchObject({
      requestId: "kernel-bootstrap",
      correlationId: "kernel-bootstrap",
      tenantAvailable: true
    });
    expect(context.warnings).toContainEqual(
      expect.objectContaining({ code: "runtime.noModulesLoaded" })
    );
    expect(Object.isFrozen(context)).toBe(true);
    expect(Object.isFrozen(context.modules)).toBe(true);
    expect(Object.isFrozen(context.warnings)).toBe(true);
    const serialized = JSON.stringify(context);
    expect(serialized).not.toContain("never-public");
    expect(serialized).not.toContain("DATABASE_PASSWORD");
    expect(serialized).not.toContain("permissions");
    expect(serialized).not.toContain("useFactory");
    expect(serialized).not.toContain("stack");
  });

  it("normalizes a missing optional Execution Context as a warning", async () => {
    const input = await createFactoryInput();
    const context = new RuntimeContextFactory().create({ ...input, execution: undefined });
    expect(context.execution).toBeUndefined();
    expect(context.warnings).toContainEqual(
      expect.objectContaining({ code: "runtime.executionContextMissing" })
    );
  });

  it("normalizes partial and unavailable public snapshots", async () => {
    const input = await createFactoryInput();
    const partial = new RuntimeContextFactory().create({
      ...input,
      lifecycle: "warning",
      configuration: {
        ...input.configuration,
        warnings: [{ code: "CONFIG_WARNING", message: "Normalized", source: "configuration" }]
      } as never,
      services: { ...input.services, status: "partial" },
      dependencyInjection: { ...input.dependencyInjection, status: "partial" },
      modules: { ...input.modules, status: "partial" }
    });
    expect(partial.warnings.map((warning) => warning.code)).toEqual(
      expect.arrayContaining([
        "runtime.partialModuleSystem",
        "runtime.diPartial",
        "runtime.serviceRegistryPartial",
        "runtime.configurationWarning"
      ])
    );

    const unavailable = new RuntimeContextFactory().create({
      ...input,
      lifecycle: "error",
      configuration: {
        ...input.configuration,
        errors: [{ code: "CONFIG_ERROR", message: "Normalized", source: "configuration" }]
      } as never,
      services: { ...input.services, status: "error" },
      dependencyInjection: { ...input.dependencyInjection, status: "error" },
      modules: { ...input.modules, status: "error" }
    });
    expect(unavailable.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining([
        "runtime.configurationUnavailable",
        "runtime.serviceRegistryUnavailable",
        "runtime.diUnavailable",
        "runtime.moduleSystemUnavailable"
      ])
    );
  });

  it("validates ids, lifecycle, environment, mode, counters and unsafe functions", async () => {
    const context = new RuntimeContextFactory().create(await createFactoryInput());
    const validator = new RuntimeContextValidator();
    expect(validator.validate(context).valid).toBe(true);
    const invalid = {
      ...context,
      runtimeId: " ",
      lifecycle: "invalid",
      environment: "invalid",
      runtimeMode: "invalid",
      services: { ...context.services, registered: -1 },
      unsafe: () => undefined
    } as unknown as RuntimeContext;
    const result = validator.validate(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining([
        "RUNTIME_CONTEXT_ID_INVALID",
        "RUNTIME_CONTEXT_LIFECYCLE_INVALID",
        "RUNTIME_CONTEXT_ENVIRONMENT_INVALID",
        "RUNTIME_CONTEXT_MODE_INVALID",
        "RUNTIME_CONTEXT_COUNTER_INVALID",
        "RUNTIME_CONTEXT_UNSAFE_VALUE"
      ])
    );
  });

  it("rejects a context when an injected validator reports failure", async () => {
    const factory = new RuntimeContextFactory({
      validate: () => ({
        valid: false,
        errors: [{ code: "RUNTIME_CONTEXT_INVALID", message: "Invalid", source: "runtime" }]
      })
    });
    const input = await createFactoryInput();
    expect(() => factory.create(input)).toThrow("Runtime Context validation failed");
  });
});

describe("Runtime lifecycle and status snapshot", () => {
  it("controls every supported lifecycle branch and rejects invalid transitions", () => {
    for (const terminal of ["ready", "warning", "error"] as const) {
      const controller = new RuntimeLifecycleController();
      expect(controller.status()).toBe("idle");
      expect(controller.transition("bootstrapping")).toBe("bootstrapping");
      expect(controller.transition(terminal)).toBe(terminal);
      expect(controller.transition("stopped")).toBe("stopped");
      expect(() => controller.transition("ready")).toThrow("Invalid Runtime lifecycle transition");
    }
  });

  it("creates a safe snapshot with counters, uptime and diagnostics", async () => {
    const context = new RuntimeContextFactory(
      undefined,
      () => new Date("2026-08-25T12:00:01Z")
    ).create(await createFactoryInput());
    const snapshot = new RuntimeStatusSnapshotService(
      () => new Date("2026-08-25T12:00:05Z")
    ).snapshot(context);
    expect(snapshot).toMatchObject({
      status: "warning",
      runtimeId: "runtime-test",
      uptimeMs: 5000,
      modulesLoaded: 0,
      providersRegistered: 0,
      servicesAvailable: 0
    });
    expect(snapshot.diagnostics).toContainEqual(
      expect.objectContaining({ code: "runtime.snapshot.generated" })
    );
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.diagnostics)).toBe(true);
    expect(JSON.stringify(snapshot)).not.toContain("stack");

    const withoutBootTimestamp = new RuntimeStatusSnapshotService().snapshot({
      ...context,
      lifecycle: "ready",
      bootstrappedAt: undefined
    });
    expect(withoutBootTimestamp.status).toBe("ready");
    expect(withoutBootTimestamp.uptimeMs).toBeUndefined();
    const invalidBootTimestamp = new RuntimeStatusSnapshotService().snapshot({
      ...context,
      bootstrappedAt: "invalid"
    });
    expect(invalidBootTimestamp.uptimeMs).toBeUndefined();
  });
});
