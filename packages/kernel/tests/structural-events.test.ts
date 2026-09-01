import { describe, expect, it } from "vitest";
import type {
  IModuleDiscoveryValidator,
  ModuleDependencyResolutionResult,
  ModuleDescriptor,
  ModuleManifest
} from "@veltryx/contracts";

import {
  InMemoryEventBus,
  KERNEL_STRUCTURAL_EVENTS,
  KernelModuleDependencyResolver,
  KernelModuleDescriptor,
  KernelModuleDiscovery,
  KernelResolvedModuleLoader,
  KernelStructuralEventPublisher,
  MODULE_SYSTEM_STRUCTURAL_EVENTS,
  STRUCTURAL_EVENT_NAMES,
  VeltryxKernel,
  createBootstrapContext,
  createKernelDependencies
} from "../src/index.js";

const baseManifest: ModuleManifest = {
  id: "structural.module",
  name: "Structural Module",
  version: "1.0.0",
  description: "Module used by structural event tests",
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
  id = "structural.module",
  dependencies: ModuleManifest["dependencies"] = []
): ModuleDescriptor {
  return new KernelModuleDescriptor(
    { ...baseManifest, id, name: `Module ${id}`, dependencies },
    "resolved"
  );
}

function createStructuralPublisher() {
  const bus = new InMemoryEventBus({
    createEventId: () => `event-${bus.publishedEvents().length + 1}`
  });
  const publisher = new KernelStructuralEventPublisher(bus);

  return { bus, publisher };
}

describe("Kernel structural events", () => {
  it("emits kernel bootstrap and ready events with payload, metadata and context", async () => {
    const dependencies = createKernelDependencies();
    const kernel = new VeltryxKernel(dependencies);
    const context = createBootstrapContext();

    await kernel.bootstrap(context);
    await kernel.initialize(context);
    await kernel.ready(context);

    const events =
      dependencies.events instanceof InMemoryEventBus ? dependencies.events.publishedEvents() : [];

    expect(events.map((event) => event.eventName)).toEqual([
      KERNEL_STRUCTURAL_EVENTS.bootstrapStarted,
      KERNEL_STRUCTURAL_EVENTS.bootstrapCompleted,
      MODULE_SYSTEM_STRUCTURAL_EVENTS.discoveryStarted,
      MODULE_SYSTEM_STRUCTURAL_EVENTS.discoveryCompleted,
      KERNEL_STRUCTURAL_EVENTS.ready
    ]);
    expect(events[0]).toMatchObject({
      eventType: "kernel",
      metadata: { source: "kernel", correlationId: "kernel-bootstrap" },
      contextSnapshot: { requestId: "kernel-bootstrap", correlationId: "kernel-bootstrap" }
    });
    expect(events[1]?.payload).toMatchObject({
      environment: expect.any(String),
      servicesRegistered: 11
    });
    expect(events[4]?.payload).toMatchObject({
      readyAt: expect.any(String),
      bootTimestamp: expect.any(String)
    });
  });

  it("emits kernel.bootstrap.failed when bootstrap fails", async () => {
    const dependencies = createKernelDependencies();
    const kernel = new VeltryxKernel({
      ...dependencies,
      services: {
        register: async () => undefined,
        resolve: async () => undefined,
        has: () => false,
        list: () => {
          throw new Error("Service registry unavailable");
        }
      }
    });

    await expect(kernel.bootstrap(createBootstrapContext())).rejects.toThrow(
      "Service registry unavailable"
    );

    const events =
      dependencies.events instanceof InMemoryEventBus ? dependencies.events.publishedEvents() : [];
    expect(events.map((event) => event.eventName)).toEqual([
      KERNEL_STRUCTURAL_EVENTS.bootstrapStarted,
      KERNEL_STRUCTURAL_EVENTS.bootstrapFailed
    ]);
    expect(events[1]).toMatchObject({
      eventType: "kernel",
      metadata: { source: "kernel" },
      payload: { error: { name: "Error", message: "Service registry unavailable" } }
    });
  });

  it("does not let structural publisher failure break Kernel bootstrap", async () => {
    const dependencies = createKernelDependencies();
    const kernel = new VeltryxKernel({
      ...dependencies,
      structuralEvents: {
        publish: async () => {
          throw new Error("subscriber failed");
        }
      }
    });

    await expect(kernel.bootstrap(createBootstrapContext())).resolves.toBeUndefined();
    expect(kernel.state()).toBe("bootstrapped");
  });
});

describe("Module discovery structural events", () => {
  it("emits module.discovery.started and module.discovery.completed", () => {
    const { bus, publisher } = createStructuralPublisher();
    const discovery = new KernelModuleDiscovery(undefined, undefined, publisher);

    const result = discovery.discover([baseManifest, { broken: true }]);

    expect(result.valid).toHaveLength(1);
    expect(result.invalid).toHaveLength(1);
    expect(bus.publishedEvents().map((event) => event.eventName)).toEqual([
      MODULE_SYSTEM_STRUCTURAL_EVENTS.discoveryStarted,
      MODULE_SYSTEM_STRUCTURAL_EVENTS.discoveryCompleted
    ]);
    expect(bus.publishedEvents()[1]).toMatchObject({
      eventType: "module",
      metadata: { source: "module-system" },
      payload: { candidatesCount: 2, validModules: 1, invalidModules: 1, duplicatedModules: 0 }
    });
  });

  it("emits module.discovery.failed without changing the thrown error", () => {
    const { bus, publisher } = createStructuralPublisher();
    const validator: IModuleDiscoveryValidator = {
      validate: () => {
        throw new Error("Discovery failed");
      }
    };
    const discovery = new KernelModuleDiscovery(undefined, validator, publisher);

    expect(() => discovery.discover([baseManifest])).toThrow("Discovery failed");
    expect(bus.publishedEvents().map((event) => event.eventName)).toEqual([
      MODULE_SYSTEM_STRUCTURAL_EVENTS.discoveryStarted,
      MODULE_SYSTEM_STRUCTURAL_EVENTS.discoveryFailed
    ]);
  });
});

