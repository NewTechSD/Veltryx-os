import type {
  ComponentCapability,
  ComponentCategory,
  ComponentDefinition,
  ComponentPropType,
  ComponentRegistryError,
  ComponentType,
  ComponentValidationResult,
  IComponentValidator
} from "@veltryx/contracts";
import { createComponentError, hasUnsafeComponentValue } from "./component-diagnostics.js";

export const COMPONENT_TYPES: readonly ComponentType[] = [
  "layout",
  "display",
  "data",
  "form",
  "navigation",
  "feedback",
  "action",
  "overlay",
  "content",
  "system"
];
export const COMPONENT_CATEGORIES: readonly ComponentCategory[] = [
  "page",
  "section",
  "container",
  "card",
  "table",
  "form",
  "field",
  "button",
  "navigation",
  "status",
  "feedback",
  "media",
  "typography",
  "layout",
  "system"
];
export const COMPONENT_CAPABILITIES: readonly ComponentCapability[] = [
  "canRenderChildren",
  "canReceiveActions",
  "canBindData",
  "canUseSlots",
  "canDisplayStatus",
  "canSubmitForm",
  "canNavigate",
  "canRenderCollection",
  "canRenderField"
];
export const COMPONENT_PROP_TYPES: readonly ComponentPropType[] = [
  "string",
  "number",
  "boolean",
  "date",
  "datetime",
  "array",
  "object",
  "enum",
  "icon",
  "image",
  "url",
  "color",
  "spacing",
  "variant",
  "unknown"
];

const KEY_PATTERN = /^[a-z][A-Za-z0-9]*(?:\.[a-z][A-Za-z0-9]*)+$/;
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/;

export class ComponentValidator implements IComponentValidator {
  validate(component: ComponentDefinition): ComponentValidationResult {
    const errors: ComponentRegistryError[] = [];
    if (!this.nonEmpty(component.key)) errors.push(createComponentError("component.invalidKey", "Component key is required."));
    else if (!KEY_PATTERN.test(component.key)) errors.push(createComponentError("component.invalidKey", "Component key is malformed."));
    if (!this.nonEmpty(component.name)) errors.push(createComponentError("component.invalidName", "Component name is required."));
    if (!this.nonEmpty(component.label)) errors.push(createComponentError("component.invalidLabel", "Component label is required."));
    if (!COMPONENT_TYPES.includes(component.type)) errors.push(createComponentError("component.invalidType", "Component type is invalid."));
    if (!COMPONENT_CATEGORIES.includes(component.category)) errors.push(createComponentError("component.invalidCategory", "Component category is invalid."));
    if (!this.nonEmpty(component.version)) errors.push(createComponentError("component.invalidVersion", "Component version is required."));
    else if (!VERSION_PATTERN.test(component.version)) errors.push(createComponentError("component.invalidVersion", "Component version is malformed."));
    for (const capability of component.capabilities ?? []) {
      if (!COMPONENT_CAPABILITIES.includes(capability)) errors.push(createComponentError("component.invalidCapability", "Component capability is invalid."));
    }
    this.validateProps(component, errors);
    this.validateSlots(component, errors);
    for (const child of component.allowedChildren ?? []) if (!this.nonEmpty(child)) errors.push(createComponentError("component.invalidChild", "Allowed child component key is required."));
    if (hasUnsafeComponentValue(component)) errors.push(createComponentError("component.unsafeValue", "Component definition contains unsafe values."));
    return Object.freeze({ valid: errors.length === 0, warnings: Object.freeze([]), errors: Object.freeze(errors) });
  }

  private validateProps(component: ComponentDefinition, errors: ComponentRegistryError[]): void {
    if (component.propsSchema === undefined) return;
    if (!Array.isArray(component.propsSchema)) {
      errors.push(createComponentError("component.invalidPropsSchema", "Component propsSchema must be an array."));
      return;
    }
    const names = new Set<string>();
    for (const prop of component.propsSchema) {
      if (!this.nonEmpty(prop.name)) errors.push(createComponentError("component.invalidProp", "Component prop name is required."));
      else if (names.has(prop.name)) errors.push(createComponentError("component.invalidProp", "Component prop names must be unique.", { prop: prop.name }));
      else names.add(prop.name);
      if (!COMPONENT_PROP_TYPES.includes(prop.type)) errors.push(createComponentError("component.invalidProp", "Component prop type is invalid."));
      if (prop.type === "enum" && (!Array.isArray(prop.options) || prop.options.length === 0)) errors.push(createComponentError("component.invalidProp", "Enum component prop requires options."));
      if (prop.options !== undefined && (!Array.isArray(prop.options) || hasUnsafeComponentValue(prop.options))) errors.push(createComponentError("component.invalidProp", "Component prop options are invalid."));
      if (prop.defaultValue !== undefined && hasUnsafeComponentValue(prop.defaultValue)) errors.push(createComponentError("component.invalidProp", "Component prop defaultValue is unsafe."));
    }
  }

  private validateSlots(component: ComponentDefinition, errors: ComponentRegistryError[]): void {
    if (component.slots === undefined) return;
    if (!Array.isArray(component.slots)) {
      errors.push(createComponentError("component.invalidSlot", "Component slots must be an array."));
      return;
    }
    const names = new Set<string>();
    for (const slot of component.slots) {
      if (!this.nonEmpty(slot.name)) errors.push(createComponentError("component.invalidSlot", "Component slot name is required."));
      else if (names.has(slot.name)) errors.push(createComponentError("component.invalidSlot", "Component slot names must be unique.", { slot: slot.name }));
      else names.add(slot.name);
      if (slot.accepts !== undefined && (!Array.isArray(slot.accepts) || slot.accepts.some((key: string) => !this.nonEmpty(key)))) errors.push(createComponentError("component.invalidSlot", "Component slot accepts must be component keys."));
    }
  }

  private nonEmpty(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
  }
}



