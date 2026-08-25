import { describe, expect, it } from "vitest";

import {
  InMemoryMetadataRegistry,
  KernelModuleLoader,
  KernelServiceRegistry
} from "../src/index.js";

describe("Kernel registries", () => {
  it("registers and resolves services by token", async () => {
    const registry = new KernelServiceRegistry();
    const token = {
      id: "kernel.test-service",
      version: "1.0.0",
      owner: "kernel",
      scope: "global" as const
    };

    await registry.register({
      token,
      resolve: () => ({ ok: true })
    });

    await expect(registry.resolve(token)).resolves.toEqual({ ok: true });
    expect(registry.has(token.id)).toBe(true);
  });

  it("registers metadata by namespace", async () => {
    const registry = new InMemoryMetadataRegistry();

    await registry.register({
      namespace: "kernel",
      key: "health",
      version: "1.0.0",
      owner: "kernel",
      status: "registered",
      metadata: { enabled: true }
    });

    await expect(registry.get({ namespace: "kernel", key: "health" })).resolves.toMatchObject({
      namespace: "kernel",
      key: "health"
    });
    await expect(registry.list("kernel")).resolves.toHaveLength(1);
  });

  it("registers module manifests without loading real modules", async () => {
    const loader = new KernelModuleLoader();

    const descriptor = await loader.register({
      id: "kernel.stub",
      name: "Kernel Stub",
      version: "1.0.0",
      dependencies: [],
      compatibility: {
        kernel: "^1.0.0"
      },
      permissions: [],
      routes: [],
      metadata: [],
      events: [],
      providers: [],
      components: [],
      migrations: [],
      seeds: []
    });

    expect(descriptor.state).toBe("discovered");
    await expect(loader.transition("kernel.stub", "validated")).resolves.toMatchObject({
      state: "validated"
    });
  });
});
