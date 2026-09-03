import { describe, expect, it } from "vitest";
import type { CompositionTree, MetadataPage } from "@veltryx/contracts";
import {
  ComponentRegistry, InMemoryMetadataRegistry, InMemoryPersistenceProvider,
  PersistenceService, UICompositionPersistenceService, UICompositionRuntime,
  VeltryxKernel, createBootstrapContext, registerSystemComponents
} from "../src/index.js";

const page: MetadataPage = { id: "admin-overview", namespace: "system", title: "Runtime Overview", sections: [{ id: "main", type: "section", title: "Main" }] };

function setup() {
  const components = new ComponentRegistry(); registerSystemComponents(components);
  const metadata = new InMemoryMetadataRegistry();
  metadata.registerNamespace({ id: "system", name: "System" });
  metadata.registerPage(page);
  const runtime = new UICompositionRuntime(components);
  const persistence = new PersistenceService(new InMemoryPersistenceProvider());
  const service = new UICompositionPersistenceService(runtime, metadata, persistence, undefined, () => new Date("2026-09-02T21:30:00.000Z"));
  const tree = runtime.compose({ sourceType: "page", sourceId: page.id, namespace: page.namespace, metadata: page, runtimeContext: {} as never });
  return { components, metadata, runtime, persistence, service, tree };
}

