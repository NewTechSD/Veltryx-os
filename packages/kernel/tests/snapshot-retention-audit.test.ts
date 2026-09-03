import { describe, expect, it } from "vitest";
import type { PersistenceRecordData } from "@veltryx/contracts";
import {
  ComponentRegistry, InMemoryMetadataRegistry, InMemoryPersistenceProvider, PersistenceService,
  SnapshotChecksumService, SnapshotRetentionAuditService, UICompositionPersistenceService,
  UICompositionRuntime, VeltryxKernel, registerSystemComponents
} from "../src/index.js";

function setup() {
  const components = new ComponentRegistry(); registerSystemComponents(components);
  const metadata = new InMemoryMetadataRegistry(); metadata.registerNamespace({ id: "system", name: "System" }); metadata.registerPage({ id: "admin-overview", namespace: "system", title: "Overview" }); metadata.registerPage({ id: "other", namespace: "system", title: "Other" });
  const runtime = new UICompositionRuntime(components); const persistence = new PersistenceService(new InMemoryPersistenceProvider());
  const audit = new SnapshotRetentionAuditService(persistence, undefined, undefined, () => new Date("2026-09-03T10:00:00.000Z"));
  const service = new UICompositionPersistenceService(runtime, metadata, persistence, undefined, () => new Date("2026-09-03T10:00:00.000Z"), audit);
  const tree = runtime.compose({ sourceType: "page", sourceId: "admin-overview", namespace: "system", metadata: { id: "admin-overview", namespace: "system", title: "Overview" }, runtimeContext: {} as never });
  return { persistence, audit, service, tree };
}

