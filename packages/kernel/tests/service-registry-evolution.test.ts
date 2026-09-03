import { describe, expect, it } from "vitest";
import type { ServiceDescriptorInput, ServiceToken } from "@veltryx/contracts";
import {
  KERNEL_SERVICE_TOKENS,
  KernelServiceRegistry,
  ServiceRegistryValidator,
  VeltryxKernel,
  createServiceDescriptor,
  createServiceRegistrySnapshot,
  freezeServiceToken,
  serviceTokenId,
  validateServiceTokenId
} from "../src/index.js";

const generatedAt = new Date("2026-08-25T12:00:00.000Z");

function token(id = "kernel.testService", scope: ServiceToken["scope"] = "global"): ServiceToken {
  return { id, version: "1.0.0", owner: "kernel", scope, description: "Test token" };
}

function descriptor(overrides: Partial<ServiceDescriptorInput> = {}): ServiceDescriptorInput {
  return {
    name: "Test Service",
    description: "Safe public descriptor",
    category: "kernel",
    lifecycle: "available",
    scope: "global",
    status: "ok",
    source: "kernel",
    version: "1.0.0",
    tags: ["kernel", "test"],
    warnings: [],
    errors: [],
    diagnostics: [],
    ...overrides
  };
}

describe("Service token and descriptor validation", () => {
  it("accepts and freezes a stable valid token", () => {
    const value = token();
    expect(serviceTokenId(value)).toBe("kernel.testService");
    expect(serviceTokenId("kernel.testService")).toBe("kernel.testService");
    expect(freezeServiceToken(value)).toEqual(value);
    expect(Object.isFrozen(freezeServiceToken(value))).toBe(true);
    expect(() => validateServiceTokenId("kernel.testService")).not.toThrow();
  });

  it("rejects empty, malformed, unversioned and ownerless tokens", () => {
    expect(() => validateServiceTokenId("")).toThrow("non-empty");
    expect(() => validateServiceTokenId("Malformed Token")).toThrow("malformed");
    expect(() => freezeServiceToken({ ...token(), version: "" })).toThrow("version");
    expect(() => freezeServiceToken({ ...token(), owner: "" })).toThrow("owner");
  });

  it("accepts a complete descriptor and rejects missing or invalid fields", () => {
    const validator = new ServiceRegistryValidator();
    expect(() => validator.validateDescriptor(descriptor())).not.toThrow();
    expect(() => validator.validateDescriptor({ ...descriptor(), name: "" })).toThrow("name");
    expect(() =>
      validator.validateDescriptor({ ...descriptor(), category: undefined } as never)
    ).toThrow("category");
    expect(() =>
      validator.validateDescriptor({ ...descriptor(), scope: undefined } as never)
    ).toThrow("scope");
    expect(() =>
      validator.validateDescriptor({ ...descriptor(), lifecycle: undefined } as never)
    ).toThrow("lifecycle");
    expect(() =>
      validator.validateDescriptor({ ...descriptor(), status: "invalid" } as never)
    ).toThrow("status");
    expect(() => validator.validateDescriptor({ ...descriptor(), tags: [""] })).toThrow("tags");
    expect(() => validator.validateDescriptor(undefined as never)).toThrow("defined");
    expect(() => validator.validateProvider({} as never)).toThrow("resolve function");
  });

  it("derives an unknown registered descriptor and applies token fallbacks", () => {
    const publicDescriptor = createServiceDescriptor(
      token(),
      {
        name: "Registered Service",
        category: "kernel",
        lifecycle: "registered",
        scope: "global",
        tags: ["registered"]
      },
      generatedAt,
      false
    );
    expect(publicDescriptor).toMatchObject({
      status: "unknown",
      source: "kernel",
      version: "1.0.0",
      lifecycle: "registered"
    });
  });
});

