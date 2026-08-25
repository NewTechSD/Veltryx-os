export type { EventMetadata } from "@veltryx/contracts";

export function validateEventMetadata(metadata: unknown): void {
  if (metadata === undefined) {
    return;
  }

  if (!isRecord(metadata)) {
    throw new Error("Event metadata must be an object when provided");
  }

  const typed = metadata as { readonly tags?: unknown };

  if (typed.tags !== undefined && !Array.isArray(typed.tags)) {
    throw new Error("Event metadata tags must be an array when provided");
  }

  if (Array.isArray(typed.tags) && typed.tags.some((tag) => typeof tag !== "string" || tag.trim().length === 0)) {
    throw new Error("Event metadata tags must contain only non-empty strings");
  }
}

function isRecord(candidate: unknown): candidate is Record<string, unknown> {
  return typeof candidate === "object" && candidate !== null && !Array.isArray(candidate);
}
