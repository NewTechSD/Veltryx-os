import { describe, expect, it } from "vitest";
import type { PersistenceRecordData } from "@veltryx/contracts";
import { InMemoryPersistenceProvider, PersistenceService, VeltryxKernel, createBootstrapContext } from "../src/index.js";

const scope = { namespace: "system", collection: "settings" };
const key = { ...scope, id: "general" };

describe("In-memory Persistence Provider", () => {
  it("starts ready and rejects invalid repository scopes", () => {
    const provider = new InMemoryPersistenceProvider();
    expect(provider.snapshot()).toMatchObject({ status: "ready", provider: { id: "kernel.persistence.memory", kind: "memory" }, namespaces: 0, collections: 0, records: 0 });
    expect(() => provider.repository({ namespace: "", collection: "settings" })).toThrow("namespace");
    expect(() => provider.repository({ namespace: "system", collection: "" })).toThrow("collection");
    expect(() => provider.repository({ namespace: "../system", collection: "settings" })).toThrow();
  });

  it("supports create/get/update/delete/list/exists/count with versioning and pagination", async () => {
    const times = ["2026-09-02T10:00:00.000Z", "2026-09-02T10:00:01.000Z", "2026-09-02T10:00:02.000Z", "2026-09-02T10:00:03.000Z", "2026-09-02T10:00:04.000Z", "2026-09-02T10:00:05.000Z", "2026-09-02T10:00:06.000Z", "2026-09-02T10:00:07.000Z", "2026-09-02T10:00:08.000Z", "2026-09-02T10:00:09.000Z", "2026-09-02T10:00:10.000Z", "2026-09-02T10:00:11.000Z"];
    let index = 0; const provider = new InMemoryPersistenceProvider({ now: () => new Date(times[Math.min(index++, times.length - 1)]!) });
    const repository = provider.repository(scope);
    const created = await repository.create({ ...key, data: { enabled: true, nested: { label: "Initial" } }, metadata: { source: "test", tags: ["safe"] } });
    expect(created).toMatchObject({ ok: true, data: { version: 1, createdAt: "2026-09-02T10:00:00.000Z", updatedAt: "2026-09-02T10:00:00.000Z" } });
    expect((await repository.create({ ...key, data: { enabled: false } })).error?.code).toBe("persistence.duplicate");
    expect((await repository.get(key)).data).toMatchObject({ id: "general", version: 1 });
    expect((await repository.get({ ...scope, id: "missing" })).data).toBeNull();
    const updated = await repository.update({ ...key, data: { enabled: false } });
    expect(updated.data).toMatchObject({ version: 2, createdAt: created.data?.createdAt });
    expect(updated.data?.updatedAt).not.toBe(created.data?.updatedAt);
    expect((await repository.update({ ...scope, id: "missing", data: {} })).error?.code).toBe("persistence.notFound");
    await repository.create({ ...scope, id: "second", data: { enabled: true } });
    expect((await repository.exists(key)).data).toBe(true);
    expect((await repository.exists({ ...scope, id: "missing" })).data).toBe(false);
    expect((await repository.count(scope)).data).toBe(2);
    const listed = await repository.list({ ...scope, offset: 1, limit: 1 });
    expect(listed.data).toMatchObject({ total: 2, offset: 1, limit: 1 });
    expect(listed.data?.items).toHaveLength(1);
    expect((await repository.delete(key)).data).toBe(true);
    expect((await repository.delete(key)).data).toBe(false);
  });

  it.each([
    () => undefined, Symbol("x"), 1n, new Date(), new Map(), new Set(), Promise.resolve(), new Error("x"), /x/
  ])("rejects non-serializable data", async (unsafe) => {
    const repository = new InMemoryPersistenceProvider().repository(scope);
    const result = await repository.create({ ...key, data: { unsafe } as never });
    expect(result).toMatchObject({ ok: false, error: { code: "persistence.invalidData" } });
    expect(JSON.stringify(result)).not.toContain("stack");
  });

  it("rejects circular data and empty ids", async () => {
    const repository = new InMemoryPersistenceProvider().repository(scope);
    const circular: Record<string, unknown> = {}; circular.self = circular;
    expect((await repository.create({ ...key, data: circular as never })).error?.code).toBe("persistence.invalidData");
    expect((await repository.create({ ...scope, id: "", data: {} })).error?.code).toBe("persistence.invalidKey");
  });

  it("isolates namespaces and collections and never exposes mutable input references", async () => {
    const provider = new InMemoryPersistenceProvider();
    const data = { nested: { value: "original" }, list: [1, 2] } satisfies PersistenceRecordData;
    const first = provider.repository(scope); const otherCollection = provider.repository({ namespace: "system", collection: "other" }); const otherNamespace = provider.repository({ namespace: "tenant", collection: "settings" });
    const result = await first.create({ ...key, data });
    data.nested.value = "changed"; data.list.push(3);
    expect(result.data?.data).toEqual({ nested: { value: "original" }, list: [1, 2] });
    expect(Object.isFrozen(result.data?.data)).toBe(true);
    expect(Object.isFrozen((result.data?.data as typeof data).nested)).toBe(true);
    expect((await otherCollection.count({ namespace: "system", collection: "other" })).data).toBe(0);
    expect((await otherNamespace.count({ namespace: "tenant", collection: "settings" })).data).toBe(0);
    expect(provider.snapshot()).toMatchObject({ namespaces: 2, collections: 3, records: 1 });
  });

  it("generates a frozen, aggregate-only public snapshot", async () => {
    const provider = new InMemoryPersistenceProvider(); await provider.repository(scope).create({ ...key, data: { password: "must-not-leak" } });
    const snapshot = provider.snapshot(); const serialized = JSON.stringify(snapshot);
    expect(snapshot).toMatchObject({ provider: { name: "In-memory Persistence Provider" }, records: 1 });
    expect(Object.isFrozen(snapshot)).toBe(true); expect(Object.isFrozen(snapshot.provider)).toBe(true);
    for (const forbidden of ["must-not-leak", "Map", "connectionString", "stack", "driver", "client", "process.env"]) expect(serialized).not.toContain(forbidden);
  });
});

describe("Persistence Kernel integration", () => {
  it("exposes the service through Kernel, Service Registry, DI, Runtime and Status", async () => {
    const kernel = new VeltryxKernel(); const context = createBootstrapContext();
    expect(kernel.persistence()).toBeInstanceOf(PersistenceService);
    const repository = kernel.persistence().repository(scope);
    expect((await repository.create({ ...key, data: { enabled: true } })).ok).toBe(true);
    expect(kernel.services().has("kernel.persistence")).toBe(true);
    expect(kernel.container().has("kernel.persistence")).toBe(true);
    expect(await kernel.container().resolve("kernel.persistence")).toBe(kernel.persistence());
    await kernel.bootstrap(context); await kernel.initialize(context); await kernel.ready(context);
    expect(kernel.runtime().snapshot()?.persistence).toMatchObject({ status: "ready", providerId: "kernel.persistence.memory", providerKind: "memory", records: 1 });
    expect((await kernel.status().snapshot()).persistence).toMatchObject({ status: "ready", providerId: "kernel.persistence.memory", providerKind: "memory", records: 1 });
  });
});
