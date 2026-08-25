import { describe, expect, it } from "vitest";
import { CircularDependencyError } from "@veltryx/contracts";
import { DependencyInjectionContainer, KernelServiceRegistry } from "../src/index.js";

describe("DependencyInjectionContainer", () => {
  it("registers value, factory and class providers with singleton/transient lifecycle", async () => {
    class Example {
      constructor(readonly value: string) {}
    }
    const container = new DependencyInjectionContainer();
    container.registerProvider({
      token: "test.value",
      kind: "value",
      lifecycle: "singleton",
      useValue: "value"
    });
    container.registerProvider({
      token: "test.factory",
      kind: "factory",
      lifecycle: "transient",
      dependencies: ["test.value"],
      useFactory: (value) => ({ value })
    });
    container.registerProvider({
      token: "test.class",
      kind: "class",
      lifecycle: "singleton",
      dependencies: ["test.value"],
      useClass: Example
    });

    expect(container.has("test.value")).toBe(true);
    expect(await container.resolve("test.value")).toBe("value");
    expect(await container.resolve("test.factory")).not.toBe(
      await container.resolve("test.factory")
    );
    expect(await container.resolve("test.class")).toBe(await container.resolve("test.class"));
    expect(container.listProviders()).toHaveLength(3);
  });

  it("protects duplicates and permits explicit replacement", async () => {
    const container = new DependencyInjectionContainer();
    container.registerProvider({
      token: "test.value",
      kind: "value",
      lifecycle: "singleton",
      useValue: 1
    });
    expect(() =>
      container.registerProvider({
        token: "test.value",
        kind: "value",
        lifecycle: "singleton",
        useValue: 2
      })
    ).toThrow("already registered");
    container.registerProvider(
      { token: "test.value", kind: "value", lifecycle: "singleton", useValue: 2 },
      { replace: true }
    );
    expect(await container.resolve("test.value")).toBe(2);
    expect(container.snapshot().providersWithWarnings).toBe(1);
  });

  it("reports missing and circular dependencies without exposing implementation", async () => {
    const container = new DependencyInjectionContainer();
    container.registerProvider({
      token: "test.a",
      kind: "factory",
      lifecycle: "singleton",
      dependencies: ["test.b"],
      useFactory: () => ({})
    });
    await expect(container.resolve("test.a")).rejects.toThrow("not registered");
    container.registerProvider({
      token: "test.b",
      kind: "factory",
      lifecycle: "singleton",
      dependencies: ["test.c"],
      useFactory: () => ({})
    });
    container.registerProvider({
      token: "test.c",
      kind: "factory",
      lifecycle: "singleton",
      dependencies: ["test.a"],
      useFactory: () => ({})
    });
    await expect(container.resolve("test.a")).rejects.toBeInstanceOf(CircularDependencyError);
    const serialized = JSON.stringify(container.snapshot());
    expect(serialized).not.toContain("useFactory");
    expect(serialized).not.toContain("stack");
  });

  it("normalizes factory failures and registers resolved services only when absent", async () => {
    const registry = new KernelServiceRegistry();
    const container = new DependencyInjectionContainer(registry);
    container.registerProvider({
      token: "test.service",
      kind: "factory",
      lifecycle: "singleton",
      useFactory: () => ({ ready: true }),
      descriptor: {
        name: "Test",
        category: "system",
        lifecycle: "available",
        scope: "singleton",
        status: "ok",
        tags: []
      }
    });
    await container.resolve("test.service");
    expect(registry.has("test.service")).toBe(true);
    container.registerProvider({
      token: "test.failure",
      kind: "factory",
      lifecycle: "transient",
      useFactory: () => {
        throw new Error("private detail");
      }
    });
    await expect(container.resolve("test.failure")).rejects.toThrow("private detail");
    expect(container.snapshot().errors).toContainEqual(
      expect.objectContaining({ code: "PROVIDER_RESOLUTION_FAILED" })
    );
  });

  it("creates an immutable empty snapshot and rejects invalid providers", () => {
    const container = new DependencyInjectionContainer(
      undefined,
      () => new Date("2026-08-25T12:00:00Z")
    );
    const snapshot = container.snapshot();
    expect(snapshot).toMatchObject({
      status: "empty",
      providersRegistered: 0,
      generatedAt: "2026-08-25T12:00:00.000Z"
    });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(() =>
      container.registerProvider({ token: "test.bad", kind: "factory", lifecycle: "singleton" })
    ).toThrow("useFactory");
  });
});
