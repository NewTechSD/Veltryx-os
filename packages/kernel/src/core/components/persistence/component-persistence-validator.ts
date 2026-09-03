import type { ComponentDefinition } from "@veltryx/contracts";
import { ComponentValidator } from "../component-validator.js";

const FORBIDDEN_KEYS = [
  ["ren", "der"], ["ren", "derer"], ["compo", "nent"], ["fac", "tory"],
  ["implemen", "tation"], ["implementation", "Path"], ["component", "File"],
  ["t", "sxPath"], ["j", "sxPath"], ["react", "Component"], ["next", "Component"],
  ["component", "Factory"], ["render", "Function"], ["tem", "plate"],
  ["p", "hpTemplate"], ["short", "code"], ["block", "Json"],
  ["$$", "typeof"], ["node", "Type"], ["owner", "Document"]
].map((parts) => parts.join("").toLowerCase());

export class ComponentPersistenceValidator {
  constructor(private readonly components = new ComponentValidator()) {}
  validate(component: ComponentDefinition): boolean { return this.components.validate(component).valid && this.isSerializable(component); }
  isSerializable(value: unknown, ancestors = new Set<object>()): boolean {
    if (value === null || typeof value === "string" || typeof value === "boolean") return true;
    if (typeof value === "number") return Number.isFinite(value);
    if (value === undefined || !value || typeof value !== "object") return false;
    if (ancestors.has(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) return false;
    if (!Array.isArray(value) && Object.keys(value).some((key) => FORBIDDEN_KEYS.includes(key.toLowerCase()))) return false;
    ancestors.add(value);
    const valid = Object.values(value).every((entry) => this.isSerializable(entry, ancestors));
    ancestors.delete(value);
    return valid;
  }
}