describe("UI Composition Persistence Service", () => {
  it("starts empty and persists, loads and lists safe snapshot summaries", async () => {
    const { service, tree } = setup();
    expect(service.snapshot()).toMatchObject({ status: "empty", snapshotsPersisted: 0 });
    const saved = await service.persistCompositionSnapshot({ tree, namespace: "system", sourceId: "admin-overview", purpose: "preview", snapshotId: "snapshot-one" });
    expect(saved.ok).toBe(true);
    expect((await service.loadCompositionSnapshot({ snapshotId: "snapshot-one" })).data).toEqual(tree);
    const listed = await service.listCompositionSnapshots();
    expect(listed.data).toHaveLength(1);
    expect(listed.data?.[0]).not.toHaveProperty("tree");
    expect(Object.isFrozen(listed.data)).toBe(true);
  });

  it("composes and persists explicitly without changing compose", async () => {
    const { runtime, persistence, service } = setup();
    runtime.compose({ sourceType: "page", sourceId: page.id, namespace: page.namespace, metadata: page, runtimeContext: {} as never });
    expect(persistence.snapshot().records).toBe(0);
    const result = await service.composeAndPersist({ composition: { sourceType: "page", sourceId: page.id, namespace: page.namespace, metadata: page, runtimeContext: {} as never }, purpose: "preview", snapshotId: "composed" });
    expect(result.ok).toBe(true);
    expect(persistence.snapshot()).toMatchObject({ namespaces: 1, collections: 2, records: 2 });
  });

  it("tracks and explicitly loads the newest snapshot for a source", async () => {
    const { service, tree } = setup();
    await service.persistCompositionSnapshot({ tree, namespace: "system", sourceId: page.id, purpose: "preview", snapshotId: "first" });
    await service.persistCompositionSnapshot({ tree: { ...tree, id: "newer" }, namespace: "system", sourceId: page.id, purpose: "diagnostic", snapshotId: "second" });
    expect((await service.loadLatestCompositionSnapshot({ sourceType: "page", namespace: "system", sourceId: page.id })).data?.id).toBe("newer");
    expect(service.snapshot()).toMatchObject({ snapshotsPersisted: 2, latestSnapshotsTracked: 1, snapshotsLoaded: 1 });
  });

  it("returns null for missing snapshot/latest and deletes specific snapshots", async () => {
    const { service, tree } = setup();
    expect((await service.loadCompositionSnapshot({ snapshotId: "missing" })).data).toBeNull();
    expect((await service.loadLatestCompositionSnapshot({ sourceType: "page", namespace: "system", sourceId: page.id })).data).toBeNull();
    await service.persistCompositionSnapshot({ tree, namespace: "system", sourceId: page.id, purpose: "test", snapshotId: "delete-me" });
    expect((await service.deleteCompositionSnapshot({ snapshotId: "delete-me" })).data).toBe(true);
    expect((await service.deleteCompositionSnapshot({ snapshotId: "delete-me" })).data).toBe(false);
  });

  it("validates missing components including children, slots and versions", async () => {
    const { service, tree } = setup();
    for (const root of [
      { ...tree.root, componentKey: "missing.component" },
      { ...tree.root, children: [{ id: "bad", componentKey: "missing.child" }] },
      { ...tree.root, slots: { content: [{ id: "bad", componentKey: "missing.slot" }] } },
      { ...tree.root, componentVersion: "99.0.0" }
    ]) expect((await service.persistCompositionSnapshot({ tree: { ...tree, root }, namespace: "system", sourceId: page.id, purpose: "test" })).ok).toBe(false);
  });

  it("validates metadata source presence and compatible type", async () => {
    const { service, tree } = setup();
    expect((await service.persistCompositionSnapshot({ tree, namespace: "system", sourceId: "missing", purpose: "test" })).ok).toBe(false);
    expect((await service.persistCompositionSnapshot({ tree: { ...tree, sourceType: "menu" }, namespace: "system", sourceId: page.id, purpose: "test" })).ok).toBe(false);
    expect((await service.persistCompositionSnapshot({ tree, namespace: "", sourceId: page.id, purpose: "test" })).ok).toBe(false);
  });

  it.each(["renderer", "render", "component", "factory", "implementation", "implementationPath", "componentFile", "tsxPath", "jsxPath", "reactComponent", "nextComponent", "componentFactory", "renderFunction", "dangerouslySetInnerHTML", "phpTemplate", "shortcode", "blockJson"])("rejects forbidden field %s", async (field) => {
    const { service, tree } = setup();
    const unsafe = { ...tree, root: { ...tree.root, props: { [field]: "unsafe" } } } as CompositionTree;
    expect((await service.persistCompositionSnapshot({ tree: unsafe, namespace: "system", sourceId: page.id, purpose: "test" })).ok).toBe(false);
  });

  it.each([["function", () => 1], ["undefined", undefined], ["symbol", Symbol("x")], ["bigint", 1n], ["Date", new Date()], ["Map", new Map()], ["Set", new Set()], ["Promise", Promise.resolve()], ["Error", new Error("x")], ["RegExp", /x/], ["class", new (class X {})()], ["React-like", { $$typeof: Symbol.for("react.element") }], ["DOM-like", { nodeType: 1, ownerDocument: {} }]])("rejects unsafe %s data", async (_name, value) => {
    const { service, tree } = setup();
    expect((await service.persistCompositionSnapshot({ tree: { ...tree, root: { ...tree.root, props: { value } } }, namespace: "system", sourceId: page.id, purpose: "test" })).ok).toBe(false);
  });

  it("rejects circular data and exposes an immutable aggregate-only snapshot", async () => {
    const { service, tree } = setup(); const circular: Record<string, unknown> = {}; circular.self = circular;
    expect((await service.persistCompositionSnapshot({ tree: { ...tree, root: { ...tree.root, props: circular } }, namespace: "system", sourceId: page.id, purpose: "test" })).ok).toBe(false);
    const snapshot = service.snapshot(); const serialized = JSON.stringify(snapshot);
    expect(Object.isFrozen(snapshot)).toBe(true); expect(serialized).not.toContain("root"); expect(serialized).not.toContain("records"); expect(serialized).not.toContain("stack");
  });

  it("integrates with Kernel API, Service Registry, DI, Runtime and Status", async () => {
    const kernel = new VeltryxKernel();
    expect(kernel.uiCompositionPersistence()).toBeDefined();
    expect(kernel.services().get("kernel.uiCompositionPersistence")).toBeDefined();
    expect(kernel.container().has("kernel.uiCompositionPersistence")).toBe(true);
    expect(kernel.componentPersistence()).toBeDefined(); expect(kernel.metadataPersistence()).toBeDefined(); expect(kernel.configurationPersistence()).toBeDefined();
    const context = createBootstrapContext(); await kernel.bootstrap(context); await kernel.initialize(context); await kernel.ready(context);
    expect(kernel.runtime().snapshot()?.uiCompositionPersistence).toMatchObject({ status: "empty", snapshotsPersisted: 0 });
    expect((await kernel.status().snapshot()).uiCompositionPersistence).toMatchObject({ status: "empty", snapshotsPersisted: 0 });
  });
});
