import type { CompositionError, CompositionNode, CompositionTree, IComponentRegistry, ICompositionResolver } from "@veltryx/contracts";
import { createCompositionError } from "./composition-diagnostics.js";

export class CompositionResolver implements ICompositionResolver {
  constructor(private readonly components: IComponentRegistry) {}

  resolve(tree: CompositionTree) {
    const missing = new Set<string>();
    const errors: CompositionError[] = [];
    const visit = (node: CompositionNode): void => {
      const result = this.components.resolve(node.componentKey, node.componentVersion);
      if (!result.found) {
        missing.add(node.componentVersion ? `${node.componentKey}@${node.componentVersion}` : node.componentKey);
        errors.push(createCompositionError("composition.componentMissing", "Composition component could not be resolved.", { componentKey: node.componentKey, version: node.componentVersion ?? "latest" }));
      }
      for (const child of node.children ?? []) visit(child);
      for (const slotNodes of Object.values(node.slots ?? {})) for (const child of slotNodes) visit(child);
    };
    visit(tree.root);
    return Object.freeze({ valid: errors.length === 0, missingComponents: Object.freeze([...missing]), warnings: Object.freeze([]), errors: Object.freeze(errors) });
  }
}
