import { describe, expect, it } from "vitest";
import type { MetadataResource, PersistenceRecordData } from "@veltryx/contracts";
import {
  InMemoryMetadataRegistry,
  InMemoryPersistenceProvider,
  MetadataPersistenceService,
  PersistenceService,
  VeltryxKernel,
  createBootstrapContext
} from "../src/index.js";

const namespace = { id: "system", name: "System", description: "Structural metadata" };
const page: MetadataResource = {
  id: "admin-overview",
  namespace: "system",
  type: "page",
  label: "Runtime Dynamic Overview",
  definition: { title: "Runtime Dynamic Overview", route: "/runtime/page/system/admin-overview" }
};

function setup() {
  const registry = new InMemoryMetadataRegistry();
  const persistence = new PersistenceService(new InMemoryPersistenceProvider());
  return { registry, persistence, service: new MetadataPersistenceService(registry, persistence) };
}

describe("Metadata Persistence Service", () => {
  it("persists namespaces and resources through IPersistenceService", async () => {
    const { service, persistence } = setup();
    expect(service.snapshot()).toMatchObject({ status: "ready", namespacesPersisted: 0, resourcesPersisted: 0 });
    expect((await service.persistNamespace({ namespace })).ok).toBe(true);
    expect((await service.persistResource({ resource: page })).ok).toBe(true);
    expect((await service.loadResource({ namespace: "system", id: "admin-overview" })).data).toMatchObject(page);
    expect((await service.loadResource({ namespace: "system", id: "missing" })).data).toBeNull();
    expect((await service.listResources({ namespace: "system" })).data).toEqual([page]);
    expect(persistence.snapshot()).toMatchObject({ namespaces: 1, collections: 2, records: 2 });
  });

  it("hydrates an empty registry and preserves existing resources on conflict", async () => {
    const source = setup();
    await source.service.persistNamespace({ namespace });
    await source.service.persistResource({ resource: page });
    const targetRegistry = new InMemoryMetadataRegistry();
    const target = new MetadataPersistenceService(targetRegistry, source.persistence);
    const first = await target.hydrateRegistry();
    expect(first.data).toMatchObject({ namespacesHydrated: 1, resourcesHydrated: 1, conflicts: 0 });
    expect(targetRegistry.resolve("system", "admin-overview")).toMatchObject({ found: true, resource: page });
    const second = await target.hydrateRegistry();
    expect(second.data).toMatchObject({ namespacesHydrated: 0, resourcesHydrated: 0, conflicts: 2 });
    expect(second.warnings.some((warning) => warning.code === "metadataPersistence.conflict")).toBe(true);
    expect(target.snapshot()).toMatchObject({ status: "warning", hydratedResources: 1 });
  });

  it("ignores invalid persisted records with a safe warning", async () => {
    const { registry, persistence } = setup();
    const repository = persistence.repository<PersistenceRecordData>({ namespace: "metadata", collection: "metadata.resources" });
    await repository.create({ namespace: "metadata", collection: "metadata.resources", id: "invalid", data: { kind: "resource", resource: { id: "", namespace: "system", type: "page" } } });
    const service = new MetadataPersistenceService(registry, persistence);
    const result = await service.hydrateRegistry();
    expect(result).toMatchObject({ ok: true, data: { invalidRecords: 1, resourcesHydrated: 0 } });
    expect(service.snapshot().warnings).toEqual(expect.arrayContaining([expect.objectContaining({ code: "metadataPersistence.invalidRecord" })]));
  });

  it.each([
    ["function", () => "unsafe"],
    ["undefined", undefined],
    ["symbol", Symbol("unsafe")],
    ["bigint", 1n],
    ["Date", new Date()],
    ["Map", new Map()],
    ["Set", new Set()],
    ["Promise", Promise.resolve()],
    ["Error", new Error("unsafe")],
    ["RegExp", /unsafe/],
    ["class", new (class Unsafe {})()],
    ["React-like", { $$typeof: Symbol.for("react.element") }],
    ["DOM-like", { nodeType: 1, ownerDocument: {} }]
  ])("rejects non-serializable %s metadata", async (_name, unsafe) => {
    const { service } = setup();
    const result = await service.persistResource({ resource: { ...page, definition: { unsafe } } });
    expect(result).toMatchObject({ ok: false, errors: [expect.objectContaining({ code: "metadataPersistence.invalidResource" })] });
    expect(JSON.stringify(result)).not.toContain("stack");
  });

  it("rejects circular metadata", async () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const { service } = setup();
    expect((await service.persistResource({ resource: { ...page, definition: circular } })).ok).toBe(false);
  });

  it("exposes an immutable aggregate-only snapshot", async () => {
    const { service } = setup();
    await service.persistResource({ resource: page });
    const snapshot = service.snapshot();
    const serialized = JSON.stringify(snapshot);
    expect(snapshot).toMatchObject({ provider: { id: "kernel.persistence.memory", kind: "memory" }, resourcesPersisted: 1 });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.provider)).toBe(true);
    for (const forbidden of ["admin-overview", "records", "Map", "stack", "connectionString", "secret"]) expect(serialized).not.toContain(forbidden);
  });
});

describe("Metadata Persistence Kernel integration", () => {
  it("exposes one singleton through Kernel, DI, registry, Runtime and Status", async () => {
    const kernel = new VeltryxKernel();
    const context = createBootstrapContext();
    expect(kernel.services().has("kernel.metadataPersistence")).toBe(true);
    expect(kernel.container().has("kernel.metadataPersistence")).toBe(true);
    expect(await kernel.container().resolve("kernel.metadataPersistence")).toBe(kernel.metadataPersistence());
    await kernel.metadataPersistence().persistResource({ resource: page });
    await kernel.bootstrap(context);
    await kernel.initialize(context);
    await kernel.ready(context);
    expect(kernel.runtime().snapshot()?.metadataPersistence).toMatchObject({ providerId: "kernel.persistence.memory", resourcesPersisted: 1 });
    expect((await kernel.status().snapshot()).metadataPersistence).toMatchObject({ providerId: "kernel.persistence.memory", resourcesPersisted: 1 });
    expect(kernel.metadata().snapshot).toBeTypeOf("function");
  });
});
