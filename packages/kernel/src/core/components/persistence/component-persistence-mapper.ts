import type { ComponentDefinition, ComponentPersistenceEntry, PersistenceRecordData } from "@veltryx/contracts";
import { cloneAndFreezeComponentValue } from "../component-diagnostics.js";
import { ComponentPersistenceValidator } from "./component-persistence-validator.js";

export class ComponentPersistenceMapper {
  constructor(private readonly validator = new ComponentPersistenceValidator()) {}
  id(component: ComponentDefinition): string { return `${component.key}:${component.version}`; }
  toData(entry: ComponentPersistenceEntry): PersistenceRecordData {
    if (!this.validator.validate(entry.definition)) throw new TypeError("Component definition is not persistable.");
    return { kind: "component-definition", entry } as unknown as PersistenceRecordData;
  }
  fromData(data: PersistenceRecordData): ComponentPersistenceEntry | undefined {
    const entry = data.kind === "component-definition" ? data.entry as unknown : undefined;
    if (!entry || typeof entry !== "object") return undefined;
    const candidate = entry as ComponentPersistenceEntry;
    if (candidate.source !== "persistence" || typeof candidate.persistedAt !== "string" || candidate.key !== candidate.definition?.key || candidate.version !== candidate.definition?.version || !this.validator.validate(candidate.definition)) return undefined;
    return cloneAndFreezeComponentValue(candidate);
  }
}
