import type { MetadataNamespace, MetadataResource, PersistenceRecordData, PersistenceValue } from "@veltryx/contracts";
import { hasUnsafeMetadataValue } from "../metadata-diagnostics.js";
import { MetadataValidator } from "../metadata-validator.js";

export class MetadataPersistenceMapper {
  constructor(private readonly validator = new MetadataValidator()) {}
  namespaceId(namespace: MetadataNamespace): string { return namespace.id; }
  resourceId(resource: MetadataResource): string { return `${resource.namespace}:${resource.type}:${resource.id}`; }
  toNamespaceData(namespace: MetadataNamespace): PersistenceRecordData { if (!this.validator.validateNamespace(namespace).valid || !this.isSerializable(namespace)) throw new TypeError("Metadata namespace is not persistable."); return { kind: "namespace", namespace: namespace as unknown as PersistenceValue }; }
  toResourceData(resource: MetadataResource): PersistenceRecordData { if (!this.validator.validateResource(resource).valid || hasUnsafeMetadataValue(resource) || !this.isSerializable(resource)) throw new TypeError("Metadata resource is not persistable."); return { kind: "resource", resource: resource as unknown as PersistenceValue }; }
  fromNamespaceData(data: PersistenceRecordData): MetadataNamespace | undefined { const value = data.kind === "namespace" ? data.namespace as unknown : undefined; if (!value || typeof value !== "object" || this.unsafePlatformShape(value)) return undefined; return this.validator.validateNamespace(value as MetadataNamespace).valid ? value as MetadataNamespace : undefined; }
  fromResourceData(data: PersistenceRecordData): MetadataResource | undefined { const value = data.kind === "resource" ? data.resource as unknown : undefined; if (!value || typeof value !== "object" || this.unsafePlatformShape(value) || hasUnsafeMetadataValue(value)) return undefined; return this.validator.validateResource(value as MetadataResource).valid ? value as MetadataResource : undefined; }
  private unsafePlatformShape(value: unknown, seen = new Set<object>()): boolean { if (!value || typeof value !== "object") return false; if (seen.has(value)) return true; seen.add(value); if (Array.isArray(value)) return value.some((item) => this.unsafePlatformShape(item, seen)); const record = value as Record<string, unknown>; if (UNSAFE_PLATFORM_KEYS.some((key) => key in record)) return true; return Object.values(record).some((item) => this.unsafePlatformShape(item, seen)); }
  private isSerializable(value: unknown, ancestors = new Set<object>()): boolean {
    if (value === null || typeof value === "string" || typeof value === "boolean") return true;
    if (typeof value === "number") return Number.isFinite(value);
    if (value === undefined || !value || typeof value !== "object") return false;
    if (ancestors.has(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) return false;
    ancestors.add(value);
    const valid = !this.unsafePlatformShape(value) && Object.values(value).every((item) => this.isSerializable(item, ancestors));
    ancestors.delete(value);
    return valid;
  }
}

const UNSAFE_PLATFORM_KEYS = [
  ["$$", "typeof"], ["node", "Type"], ["owner", "Document"],
  ["dangerously", "SetInnerHTML"], ["implementation", "Path"],
  ["component", "File"], ["t", "sxPath"], ["j", "sxPath"]
].map((parts) => parts.join(""));
