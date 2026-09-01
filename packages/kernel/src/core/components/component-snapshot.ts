import type {
  ComponentDefinition,
  ComponentRegistryDiagnosticEntry,
  ComponentRegistryError,
  ComponentRegistrySnapshot,
  ComponentRegistryWarning,
  IComponentSnapshotService
} from "@veltryx/contracts";
import { cloneAndFreezeComponentValue, createComponentDiagnostic, createComponentWarning } from "./component-diagnostics.js";

const EMPTY_INPUT = Object.freeze({
  components: Object.freeze([]) as readonly ComponentDefinition[],
  warnings: Object.freeze([]) as readonly ComponentRegistryWarning[],
  errors: Object.freeze([]) as readonly ComponentRegistryError[],
  diagnostics: Object.freeze([]) as readonly ComponentRegistryDiagnosticEntry[]
});

export class ComponentSnapshotService implements IComponentSnapshotService {
  constructor(private readonly now: () => Date = () => new Date()) {}

  snapshot(input: Parameters<IComponentSnapshotService["snapshot"]>[0] = EMPTY_INPUT): ComponentRegistrySnapshot {
    const generatedAt = this.now().toISOString();
    const componentsByType: Record<string, number> = {};
    const componentsByCategory: Record<string, number> = {};
    for (const component of input.components) {
      componentsByType[component.type] = (componentsByType[component.type] ?? 0) + 1;
      componentsByCategory[component.category] = (componentsByCategory[component.category] ?? 0) + 1;
    }
    const warnings: ComponentRegistryWarning[] = [...input.warnings];
    if (input.components.length === 0) warnings.push(createComponentWarning("component.registryEmpty", "No components are registered.", undefined, generatedAt));
    const status = input.errors.length > 0 ? "error" : input.components.length === 0 ? "empty" : warnings.length > 0 ? "partial" : "ready";
    return cloneAndFreezeComponentValue({
      status,
      generatedAt,
      componentsRegistered: input.components.length,
      componentsByType,
      componentsByCategory,
      components: input.components,
      warnings,
      errors: input.errors,
      diagnostics: [
        ...input.diagnostics,
        ...warnings.map((warning) => ({ ...warning, severity: "warning" as const })),
        ...input.errors.map((error) => ({ ...error, severity: "error" as const })),
        createComponentDiagnostic({ code: "component.registry.snapshot.generated", message: "Component Registry snapshot generated.", severity: "info", timestamp: generatedAt })
      ]
    });
  }
}
