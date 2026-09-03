import type { CompositionSnapshotEntry, CompositionTree, PersistenceRecordData } from "@veltryx/contracts";
import { cloneAndFreezeCompositionValue, hasUnsafeCompositionValue } from "../composition-diagnostics.js";

export class UICompositionPersistenceMapper {
  snapshotId(value: string): string { if (!/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(value) || value === "." || value === "..") throw new TypeError("Composition snapshot id is invalid."); return value; }
  sourceKey(sourceType: string, namespace: string, sourceId: string): string { return this.snapshotId(`latest:${sourceType}:${namespace}:${sourceId}`); }
  toData(entry: CompositionSnapshotEntry): PersistenceRecordData { if (hasUnsafeCompositionValue(entry)) throw new TypeError("Composition snapshot is not serializable."); return cloneAndFreezeCompositionValue(entry) as unknown as PersistenceRecordData; }
  fromData(data: PersistenceRecordData): CompositionSnapshotEntry | undefined { try { if (hasUnsafeCompositionValue(data)) return undefined; const value = data as unknown as CompositionSnapshotEntry; if (!value || typeof value !== "object" || !value.tree || typeof value.snapshotId !== "string" || typeof value.namespace !== "string" || typeof value.sourceId !== "string" || typeof value.sourceType !== "string" || typeof value.purpose !== "string") return undefined; this.snapshotId(value.snapshotId); return cloneAndFreezeCompositionValue(value); } catch { return undefined; } }
  latestData(snapshotId: string): PersistenceRecordData { return Object.freeze({ snapshotId: this.snapshotId(snapshotId) }); }
  latestId(data: PersistenceRecordData): string | undefined { return typeof data.snapshotId === "string" ? this.snapshotId(data.snapshotId) : undefined; }
  tree(entry: CompositionSnapshotEntry): CompositionTree { return cloneAndFreezeCompositionValue(entry.tree); }
}
