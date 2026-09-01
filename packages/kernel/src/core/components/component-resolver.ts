import type {
  ComponentDefinition,
  ComponentResolutionResult,
  ComponentType,
  ComponentCategory,
  IComponentResolver
} from "@veltryx/contracts";
import { cloneAndFreezeComponentValue, createComponentError } from "./component-diagnostics.js";

export interface ComponentResolverState {
  readonly components: ReadonlyMap<string, ComponentDefinition>;
}

export class ComponentResolver implements IComponentResolver {
  constructor(private readonly state: ComponentResolverState) {}

  resolve(key: string, version?: string): ComponentResolutionResult {
    const matches = [...this.state.components.values()].filter((component) => component.key === key);
    const component = version ? matches.find((entry) => entry.version === version) : matches.at(-1);
    if (!component) {
      return Object.freeze({
        found: false,
        key,
        version,
        error: createComponentError("component.resolutionFailed", "Component is not registered.", { key, version: version ?? "latest" })
      });
    }
    return Object.freeze({ found: true, key, version: component.version, component: cloneAndFreezeComponentValue(component) });
  }

  resolveByType(type: ComponentType): readonly ComponentDefinition[] {
    return Object.freeze([...this.state.components.values()].filter((component) => component.type === type).map((component) => cloneAndFreezeComponentValue(component)));
  }

  resolveByCategory(category: ComponentCategory): readonly ComponentDefinition[] {
    return Object.freeze([...this.state.components.values()].filter((component) => component.category === category).map((component) => cloneAndFreezeComponentValue(component)));
  }
}
