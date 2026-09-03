import type { CompositionTree, IMetadataRegistry, IUICompositionRuntime } from "@veltryx/contracts";
import { hasUnsafeCompositionValue } from "../composition-diagnostics.js";
import { ComponentPersistenceValidator } from "../../components/persistence/component-persistence-validator.js";

export class UICompositionPersistenceValidator {
  private readonly serializable = new ComponentPersistenceValidator();
  constructor(private readonly runtime: IUICompositionRuntime, private readonly metadata: IMetadataRegistry) {}
  validate(tree: CompositionTree, namespace: string, sourceId: string): string | undefined {
    if (!namespace?.trim() || !sourceId?.trim()) return "Composition source is required.";
    if (hasUnsafeCompositionValue(tree) || !this.serializable.isSerializable(tree)) return "Composition tree contains unsafe values.";
    if (!this.runtime.validate(tree).valid) return "Composition tree is invalid or references an unavailable component.";
    if (tree.sourceType !== "custom") { const source = this.metadata.resolve(namespace, sourceId); if (!source.found || !source.resource) return "Composition metadata source is unavailable."; if (source.resource.type !== tree.sourceType) return "Composition metadata source type is incompatible."; }
    return undefined;
  }
}
