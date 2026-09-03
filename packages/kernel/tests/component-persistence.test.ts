import { describe, expect, it } from "vitest";
import type { ComponentDefinition, PersistenceRecordData } from "@veltryx/contracts";
import {
  ComponentPersistenceService, ComponentRegistry, InMemoryPersistenceProvider,
  PersistenceService, UICompositionRuntime, VeltryxKernel, createBootstrapContext,
  registerSystemComponents
} from "../src/index.js";

const card: ComponentDefinition = {
  key: "system.card", name: "Card", label: "Card", description: "Declarative card",
  type: "display", category: "card", version: "1.0.0",
  propsSchema: [{ name: "title", type: "string" }],
  capabilities: ["canRenderChildren"]
};

function setup(registry = new ComponentRegistry()) {
  const persistence = new PersistenceService(new InMemoryPersistenceProvider());
  return { registry, persistence, service: new ComponentPersistenceService(registry, persistence) };
}

describe("Component Persistence Service", () => {
  it("starts ready and persists, loads and lists a declaration", async () => {
    const { service, persistence } = setup();
    expect(service.snapshot()).toMatchObject({ status: "ready", componentsPersisted: 0, componentsHydrated: 0 });
    expect((await service.persistComponent({ component: card })).ok).toBe(true);
    expect((await service.loadComponent({ key: "system.card", version: "1.0.0" })).data).toEqual(card);
    expect((await service.loadComponent({ key: "system.missing" })).data).toBeNull();
    expect((await service.listComponents()).data).toEqual([card]);
    expect(persistence.snapshot()).toMatchObject({ namespaces: 1, collections: 1, records: 1 });
  });

  it("persists all registered system components through the public registry", async () => {
    const registry = new ComponentRegistry(); registerSystemComponents(registry);
    const { service } = setup(registry);
    const result = await service.persistAllComponents({ keys: ["system.page", "system.card", "system.text"] });
    expect(result.data).toMatchObject({ componentsPersisted: 3 });
    expect((await service.listComponents()).data?.map((item) => item.key).sort()).toEqual(["system.card", "system.page", "system.text"]);
  });

  it("hydrates an empty registry and makes the declaration usable by UI Composition", async () => {
    const source = setup(); await source.service.persistComponent({ component: card });
    const targetRegistry = new ComponentRegistry();
    const target = new ComponentPersistenceService(targetRegistry, source.persistence);
    expect((await target.hydrateRegistry()).data).toMatchObject({ componentsHydrated: 1, conflicts: 0, invalidEntries: 0 });
    expect(targetRegistry.resolve("system.card", "1.0.0")).toMatchObject({ found: true, component: card });
    const tree = new UICompositionRuntime(targetRegistry).compose({ sourceType: "custom", sourceId: "persisted-card", metadata: { root: { id: "card", componentKey: "system.card", props: { title: "Hydrated" } } } });
    expect(tree).toMatchObject({ root: { componentKey: "system.card" }, errors: [] });
  });

  it("preserves the operational registry on deterministic conflicts", async () => {
    const source = setup(); await source.service.persistComponent({ component: card });
    const registry = new ComponentRegistry(); registry.register({ ...card, label: "Operational Card" });
    const target = new ComponentPersistenceService(registry, source.persistence);
    const result = await target.hydrateRegistry();
    expect(result.data).toMatchObject({ componentsHydrated: 0, conflicts: 1 });
    expect(result.warnings[0]?.code).toBe("component.persistence.conflict");
    expect(registry.resolve("system.card", "1.0.0").component?.label).toBe("Operational Card");
  });

  it("ignores invalid persisted records with a safe warning", async () => {
    const { registry, persistence } = setup();
    await persistence.repository<PersistenceRecordData>({ namespace: "components", collection: "component.definitions" }).create({ namespace: "components", collection: "component.definitions", id: "invalid", data: { kind: "component-definition", entry: { key: "bad", version: "x", definition: { key: "bad" }, source: "persistence", persistedAt: "2026-09-02T00:00:00.000Z" } } });
    const service = new ComponentPersistenceService(registry, persistence);
    const result = await service.hydrateRegistry();
    expect(result.data).toMatchObject({ invalidEntries: 1, componentsHydrated: 0 });
    expect(result.warnings[0]?.code).toBe("component.persistence.invalidEntry");
  });

  it("rejects invalid component definitions", async () => {
    const { service } = setup();
    expect((await service.persistComponent({ component: { ...card, key: "invalid" } })).errors[0]?.code).toBe("component.persistence.invalidDefinition");
  });

  it.each([
    "renderer", "render", "component", "factory", "implementation", "implementationPath",
    "componentFile", "tsxPath", "jsxPath", "reactComponent", "nextComponent",
    "componentFactory", "renderFunction", "phpTemplate", "shortcode", "blockJson", "template"
  ])("rejects forbidden declaration field %s", async (field) => {
    const { service } = setup();
    const result = await service.persistComponent({ component: { ...card, [field]: "unsafe" } as ComponentDefinition });
    expect(result.errors[0]?.code).toBe("component.persistence.invalidDefinition");
  });

  it.each([
    ["function", () => "unsafe"], ["undefined", undefined], ["symbol", Symbol("unsafe")],
    ["bigint", 1n], ["Date", new Date()], ["Map", new Map()], ["Set", new Set()],
    ["Promise", Promise.resolve()], ["Error", new Error("unsafe")], ["RegExp", /unsafe/],
    ["class", new (class Unsafe {})()], ["React-like", { $$typeof: Symbol.for("react.element") }],
    ["DOM-like", { nodeType: 1, ownerDocument: {} }]
  ])("rejects non-serializable %s declarations", async (_name, value) => {
    const { service } = setup();
    const result = await service.persistComponent({ component: { ...card, unsafe: value } as ComponentDefinition });
    expect(result.errors[0]?.code).toBe("component.persistence.invalidDefinition");
  });

  it("rejects circular declarations", async () => {
    const circular: Record<string, unknown> = {}; circular.self = circular;
    const { service } = setup();
    expect((await service.persistComponent({ component: { ...card, unsafe: circular } as ComponentDefinition })).ok).toBe(false);
  });

  it("publishes an immutable aggregate-only snapshot", async () => {
    const { service } = setup(); await service.persistComponent({ component: card });
    const snapshot = service.snapshot(); const json = JSON.stringify(snapshot);
    expect(snapshot).toMatchObject({ provider: { id: "kernel.persistence.memory", kind: "memory" }, componentsPersisted: 1 });
    expect(Object.isFrozen(snapshot)).toBe(true); expect(Object.isFrozen(snapshot.provider)).toBe(true);
    for (const forbidden of ["system.card", "Declarative card", "records", "stack", "implementationPath", "renderer", "factory", "connectionString", "secret"]) expect(json).not.toContain(forbidden);
  });
});

describe("Component Persistence Kernel integration", () => {
  it("exposes one singleton through Kernel, DI, Registry, Runtime and Status", async () => {
    const kernel = new VeltryxKernel(); const context = createBootstrapContext();
    expect(kernel.services().has("kernel.componentPersistence")).toBe(true);
    expect(kernel.container().has("kernel.componentPersistence")).toBe(true);
    expect(await kernel.container().resolve("kernel.componentPersistence")).toBe(kernel.componentPersistence());
    await kernel.componentPersistence().persistComponent({ component: card });
    await kernel.bootstrap(context); await kernel.initialize(context); await kernel.ready(context);
    expect(kernel.runtime().snapshot()?.componentPersistence).toMatchObject({ providerId: "kernel.persistence.memory", componentsPersisted: 1 });
    expect((await kernel.status().snapshot()).componentPersistence).toMatchObject({ providerId: "kernel.persistence.memory", componentsPersisted: 1 });
    expect(kernel.metadataPersistence()).toBeDefined(); expect(kernel.configurationPersistence()).toBeDefined();
  });
});
