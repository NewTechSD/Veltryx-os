import type {
  CompositionDiagnosticEntry,
  CompositionError,
  CompositionInput,
  CompositionTree,
  CompositionWarning,
  IComponentRegistry,
  IUICompositionRuntime
} from "@veltryx/contracts";
import { cloneAndFreezeCompositionValue, createCompositionDiagnostic, createCompositionError, createCompositionWarning, hasUnsafeCompositionValue } from "./composition-diagnostics.js";
import { CompositionResolver } from "./composition-resolver.js";
import { UICompositionSnapshotService } from "./composition-snapshot.js";
import { CompositionValidator } from "./composition-validator.js";
import { MetadataCompositionMapper } from "./metadata-composition-mapper.js";

const SOURCE_TYPES = ["page", "view", "form", "list", "menu", "custom"] as const;

export class UICompositionRuntime implements IUICompositionRuntime {
  private compositionsGenerated = 0;
  private lastCompositionAt: string | undefined;
  private lastSourceType: string | undefined;
  private lastSourceId: string | undefined;
  private readonly warnings: CompositionWarning[] = [];
  private readonly errors: CompositionError[] = [];
  private readonly diagnostics: CompositionDiagnosticEntry[] = [];
  private readonly validator: CompositionValidator;
  private readonly resolver: CompositionResolver;

  constructor(
    private readonly components: IComponentRegistry,
    private readonly mapper = new MetadataCompositionMapper(),
    private readonly snapshotService = new UICompositionSnapshotService(),
    private readonly now: () => Date = () => new Date()
  ) {
    this.validator = new CompositionValidator(components);
    this.resolver = new CompositionResolver(components);
  }

  compose(input: CompositionInput): CompositionTree {
    const generatedAt = this.now().toISOString();
    const warnings: CompositionWarning[] = [];
    const errors: CompositionError[] = [];
    if (!SOURCE_TYPES.includes(input.sourceType)) errors.push(createCompositionError("composition.invalidSourceType", "Composition sourceType is invalid.", { sourceType: String(input.sourceType) }));
    if (!input.sourceId?.trim()) errors.push(createCompositionError("composition.invalidInput", "Composition sourceId is required."));
    if (!input.runtimeContext) warnings.push(createCompositionWarning("composition.runtimeContextMissing", "Runtime Context summary is unavailable.", { sourceId: input.sourceId }, generatedAt));
    if (hasUnsafeCompositionValue(input.metadata)) errors.push(createCompositionError("composition.unsafeValue", "Composition metadata contains unsafe values."));

    const mapped = errors.length ? { errors } : this.mapper.map(input);
    errors.push(...mapped.errors);
    const root = mapped.root ?? { id: "invalid:root", componentKey: "system.errorState", props: { sourceId: input.sourceId } };
    const tree: CompositionTree = cloneAndFreezeCompositionValue({
      id: `composition:${input.sourceType}:${input.namespace ?? "default"}:${input.sourceId}`,
      source: input.namespace ? `${input.namespace}.${input.sourceId}` : input.sourceId,
      sourceType: input.sourceType,
      root,
      generatedAt,
      warnings,
      errors,
      diagnostics: [
        ...warnings.map((warning) => ({ ...warning, severity: "warning" as const })),
        ...errors.map((error) => ({ ...error, severity: "error" as const })),
        createCompositionDiagnostic({ code: "composition.generated", message: "Composition tree generated.", severity: "info", details: { sourceType: input.sourceType, sourceId: input.sourceId }, timestamp: generatedAt })
      ]
    });
    const validation = this.validator.validate(tree);
    const resolution = this.resolver.resolve(tree);
    const finalErrors = [...tree.errors, ...validation.errors, ...resolution.errors];
    const finalWarnings = [...tree.warnings, ...validation.warnings, ...resolution.warnings];
    const finalTree = cloneAndFreezeCompositionValue({ ...tree, warnings: finalWarnings, errors: finalErrors, diagnostics: [...tree.diagnostics, ...finalWarnings.map((warning) => ({ ...warning, severity: "warning" as const })), ...finalErrors.map((error) => ({ ...error, severity: "error" as const }))] });
    this.compositionsGenerated += 1;
    this.lastCompositionAt = generatedAt;
    this.lastSourceType = input.sourceType;
    this.lastSourceId = input.sourceId;
    this.warnings.push(...finalWarnings);
    this.errors.push(...finalErrors);
    this.diagnostics.push(...finalTree.diagnostics);
    return finalTree;
  }

  validate(tree: CompositionTree) {
    return this.validator.validate(tree);
  }

  snapshot() {
    return this.snapshotService.snapshot({
      compositionsGenerated: this.compositionsGenerated,
      lastCompositionAt: this.lastCompositionAt,
      lastSourceType: this.lastSourceType,
      lastSourceId: this.lastSourceId,
      warnings: this.warnings,
      errors: this.errors,
      diagnostics: this.diagnostics
    });
  }
}
