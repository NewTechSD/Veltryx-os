import { describe, expect, it } from "vitest";

import { createExecutionContext } from "../src/execution-context.js";
import {
  InMemoryConfigurationProvider,
  InMemoryEventBus,
  InMemoryMetadataRegistry,
  KernelRuntime,
  KernelServiceRegistry
} from "../src/index.js";

describe("Kernel core service coverage", () => {
  it("resolves configured values by key", async () => {
    const provider = new InMemoryConfigurationProvider();

    provider.set("kernel.mode", "test");

    await expect(provider.get<string>({ key: "kernel.mode" })).resolves.toBe("test");
    await expect(provider.get<string>({ key: "missing" })).resolves.toBeUndefined();
  });

  it("registers, lists, publishes and stores events", async () => {
    const bus = new InMemoryEventBus();
    const received: unknown[] = [];

    await bus.register({ name: "kernel.ready", version: "1.0.0", owner: "kernel" });
    await expect(
      bus.register({ name: "kernel.ready", version: "1.0.0", owner: "kernel" })
    ).rejects.toThrow("Event already registered: kernel.ready:1.0.0");

    await bus.subscribe("kernel.ready", (event) => {
      received.push(event.payload);
    });

    await bus.publish({
      name: "kernel.ready",
      version: "1.0.0",
      payload: { ok: true },
      occurredAt: new Date(),
      context: createExecutionContext({ requestId: "req-1" })
    });

    await expect(bus.listEvents()).resolves.toHaveLength(1);
    expect(received).toEqual([{ ok: true }]);
    expect(bus.publishedEvents()).toHaveLength(1);
  });

  it("creates execution contexts with defaults and explicit correlation", () => {
    expect(createExecutionContext({ requestId: "req-1" })).toMatchObject({
      tenant: "system",
      locale: "en-US",
      timezone: "UTC",
      requestId: "req-1",
      correlationId: "req-1"
    });

    expect(
      createExecutionContext({
        tenant: "tenant-1",
        workspace: "workspace-1",
        user: "user-1",
        roles: ["admin"],
        permissions: ["kernel.read"],
        locale: "pt-BR",
        timezone: "America/Sao_Paulo",
        requestId: "req-2",
        correlationId: "corr-2"
      })
    ).toMatchObject({
      tenant: "tenant-1",
      workspace: "workspace-1",
      user: "user-1",
      roles: ["admin"],
      permissions: ["kernel.read"],
      locale: "pt-BR",
      timezone: "America/Sao_Paulo",
      requestId: "req-2",
      correlationId: "corr-2"
    });
  });

  it("rejects duplicate metadata and lists versions", async () => {
    const registry = new InMemoryMetadataRegistry();
    const record = {
      namespace: "kernel",
      key: "manifest",
      version: "1.0.0",
      owner: "kernel",
      status: "registered" as const,
      metadata: { enabled: true }
    };

    await registry.register(record);
    await registry.register({ ...record, version: "1.1.0" });

    await expect(registry.register(record)).rejects.toThrow(
      "Metadata already registered: kernel:manifest:1.0.0"
    );
    await expect(
      registry.get({ namespace: "kernel", key: "manifest", version: "1.1.0" })
    ).resolves.toMatchObject({ version: "1.1.0" });
    await expect(registry.listVersions("kernel", "manifest")).resolves.toEqual(["1.0.0", "1.1.0"]);
  });

  it("validates runtime bootstrap context and exposes session state", async () => {
    const runtime = new KernelRuntime();
    const context = createExecutionContext({ requestId: "req-1", correlationId: "corr-1" });

    expect(runtime.status()).toBe("idle");

    await expect(runtime.bootstrap({ ...context, requestId: "" })).rejects.toThrow(
      "Runtime bootstrap requires requestId and correlationId"
    );

    await expect(runtime.bootstrap(context)).resolves.toMatchObject({
      state: "ready",
      message: "Runtime Ready"
    });
    expect(runtime.state()).toBe("ready");
    expect(runtime.session()).toMatchObject({ id: "corr-1", state: "ready", context });
  });

  it("rejects missing services and handles global singleton reuse", async () => {
    const registry = new KernelServiceRegistry();
    const token = {
      id: "kernel.singleton",
      version: "1.0.0",
      owner: "kernel",
      scope: "global" as const
    };

    await expect(registry.resolve(token)).rejects.toThrow(
      "Service not registered: kernel.singleton"
    );

    let calls = 0;
    await registry.register({ token, resolve: () => ({ calls: ++calls }) });

    await expect(registry.register({ token, resolve: () => ({}) })).rejects.toThrow(
      "Service already registered: kernel.singleton"
    );
    await expect(registry.resolve(token)).resolves.toEqual({ calls: 1 });
    await expect(registry.resolve(token)).resolves.toEqual({ calls: 1 });
    expect(registry.list()).toEqual([token]);
  });

  it("resolves transient services without singleton reuse", async () => {
    const registry = new KernelServiceRegistry();
    const token = {
      id: "kernel.transient",
      version: "1.0.0",
      owner: "kernel",
      scope: "transient" as const
    };
    let calls = 0;

    await registry.register({ token, resolve: () => ({ calls: ++calls }) });

    await expect(registry.resolve(token)).resolves.toEqual({ calls: 1 });
    await expect(registry.resolve(token)).resolves.toEqual({ calls: 2 });
  });
});
