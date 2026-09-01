import type {
  ComponentDefinition,
  IComponentRegistry,
  CompositionError,
  CompositionNode,
  CompositionTree,
  CompositionValidationResult,
  ICompositionValidator
} from "@veltryx/contracts";
import { createCompositionError, hasUnsafeCompositionValue } from "./composition-diagnostics.js";

export class CompositionValidator implements ICompositionValidator {
  constructor(private readonly components: IComponentRegistry) {}

  validate(tree: CompositionTree): CompositionValidationResult {
    const errors: CompositionError[] = [];
    if (!this.nonEmpty(tree.id)) errors.push(createCompositionError("composition.invalidTree", "Composition tree id is required."));
    if (!tree.root) errors.push(createCompositionError("composition.invalidTree", "Composition tree root is required."));
    if (hasUnsafeCompositionValue(tree)) errors.push(createCompositionError("composition.unsafeValue", "Composition tree contains unsafe values."));
    if (tree.root) this.validateNode(tree.root, errors, undefined);
    return Object.freeze({ valid: errors.length === 0, warnings: Object.freeze([]), errors: Object.freeze(errors) });
  }

  private validateNode(node: CompositionNode, errors: CompositionError[], parent?: ComponentDefinition): void {
    if (!this.nonEmpty(node.id)) errors.push(createCompositionError("composition.invalidNode", "Composition node id is required."));
    if (!this.nonEmpty(node.componentKey)) {
      errors.push(createCompositionError("composition.invalidNode", "Composition node componentKey is required."));
      return;
    }
    const resolution = this.components.resolve(node.componentKey, node.componentVersion);
    if (!resolution.found || !resolution.component) {
      errors.push(createCompositionError("composition.componentMissing", "Composition node component is not registered.", { componentKey: node.componentKey, version: node.componentVersion ?? "latest" }));
    } else {
      if (parent?.allowedChildren?.length && !parent.allowedChildren.includes(node.componentKey)) errors.push(createCompositionError("composition.childNotAllowed", "Composition child is not allowed by parent component.", { parent: parent.key, child: node.componentKey }));
      this.validateProps(node, resolution.component, errors);
      this.validateSlots(node, resolution.component, errors);
    }
    for (const child of node.children ?? []) this.validateNode(child, errors, resolution.component);
    for (const slotNodes of Object.values(node.slots ?? {})) for (const child of slotNodes) this.validateNode(child, errors, resolution.component);
  }

  private validateProps(node: CompositionNode, component: ComponentDefinition, errors: CompositionError[]): void {
    const props = node.props ?? {};
    for (const prop of component.propsSchema ?? []) {
      if (prop.required && !(prop.name in props)) errors.push(createCompositionError("composition.propMissing", "Required component prop is missing.", { componentKey: component.key, prop: prop.name }));
      if (prop.name in props && !this.matchesType(props[prop.name], prop.type, prop.options)) errors.push(createCompositionError("composition.propInvalid", "Composition prop does not match component propsSchema.", { componentKey: component.key, prop: prop.name, type: prop.type }));
    }
  }

  private validateSlots(node: CompositionNode, component: ComponentDefinition, errors: CompositionError[]): void {
    const slots = node.slots ?? {};
    const allowed = new Set((component.slots ?? []).map((slot) => slot.name));
    for (const slotName of Object.keys(slots)) if (!allowed.has(slotName)) errors.push(createCompositionError("composition.slotInvalid", "Composition slot is not declared by component.", { componentKey: component.key, slot: slotName }));
    for (const slot of component.slots ?? []) {
      const nodes = slots[slot.name] ?? [];
      if (slot.required && nodes.length === 0) errors.push(createCompositionError("composition.slotMissing", "Required component slot is missing.", { componentKey: component.key, slot: slot.name }));
      if (slot.multiple === false && nodes.length > 1) errors.push(createCompositionError("composition.slotInvalid", "Composition slot does not accept multiple nodes.", { componentKey: component.key, slot: slot.name }));
      if (slot.accepts?.length) for (const child of nodes) if (!slot.accepts.includes(child.componentKey)) errors.push(createCompositionError("composition.slotInvalid", "Composition slot does not accept child component.", { componentKey: component.key, slot: slot.name, child: child.componentKey }));
    }
  }

  private matchesType(value: unknown, type: string, options?: readonly unknown[]): boolean {
    if (value === undefined || value === null || type === "unknown") return true;
    if (["string", "icon", "image", "url", "color", "spacing", "variant", "date", "datetime"].includes(type)) return typeof value === "string";
    if (type === "number") return typeof value === "number";
    if (type === "boolean") return typeof value === "boolean";
    if (type === "array") return Array.isArray(value);
    if (type === "object") return typeof value === "object" && !Array.isArray(value);
    if (type === "enum") return options?.some((option) => option === value) ?? false;
    return false;
  }

  private nonEmpty(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
  }
}