describe("Evolved Service Registry", () => {
  it("creates an immutable empty snapshot", () => {
    const registry = new KernelServiceRegistry({ now: () => generatedAt });
    const snapshot = registry.snapshot();
    expect(snapshot).toMatchObject({
      status: "empty",
      generatedAt: generatedAt.toISOString(),
      servicesRegistered: 0,
      servicesAvailable: 0,
      servicesWithWarnings: 0,
      servicesWithErrors: 0
    });
    expect(snapshot.services).toEqual([]);
    expect(Object.isFrozen(snapshot)).toBe(true);
  });

  it("registers, gets, checks and lists a direct service", async () => {
    const registry = new KernelServiceRegistry({ now: () => generatedAt });
    const service = { ready: true, mutable: { secret: "internal" } };
    await registry.register(token(), service, descriptor());

    expect(registry.get(token())).toBe(service);
    expect(registry.get("kernel.missing")).toBeUndefined();
    expect(registry.has("kernel.testService")).toBe(true);
    expect(registry.has("kernel.missing")).toBe(false);
    expect(registry.list()).toEqual([token()]);
    expect(Object.isFrozen(registry.list())).toBe(true);

    const snapshot = registry.snapshot();
    expect(snapshot).toMatchObject({
      status: "ready",
      servicesRegistered: 1,
      servicesAvailable: 1
    });
    expect(snapshot.services[0]).toMatchObject({
      token: "kernel.testService",
      name: "Test Service",
      category: "kernel",
      lifecycle: "available",
      scope: "global",
      status: "ok",
      registeredAt: generatedAt.toISOString(),
      source: "kernel",
      version: "1.0.0",
      tags: ["kernel", "test"]
    });
    expect(JSON.stringify(snapshot)).not.toContain("internal");
    expect(JSON.stringify(snapshot)).not.toContain("resolve");
    expect(JSON.stringify(snapshot)).not.toContain("function");
  });

  it("removes services explicitly and handles unknown removals", async () => {
    const registry = new KernelServiceRegistry();
    await registry.register(token(), { ready: true }, descriptor());
    expect(registry.remove(token())).toBe(true);
    expect(registry.remove(token())).toBe(false);
    expect(registry.has(token())).toBe(false);
    expect(registry.snapshot().diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "SERVICE_REMOVED" })])
    );
  });

  it("rejects invalid services and missing descriptors", async () => {
    const registry = new KernelServiceRegistry();
    await expect(registry.register(token(), undefined, descriptor())).rejects.toThrow(
      "must be defined"
    );
    await expect(registry.register(token(), {}, undefined as never)).rejects.toThrow(
      "descriptor must be defined"
    );
  });

  it("prevents duplicates by default", async () => {
    const registry = new KernelServiceRegistry();
    await registry.register(token(), { version: 1 }, descriptor());
    await expect(registry.register(token(), { version: 2 }, descriptor())).rejects.toThrow(
      "already registered"
    );
    expect(registry.get<{ version: number }>(token())).toEqual({ version: 1 });
    expect(registry.snapshot().errors).toEqual([
      expect.objectContaining({ code: "SERVICE_DUPLICATE", token: "kernel.testService" })
    ]);
  });

  it("allows only explicit replacement and records warnings and diagnostics", async () => {
    const registry = new KernelServiceRegistry({ now: () => generatedAt });
    await registry.register(token(), { version: 1 }, descriptor());
    await registry.register(token(), { version: 2 }, descriptor(), { replace: true });
    const snapshot = registry.snapshot();

    expect(registry.get<{ version: number }>(token())).toEqual({ version: 2 });
    expect(snapshot.status).toBe("partial");
    expect(snapshot.servicesRegistered).toBe(1);
    expect(snapshot.servicesAvailable).toBe(1);
    expect(snapshot.servicesWithWarnings).toBe(1);
    expect(snapshot.services[0]?.lifecycle).toBe("replaced");
    expect(snapshot.services[0]?.warnings).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "SERVICE_REPLACED" })])
    );
    expect(snapshot.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "SERVICE_REGISTRY_REPLACEMENT_SUMMARY", detail: "1" })
      ])
    );
  });

  it("derives warning and error counters from public descriptors", async () => {
    const registry = new KernelServiceRegistry();
    await registry.register(
      "kernel.warningService",
      {},
      descriptor({
        warnings: [{ code: "DEGRADED", message: "Temporarily degraded.", source: "test" }]
      })
    );
    await registry.register(
      "kernel.errorService",
      {},
      descriptor({ errors: [{ code: "FAILED", message: "Controlled failure.", source: "test" }] })
    );
    const snapshot = registry.snapshot();

    expect(snapshot.status).toBe("error");
    expect(snapshot.servicesRegistered).toBe(2);
    expect(snapshot.servicesAvailable).toBe(2);
    expect(snapshot.servicesWithWarnings).toBe(1);
    expect(snapshot.servicesWithErrors).toBe(1);
    expect(snapshot.services.map((service) => service.status)).toEqual(["warning", "error"]);
  });

  it("protects all public snapshot structures from mutation", async () => {
    const registry = new KernelServiceRegistry();
    await registry.register(
      token(),
      {},
      descriptor({ warnings: [{ code: "NOTICE", message: "Notice.", source: "test" }] })
    );
    const snapshot = registry.snapshot();
    expect(Object.isFrozen(snapshot.services)).toBe(true);
    expect(Object.isFrozen(snapshot.services[0])).toBe(true);
    expect(Object.isFrozen(snapshot.services[0]?.tags)).toBe(true);
    expect(Object.isFrozen(snapshot.services[0]?.warnings)).toBe(true);
    expect(Object.isFrozen(snapshot.diagnostics)).toBe(true);
  });

  it("normalizes snapshot failures without stack traces", () => {
    const registry = new KernelServiceRegistry({ now: () => new Date(Number.NaN) });
    const snapshot = registry.snapshot();
    expect(snapshot.status).toBe("error");
    expect(snapshot.generatedAt).toBe("unavailable");
    expect(snapshot.errors).toEqual([
      expect.objectContaining({ code: "SERVICE_REGISTRY_SNAPSHOT_FAILED" })
    ]);
    expect(JSON.stringify(snapshot)).not.toContain("stack");
  });

  it("normalizes malformed descriptor snapshots with a valid timestamp", () => {
    const snapshot = createServiceRegistrySnapshot({
      generatedAt,
      services: [{ tags: undefined } as never],
      warnings: [],
      errors: [],
      diagnostics: []
    });
    expect(snapshot.status).toBe("error");
    expect(snapshot.generatedAt).toBe(generatedAt.toISOString());
  });

  it("deduplicates registry issues and aggregates service diagnostics", () => {
    const warning = { code: "DUPLICATE", message: "Same warning.", source: "test" };
    const publicDescriptor = createServiceDescriptor(
      token(),
      descriptor({
        warnings: [warning, warning],
        diagnostics: [
          {
            code: "SERVICE_DETAIL",
            message: "Service diagnostic.",
            severity: "info",
            source: "test"
          }
        ]
      }),
      generatedAt,
      true
    );
    const snapshot = createServiceRegistrySnapshot({
      generatedAt,
      services: [publicDescriptor],
      warnings: [warning],
      errors: [],
      diagnostics: []
    });
    expect(snapshot.warnings).toHaveLength(1);
    expect(snapshot.diagnostics).toEqual([expect.objectContaining({ code: "SERVICE_DETAIL" })]);
  });

  it("preserves legacy provider resolution and singleton reuse", async () => {
    const registry = new KernelServiceRegistry();
    let calls = 0;
    await registry.register({
      token: token("kernel.legacyService"),
      resolve: () => ({ calls: ++calls })
    });
    await expect(
      registry.resolve<{ calls: number }>(token("kernel.legacyService"))
    ).resolves.toEqual({ calls: 1 });
    await expect(
      registry.resolve<{ calls: number }>(token("kernel.legacyService"))
    ).resolves.toEqual({ calls: 1 });
    expect(registry.get(token("kernel.legacyService"))).toBeUndefined();
    await expect(registry.resolve(token("kernel.missing"))).rejects.toThrow("not registered");
  });

  it("preserves direct resolve plus singleton and transient legacy semantics", async () => {
    const registry = new KernelServiceRegistry();
    await registry.register(token("kernel.directService"), { direct: true }, descriptor());
    await expect(registry.resolve(token("kernel.directService"))).resolves.toEqual({
      direct: true
    });

    let singletonCalls = 0;
    const singleton = token("kernel.singletonService", "singleton");
    await registry.register({ token: singleton, resolve: () => ({ call: ++singletonCalls }) });
    await registry.resolve(singleton);
    await registry.resolve(singleton);
    expect(singletonCalls).toBe(1);

    let transientCalls = 0;
    const transient = token("module.transientService", "transient");
    await registry.register({
      token: { ...transient, owner: "module" },
      resolve: () => ({ call: ++transientCalls })
    });
    await registry.resolve(transient);
    await registry.resolve(transient);
    expect(transientCalls).toBe(2);
    expect(
      registry.snapshot().services.find((service) => service.token === transient.id)?.category
    ).toBe("system");
  });
});

