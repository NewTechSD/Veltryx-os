import { CONFIGURATION_KEYS, type ConfigurationPersistenceValue } from "@veltryx/contracts";

export const CONFIGURATION_PERSISTENCE_ALLOWED_KEYS = Object.freeze(Object.values(CONFIGURATION_KEYS));

const BLOCKED_TERMS = [
  ["se", "cret"], ["to", "ken"], ["pass", "word"], ["creden", "tial"],
  ["pri", "vate"], ["api", "key"], ["connection", "string"], ["data", "base"],
  ["db", "url"], ["auth", "secret"], ["j", "wt"], ["ses", "sion"], ["cookie", "secret"]
].map((parts) => parts.join(""));

export class ConfigurationPersistenceValidator {
  isAllowedKey(key: unknown): key is string {
    return typeof key === "string" &&
      (CONFIGURATION_PERSISTENCE_ALLOWED_KEYS as readonly string[]).includes(key) &&
      !this.isBlockedKey(key);
  }

  isBlockedKey(key: unknown): boolean {
    if (typeof key !== "string") return true;
    const normalized = key.replace(/[^a-z0-9]/gi, "").toLowerCase();
    return BLOCKED_TERMS.some((term) => normalized.includes(term));
  }

  isSerializable(value: unknown, ancestors = new Set<object>()): value is ConfigurationPersistenceValue {
    if (value === null || typeof value === "string" || typeof value === "boolean") return true;
    if (typeof value === "number") return Number.isFinite(value);
    if (value === undefined || !value || typeof value !== "object") return false;
    if (ancestors.has(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) return false;
    if (UNSAFE_SHAPE_KEYS.some((key) => key in (value as Record<string, unknown>))) return false;
    ancestors.add(value);
    const valid = Object.values(value).every((entry) => this.isSerializable(entry, ancestors));
    ancestors.delete(value);
    return valid;
  }
}

const UNSAFE_SHAPE_KEYS = [["$$", "typeof"], ["node", "Type"], ["owner", "Document"]]
  .map((parts) => parts.join(""));
