import type { ConfigurationPersistenceEntry, PersistenceRecordData } from "@veltryx/contracts";
import { ConfigurationPersistenceValidator } from "./configuration-persistence-validator.js";

export class ConfigurationPersistenceMapper {
  constructor(private readonly validator = new ConfigurationPersistenceValidator()) {}

  toData(entry: ConfigurationPersistenceEntry): PersistenceRecordData {
    if (!this.validator.isAllowedKey(entry.key) || !this.validator.isSerializable(entry.value))
      throw new TypeError("Configuration entry is not persistable.");
    return { kind: "configuration", entry } as unknown as PersistenceRecordData;
  }

  fromData(data: PersistenceRecordData): ConfigurationPersistenceEntry | undefined {
    const entry = data.kind === "configuration" ? data.entry as unknown : undefined;
    if (!entry || typeof entry !== "object") return undefined;
    const candidate = entry as ConfigurationPersistenceEntry;
    if (!this.validator.isAllowedKey(candidate.key) || !this.validator.isSerializable(candidate.value) || candidate.source !== "persistence" || typeof candidate.persistedAt !== "string") return undefined;
    return candidate;
  }
}