describe("Kernel Service Registry integration", () => {
  it("registers only existing structural services and feeds Kernel Status", async () => {
    const kernel = new VeltryxKernel();
    const before = kernel.state();
    const snapshot = kernel.services().snapshot();
    const status = await kernel.status().snapshot();

    expect(snapshot.services.map((service) => service.token).sort()).toEqual(
      [
        KERNEL_SERVICE_TOKENS.componentRegistry,
        KERNEL_SERVICE_TOKENS.componentPersistence,
        KERNEL_SERVICE_TOKENS.configuration,
        KERNEL_SERVICE_TOKENS.configurationPersistence,
        KERNEL_SERVICE_TOKENS.dependencyInjection,
        KERNEL_SERVICE_TOKENS.eventBus,
        KERNEL_SERVICE_TOKENS.executionContextFactory,
        KERNEL_SERVICE_TOKENS.metadataEngine,
        KERNEL_SERVICE_TOKENS.metadataPersistence,
        KERNEL_SERVICE_TOKENS.metadataRegistry,
        KERNEL_SERVICE_TOKENS.moduleSystem,
        KERNEL_SERVICE_TOKENS.persistence,
      KERNEL_SERVICE_TOKENS.runtime,
      KERNEL_SERVICE_TOKENS.runtimeApi,
        KERNEL_SERVICE_TOKENS.serviceRegistry,
        KERNEL_SERVICE_TOKENS.snapshotRetentionAudit,
        KERNEL_SERVICE_TOKENS.uiCompositionPersistence,
        KERNEL_SERVICE_TOKENS.uiCompositionRuntime
      ].sort()
    );
    expect(snapshot.services).toHaveLength(18);
    expect(
      snapshot.services.some((service) => service.token === KERNEL_SERVICE_TOKENS.status)
    ).toBe(false);
    expect(status.servicesRegistered).toMatchObject({ status: "available", value: 18 });
    expect(status.dependencyInjectionStatus).toBe("ready");
    expect(status.serviceRegistryStatus).toMatchObject({ status: "available" });
    expect(kernel.state()).toBe(before);
  });
});


