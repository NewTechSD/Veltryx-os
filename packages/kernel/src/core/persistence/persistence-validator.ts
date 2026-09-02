import type { PersistenceKey, PersistenceRecordData, PersistenceRecordMetadata, RepositoryInput } from "@veltryx/contracts";

const SAFE_NAME = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;

export function validateRepositoryInput(input: RepositoryInput): void {
  validatePart(input?.namespace, "namespace");
  validatePart(input?.collection, "collection");
}

export function validatePersistenceKey(key: PersistenceKey, expected?: RepositoryInput): string | undefined {
  try {
    validatePart(key?.namespace, "namespace"); validatePart(key?.collection, "collection"); validatePart(key?.id, "id");
    if (expected && (key.namespace !== expected.namespace || key.collection !== expected.collection)) return "Persistence key is outside the repository scope.";
    return undefined;
  } catch { return "Persistence key is invalid."; }
}

export function cloneSerializableData<TData extends PersistenceRecordData>(data: TData): TData {
  if (!isPlainObject(data)) throw new TypeError("Persistence data must be a plain object.");
  return cloneValue(data, new Set()) as TData;
}

export function cloneRecordMetadata(metadata: PersistenceRecordMetadata | undefined): PersistenceRecordMetadata {
  if (metadata === undefined) return Object.freeze({});
  if (!isPlainObject(metadata)) throw new TypeError("Persistence metadata must be a plain object.");
  const output: Record<string, string | readonly string[] | undefined> = {};
  for (const key of ["source", "tenantId", "workspaceId", "createdBy", "updatedBy"] as const) {
    const value = metadata[key];
    if (value !== undefined && typeof value !== "string") throw new TypeError("Persistence metadata values must be strings.");
    if (value !== undefined) output[key] = value;
  }
  if (metadata.tags !== undefined) {
    if (!Array.isArray(metadata.tags) || metadata.tags.some((tag) => typeof tag !== "string")) throw new TypeError("Persistence metadata tags must be strings.");
    output.tags = Object.freeze([...metadata.tags]);
  }
  return Object.freeze(output);
}

function validatePart(value: unknown, label: string): void {
  if (typeof value !== "string" || !SAFE_NAME.test(value) || value === "." || value === ".." || value.includes("../") || value.includes("..\\")) throw new TypeError(`Persistence ${label} is invalid.`);
}

function cloneValue(value: unknown, seen: Set<object>): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") { if (!Number.isFinite(value)) throw new TypeError("Persistence numbers must be finite."); return value; }
  if (typeof value !== "object") throw new TypeError("Persistence data contains a non-serializable value.");
  if (seen.has(value)) throw new TypeError("Persistence data contains a circular reference.");
  seen.add(value);
  try {
    if (Array.isArray(value)) return Object.freeze(value.map((entry) => cloneValue(entry, seen)));
    if (!isPlainObject(value)) throw new TypeError("Persistence data contains a non-plain object.");
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) output[key] = cloneValue(entry, seen);
    return Object.freeze(output);
  } finally { seen.delete(value); }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
