import { describe, expect, it } from "vitest";
import type { PersistenceRecordData } from "@veltryx/contracts";
import {
  ConfigurationPersistenceService,
  ConfigurationProvider,
  InMemoryPersistenceProvider,
  PersistenceService,
  VeltryxKernel,
  createBootstrapContext
} from "../src/index.js";

function setup(configuration = new ConfigurationProvider({ environment: {} })) {
  const persistence = new PersistenceService(new InMemoryPersistenceProvider());
  return { configuration, persistence, service: new ConfigurationPersistenceService(configuration, persistence) };
}

describe("Configuration Persistence Service", () => {
  it("starts ready and persists, loads and lists an allowlisted key", async () => {
    const { service, persistence } = setup();
    expect(service.snapshot()).toMatchObject({ status: "ready", keysPersisted: 0, keysHydrated: 0 });
    expect((await service.persistKey({ key: "app.name", value: "Persisted Veltryx" })).ok).toBe(true);
    expect((await service.loadKey({ key: "app.name" })).data).toMatchObject({ key: "app.name", value: "Persisted Veltryx", source: "persistence" });
    expect((await service.loadKey({ key: "app.version" })).data).toBeNull();
    expect((await service.listKeys()).data).toEqual([expect.objectContaining({ key: "app.name" })]);
    expect(persistence.snapshot()).toMatchObject({ namespaces: 1, collections: 1, records: 1 });
  });

  it("persists only requested public keys from the operational provider", async () => {
    const configuration = new ConfigurationProvider({ overrides: { "app.name": "Public App", "debug.enabled": true } });
    const { service } = setup(configuration);
    const result = await service.persistConfiguration({ keys: ["app.name", "debug.enabled"] });
    expect(result.data).toMatchObject({ keysPersisted: 2 });
    expect((await service.listKeys()).data?.map((entry) => entry.key).sort()).toEqual(["app.name", "debug.enabled"]);
  });

  it("hydrates defaults but preserves environment and in-memory precedence", async () => {
    const source = setup();
    await source.service.persistKey({ key: "app.name", value: "Persisted App" });
    await source.service.persistKey({ key: "runtime.mode", value: "production" });
    const targetProvider = new ConfigurationProvider({ environment: { NEXT_PUBLIC_APP_NAME: "Environment App" } });
    const target = new ConfigurationPersistenceService(targetProvider, source.persistence);
    const result = await target.hydrateConfiguration();
    expect(result.data).toMatchObject({ keysHydrated: 1, conflicts: 1 });
    expect(targetProvider.getString("app.name")).toBe("Environment App");
    expect(targetProvider.getString("runtime.mode")).toBe("production");
    expect(targetProvider.snapshot().sources.map((entry) => entry.type)).toEqual(["default", "persistence", "environment", "in-memory"]);
  });

  it("overrides current public values only when explicitly requested", async () => {
    const source = setup();
    await source.service.persistKey({ key: "app.name", value: "Explicit Persisted App" });
    const targetProvider = new ConfigurationProvider({ overrides: { "app.name": "Memory App" } });
    const target = new ConfigurationPersistenceService(targetProvider, source.persistence);
    expect((await target.hydrateConfiguration({ allowOverride: true })).data).toMatchObject({ keysHydrated: 1, conflicts: 0 });
    expect(targetProvider.getString("app.name")).toBe("Explicit Persisted App");
  });

  it("ignores invalid and blocked persisted entries during hydration", async () => {
    const { configuration, persistence } = setup();
    const repository = persistence.repository<PersistenceRecordData>({ namespace: "configuration", collection: "configuration.entries" });
    await repository.create({ namespace: "configuration", collection: "configuration.entries", id: "invalid", data: { kind: "configuration", entry: { key: "unknown", value: true, source: "persistence", persistedAt: "2026-09-02T00:00:00.000Z" } } });
    await repository.create({ namespace: "configuration", collection: "configuration.entries", id: "blocked", data: { kind: "configuration", entry: { key: ["auth", "Secret"].join(""), value: "hidden", source: "persistence", persistedAt: "2026-09-02T00:00:00.000Z" } } });
    const service = new ConfigurationPersistenceService(configuration, persistence);
    const result = await service.hydrateConfiguration();
    expect(result.data).toMatchObject({ keysHydrated: 0, invalidEntries: 1, blockedEntries: 1 });
    expect(result.warnings).toHaveLength(2);
    expect(JSON.stringify(service.snapshot())).not.toContain("hidden");
  });

  it("rejects keys outside the allowlist", async () => {
    const { service } = setup();
    expect((await service.persistKey({ key: "feature.flag", value: true })).errors[0]?.code).toBe("CONFIGURATION_PERSISTENCE_KEY_NOT_ALLOWED");
  });

  it.each([
    "secret", "token", "password", "credential", "privateKey", "apiKey",
    "connectionString", "DATABASE_URL", "database", "jwt", "session", "cookieSecret"
  ])("blocks sensitive key term %s case-insensitively", async (term) => {
    const { service } = setup();
    const result = await service.persistKey({ key: `PUBLIC.${term.toUpperCase()}`, value: "hidden" });
    expect(result.errors[0]?.code).toBe("CONFIGURATION_PERSISTENCE_BLOCKED_KEY");
    expect(JSON.stringify(service.snapshot())).not.toContain("hidden");
  });

  it.each([
    ["function", () => "unsafe"], ["undefined", undefined], ["symbol", Symbol("unsafe")],
    ["bigint", 1n], ["Date", new Date()], ["Map", new Map()], ["Set", new Set()],
    ["Promise", Promise.resolve()], ["Error", new Error("unsafe")], ["RegExp", /unsafe/],
    ["class", new (class Unsafe {})()], ["React-like", { $$typeof: Symbol.for("react.element") }],
    ["DOM-like", { nodeType: 1, ownerDocument: {} }]
  ])("rejects non-serializable %s values", async (_name, value) => {
    const { service } = setup();
    expect((await service.persistKey({ key: "app.name", value: value as never })).errors[0]?.code).toBe("CONFIGURATION_PERSISTENCE_INVALID_VALUE");
  });

  it("rejects circular values", async () => {
    const circular: Record<string, unknown> = {}; circular.self = circular;
    const { service } = setup();
    expect((await service.persistKey({ key: "app.name", value: circular as never })).ok).toBe(false);
  });

  it("publishes an immutable aggregate-only snapshot", async () => {
    const { service } = setup();
    await service.persistKey({ key: "app.name", value: "must-not-appear" });
    const snapshot = service.snapshot(); const json = JSON.stringify(snapshot);
    expect(snapshot).toMatchObject({ provider: { id: "kernel.persistence.memory", kind: "memory" }, keysPersisted: 1, allowedKeys: expect.arrayContaining(["app.name"]) });
    expect(Object.isFrozen(snapshot)).toBe(true); expect(Object.isFrozen(snapshot.allowedKeys)).toBe(true);
    for (const forbidden of ["must-not-appear", "records", "stack", "Map", "process.env", "connectionString"]) expect(json).not.toContain(forbidden);
  });
});

describe("Configuration Persistence Kernel integration", () => {
  it("exposes the singleton through Kernel, DI, Registry, Runtime and Status", async () => {
    const kernel = new VeltryxKernel(); const context = createBootstrapContext();
    expect(kernel.services().has("kernel.configurationPersistence")).toBe(true);
    expect(kernel.container().has("kernel.configurationPersistence")).toBe(true);
    expect(await kernel.container().resolve("kernel.configurationPersistence")).toBe(kernel.configurationPersistence());
    await kernel.configurationPersistence().persistKey({ key: "app.name", value: "Persisted App" });
    await kernel.bootstrap(context); await kernel.initialize(context); await kernel.ready(context);
    expect(kernel.runtime().snapshot()?.configurationPersistence).toMatchObject({ providerId: "kernel.persistence.memory", keysPersisted: 1 });
    expect((await kernel.status().snapshot()).configurationPersistence).toMatchObject({ providerId: "kernel.persistence.memory", keysPersisted: 1 });
    expect(kernel.metadataPersistence()).toBeDefined(); expect(kernel.configuration().getString("app.name")).toBeDefined();
  });
});
