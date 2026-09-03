import { createHash } from "node:crypto";
import type { CompositionTree, SnapshotChecksumResult } from "@veltryx/contracts";
import { cloneAndFreezeCompositionValue } from "../../composition-diagnostics.js";

export class SnapshotChecksumService {
  constructor(private readonly now: () => Date = () => new Date()) {}
  compute(tree: CompositionTree): SnapshotChecksumResult {
    const checksum = createHash("sha256").update(canonical(tree)).digest("hex");
    return cloneAndFreezeCompositionValue({ algorithm: "sha256", checksum, computedAt: this.now().toISOString() });
  }
}

function canonical(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, nested]) => `${JSON.stringify(key)}:${canonical(nested)}`).join(",")}}`;
  throw new TypeError("Checksum input is not serializable.");
}