describe("Module resolution structural events", () => {
  it("emits module.resolution.started and module.resolution.completed", () => {
    const { bus, publisher } = createStructuralPublisher();
    const resolver = new KernelModuleDependencyResolver(undefined, undefined, publisher);

    const result = resolver.resolve([
      descriptor("module.a"),
      descriptor("module.b", [{ id: "module.a" }])
    ]);

    expect(result.valid).toBe(true);
    expect(bus.publishedEvents().map((event) => event.eventName)).toEqual([
      MODULE_SYSTEM_STRUCTURAL_EVENTS.resolutionStarted,
      MODULE_SYSTEM_STRUCTURAL_EVENTS.resolutionCompleted
    ]);
    expect(bus.publishedEvents()[1]).toMatchObject({
      payload: { modulesCount: 2, resolvedModules: 2, missingDependencies: 0, cyclesDetected: 0 },
      metadata: { source: "module-system" },
      eventType: "module"
    });
  });

  it("emits module.resolution.failed when resolver dependency fails", () => {
    const { bus, publisher } = createStructuralPublisher();
    const resolver = new KernelModuleDependencyResolver(
      {
        detect: () => {
          throw new Error("Cycle detector failed");
        }
      },
      undefined,
      publisher
    );

    expect(() => resolver.resolve([descriptor("module.a")])).toThrow("Cycle detector failed");
    expect(bus.publishedEvents().map((event) => event.eventName)).toEqual([
      MODULE_SYSTEM_STRUCTURAL_EVENTS.resolutionStarted,
      MODULE_SYSTEM_STRUCTURAL_EVENTS.resolutionFailed
    ]);
  });
});

describe("Module loading structural events", () => {
  it("emits module.loading.started and module.loading.completed", () => {
    const { bus, publisher } = createStructuralPublisher();
    const loader = new KernelResolvedModuleLoader(
      undefined,
      undefined,
      () => new Date("2026-08-18T12:00:00.000Z"),
      publisher
    );
    const resolution = validResolution([descriptor("module.a")]);

    const result = loader.load(resolution);

    expect(result.totalLoaded).toBe(1);
    expect(bus.publishedEvents().map((event) => event.eventName)).toEqual([
      MODULE_SYSTEM_STRUCTURAL_EVENTS.loadingStarted,
      MODULE_SYSTEM_STRUCTURAL_EVENTS.loadingCompleted
    ]);
    expect(bus.publishedEvents()[1]).toMatchObject({
      payload: { modulesCount: 1, loadedModules: 1, rejectedModules: 0 },
      metadata: { source: "module-system" },
      eventType: "module"
    });
  });

  it("emits module.loading.failed when loader dependency fails", () => {
    const { bus, publisher } = createStructuralPublisher();
    const loader = new KernelResolvedModuleLoader(
      {
        register: () => undefined,
        remove: () => false,
        find: () => undefined,
        list: () => [],
        has: () => {
          throw new Error("Registry failed");
        }
      },
      undefined,
      undefined,
      publisher
    );

    expect(() => loader.load(validResolution([descriptor("module.a")]))).toThrow("Registry failed");
    expect(bus.publishedEvents().map((event) => event.eventName)).toEqual([
      MODULE_SYSTEM_STRUCTURAL_EVENTS.loadingStarted,
      MODULE_SYSTEM_STRUCTURAL_EVENTS.loadingFailed
    ]);
  });

  it("keeps loading result valid when a structural event handler fails", async () => {
    const { bus, publisher } = createStructuralPublisher();
    await bus.subscribe(MODULE_SYSTEM_STRUCTURAL_EVENTS.loadingCompleted, () => {
      throw new Error("Handler failed");
    });
    const loader = new KernelResolvedModuleLoader(undefined, undefined, undefined, publisher);

    const result = loader.load(validResolution([descriptor("module.a")]));

    expect(result.valid).toBe(true);
    expect(result.totalLoaded).toBe(1);
    expect(bus.publishedEvents().map((event) => event.eventName)).toContain(
      MODULE_SYSTEM_STRUCTURAL_EVENTS.loadingCompleted
    );
  });
});

describe("Structural event contracts", () => {
  it("exports the official structural event catalog", () => {
    expect(STRUCTURAL_EVENT_NAMES).toEqual([
      "kernel.bootstrap.started",
      "kernel.bootstrap.completed",
      "kernel.bootstrap.failed",
      "kernel.ready",
      "module.discovery.started",
      "module.discovery.completed",
      "module.discovery.failed",
      "module.resolution.started",
      "module.resolution.completed",
      "module.resolution.failed",
      "module.loading.started",
      "module.loading.completed",
      "module.loading.failed"
    ]);
  });
});

function validResolution(order: readonly ModuleDescriptor[]): ModuleDependencyResolutionResult {
  return {
    valid: true,
    order,
    resolved: order,
    missing: [],
    conflicts: [],
    cycles: [],
    errors: [],
    warnings: [],
    report: {
      analyzed: order.length,
      resolved: order.length,
      order: order.map((module) => module.manifest.id),
      missing: 0,
      conflicts: 0,
      cycles: 0,
      errors: [],
      warnings: []
    }
  };
}