describe("Snapshot retention, integrity and structural audit", () => {
  it("provides a frozen serializable default policy", async () => {
    const { audit } = setup(); const snapshot = audit.snapshot();
    expect(snapshot.policy.maxSnapshotsPerSource).toBe(20); expect(snapshot.policy.protectLatest).toBe(true);
    expect(Object.isFrozen(snapshot.policy)).toBe(true); expect(JSON.stringify(snapshot.policy)).not.toContain("secret");
  });

  it("generates deterministic sha256 checksums independent of object key order", () => {
    const checksum = new SnapshotChecksumService(() => new Date("2026-09-03T10:00:00.000Z"));
    const first = checksum.compute({ b: 2, a: 1 } as never); const second = checksum.compute({ a: 1, b: 2 } as never);
    expect(first.algorithm).toBe("sha256"); expect(first.checksum).toBe(second.checksum); expect(first.checksum).toHaveLength(64); expect(Object.isFrozen(first)).toBe(true);
  });

  it("persists checksum and records structural audit without trees or records", async () => {
    const { service, audit, tree } = setup(); const saved = await service.persistCompositionSnapshot({ tree, namespace: "system", sourceId: "admin-overview", purpose: "preview", snapshotId: "one" });
    expect(saved.data?.checksum).toHaveLength(64); const entries = await audit.listAuditEntries();
    expect(entries.data?.some((entry) => entry.operation === "persist")).toBe(true); expect(JSON.stringify(entries.data)).not.toContain("root"); expect(JSON.stringify(entries.data)).not.toContain("props"); expect(Object.isFrozen(entries.data)).toBe(true);
  });

  it("verifies intact and tampered snapshots", async () => {
    const { service, audit, persistence, tree } = setup(); await service.persistCompositionSnapshot({ tree, namespace: "system", sourceId: "admin-overview", purpose: "preview", snapshotId: "integrity" });
    expect((await audit.verifySnapshotChecksum({ snapshotId: "integrity" })).data).toMatchObject({ valid: true });
    const repository = persistence.repository<PersistenceRecordData>({ namespace: "ui-composition", collection: "composition.snapshots" }); const current = await repository.get({ namespace: "ui-composition", collection: "composition.snapshots", id: "integrity" });
    await repository.update({ namespace: "ui-composition", collection: "composition.snapshots", id: "integrity", data: { ...(current.data?.data ?? {}), checksum: "0".repeat(64) } });
    expect((await audit.verifySnapshotChecksum({ snapshotId: "integrity" })).data).toMatchObject({ valid: false });
  });

  it("enforces per-source retention, protects latest and supports dry-run", async () => {
    const { service, audit, tree, persistence } = setup();
    for (const id of ["one", "two", "three"]) await service.persistCompositionSnapshot({ tree, namespace: "system", sourceId: "admin-overview", purpose: "preview", snapshotId: id });
    const dry = await audit.enforceRetentionForSource({ sourceType: "page", namespace: "system", sourceId: "admin-overview", dryRun: true, policy: { maxSnapshotsPerSource: 2 } });
    expect(dry.data).toMatchObject({ dryRun: true, evaluatedSnapshots: 3, deletedSnapshots: 0 }); expect((await persistence.repository<PersistenceRecordData>({ namespace: "ui-composition", collection: "composition.snapshots" }).list({ namespace: "ui-composition", collection: "composition.snapshots", limit: 100, offset: 0 })).data?.total).toBe(3);
    const run = await audit.enforceRetentionForSource({ sourceType: "page", namespace: "system", sourceId: "admin-overview", policy: { maxSnapshotsPerSource: 2 } });
    expect(run.data).toMatchObject({ dryRun: false, deletedSnapshots: 1, retainedSnapshots: 2 }); expect((await service.loadLatestCompositionSnapshot({ sourceType: "page", namespace: "system", sourceId: "admin-overview" })).data).toBeTruthy();
  });

  it("enforces purpose limits and global retention explicitly", async () => {
    const { service, audit, tree } = setup();
    for (const [id, purpose] of [["p1", "preview"], ["p2", "preview"], ["p3", "preview"], ["c1", "cache"]] as const) await service.persistCompositionSnapshot({ tree, namespace: "system", sourceId: id === "c1" ? "other" : "admin-overview", purpose, snapshotId: id });
    const run = await audit.enforceRetention({ dryRun: true, policy: { maxSnapshotsPerSource: 2, maxSnapshotsPerPurpose: { preview: 1 } } });
    expect(run.data?.scope).toBe("global"); expect(run.data?.dryRun).toBe(true); expect(run.data?.evaluatedSnapshots).toBe(4);
  });

  it("repairs latest after deleting latest and clears it when empty", async () => {
    const { service, audit, tree } = setup();
    await service.persistCompositionSnapshot({ tree, namespace: "system", sourceId: "admin-overview", purpose: "test", snapshotId: "a" }); await service.persistCompositionSnapshot({ tree, namespace: "system", sourceId: "admin-overview", purpose: "test", snapshotId: "b" });
    await service.deleteCompositionSnapshot({ snapshotId: "b" }); expect((await service.loadLatestCompositionSnapshot({ sourceType: "page", namespace: "system", sourceId: "admin-overview" })).data).toBeTruthy();
    await service.deleteCompositionSnapshot({ snapshotId: "a" }); expect((await service.loadLatestCompositionSnapshot({ sourceType: "page", namespace: "system", sourceId: "admin-overview" })).data).toBeNull(); expect(audit.snapshot().latestPointersRepaired).toBeGreaterThan(0);
  });

  it("supports direct latest repair and lists filtered audit entries", async () => {
    const { service, audit, tree } = setup(); await service.persistCompositionSnapshot({ tree, namespace: "system", sourceId: "admin-overview", purpose: "audit", snapshotId: "audit-one" });
    const repaired = await audit.repairLatestPointer({ sourceType: "page", namespace: "system", sourceId: "admin-overview" }); expect(repaired.data).toMatchObject({ updated: false, snapshotId: "audit-one" });
    const entries = await audit.listAuditEntries({ operation: "persist", sourceId: "admin-overview" }); expect(entries.data?.length).toBeGreaterThan(0); expect(entries.data?.[0]).not.toHaveProperty("tree");
  });

  it("exposes aggregate-only retention status through Kernel", () => {
    const kernel = new VeltryxKernel();
    expect(kernel.snapshotRetentionAudit()).toBeDefined(); expect(kernel.services().get("kernel.snapshotRetentionAudit")).toBeDefined(); expect(kernel.container().has("kernel.snapshotRetentionAudit")).toBe(true);
  });
});
