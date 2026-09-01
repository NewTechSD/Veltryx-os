import type {
  ComponentDefinition,
  ComponentRegistrationOptions,
  ComponentRegistryDiagnosticEntry,
  ComponentRegistryError,
  IComponentRegistry
} from "@veltryx/contracts";
import { cloneAndFreezeComponentValue, createComponentDiagnostic, createComponentError } from "./component-diagnostics.js";
import { ComponentResolver } from "./component-resolver.js";
import { ComponentSnapshotService } from "./component-snapshot.js";
import { ComponentValidator } from "./component-validator.js";

export class ComponentRegistry implements IComponentRegistry {
  private readonly components = new Map<string, ComponentDefinition>();
  private readonly warnings: import("@veltryx/contracts").ComponentRegistryWarning[] = [];
  private readonly errors: ComponentRegistryError[] = [];
  private readonly diagnostics: ComponentRegistryDiagnosticEntry[] = [];
  private readonly resolver = new ComponentResolver({ components: this.components });

  constructor(
    private readonly validator = new ComponentValidator(),
    private readonly snapshotService = new ComponentSnapshotService()
  ) {}

  register(component: ComponentDefinition, options: ComponentRegistrationOptions = {}): ComponentDefinition {
    const definition = options.source ? { ...component, source: options.source } : component;
    const validation = this.validator.validate(definition);
    this.errors.push(...validation.errors);
    for (const error of validation.errors) this.diagnostics.push({ ...error, severity: "error" });
    if (!validation.valid) throw new Error(validation.errors[0]?.message ?? "Component validation failed.");
    const key = this.registryKey(definition.key, definition.version);
    if (this.components.has(key) && !options.replace) throw this.duplicate(`Component already registered: ${key}`);
    const frozen = cloneAndFreezeComponentValue(definition);
    this.components.set(key, frozen);
    this.diagnostics.push(createComponentDiagnostic({ code: "component.registered", message: "Component registered.", severity: "info", details: { key: definition.key, version: definition.version }, timestamp: new Date().toISOString() }));
    return cloneAndFreezeComponentValue(frozen);
  }

  resolve(key: string, version?: string) {
    return this.resolver.resolve(key, version);
  }

  resolveByType(type: Parameters<ComponentResolver["resolveByType"]>[0]) {
    return this.resolver.resolveByType(type);
  }

  resolveByCategory(category: Parameters<ComponentResolver["resolveByCategory"]>[0]) {
    return this.resolver.resolveByCategory(category);
  }

  list(): readonly ComponentDefinition[] {
    return Object.freeze([...this.components.values()].map((component) => cloneAndFreezeComponentValue(component)));
  }

  snapshot() {
    return this.snapshotService.snapshot({
      components: this.list(),
      warnings: this.warnings,
      errors: this.errors,
      diagnostics: this.diagnostics
    });
  }

  private duplicate(message: string): Error {
    const error = createComponentError("component.duplicate", message);
    this.errors.push(error);
    this.diagnostics.push({ ...error, severity: "error" });
    return new Error(message);
  }

  private registryKey(key: string, version: string): string {
    return `${key}@${version}`;
  }
}

