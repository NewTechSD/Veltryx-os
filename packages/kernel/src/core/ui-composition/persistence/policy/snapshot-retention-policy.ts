import type { SnapshotRetentionPolicy } from "@veltryx/contracts";
import { cloneAndFreezeCompositionValue } from "../../composition-diagnostics.js";

export const DEFAULT_SNAPSHOT_RETENTION_POLICY: SnapshotRetentionPolicy = cloneAndFreezeCompositionValue({
  maxSnapshotsPerSource: 20,
  maxSnapshotsPerPurpose: { preview: 10, cache: 5, diagnostic: 20, test: 10, audit: 50 },
  protectLatest: true,
  dryRunDefault: false
});

export function resolveSnapshotRetentionPolicy(override: Partial<SnapshotRetentionPolicy> = {}): SnapshotRetentionPolicy {
  const policy = { ...DEFAULT_SNAPSHOT_RETENTION_POLICY, ...override, maxSnapshotsPerPurpose: { ...DEFAULT_SNAPSHOT_RETENTION_POLICY.maxSnapshotsPerPurpose, ...override.maxSnapshotsPerPurpose } };
  if (!Number.isInteger(policy.maxSnapshotsPerSource) || policy.maxSnapshotsPerSource < 1) throw new TypeError("Retention maxSnapshotsPerSource must be positive.");
  if (policy.maxAgeMs !== undefined && (!Number.isFinite(policy.maxAgeMs) || policy.maxAgeMs < 0)) throw new TypeError("Retention maxAgeMs is invalid.");
  for (const value of Object.values(policy.maxSnapshotsPerPurpose ?? {})) if (!Number.isInteger(value) || value < 1) throw new TypeError("Retention purpose limit must be positive.");
  return cloneAndFreezeCompositionValue(policy);
}
