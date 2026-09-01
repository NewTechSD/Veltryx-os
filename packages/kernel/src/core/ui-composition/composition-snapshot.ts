import type { ICompositionSnapshotService, UICompositionSnapshot } from "@veltryx/contracts";
import { cloneAndFreezeCompositionValue, createCompositionDiagnostic, createCompositionWarning } from "./composition-diagnostics.js";

export class UICompositionSnapshotService implements ICompositionSnapshotService {
  constructor(private readonly now: () => Date = () => new Date()) {}

  snapshot(input: Parameters<ICompositionSnapshotService["snapshot"]>[0]): UICompositionSnapshot {
    const generatedAt = this.now().toISOString();
    const warnings = [...input.warnings];
    if (input.compositionsGenerated === 0) warnings.push(createCompositionWarning("composition.runtimeEmpty", "No compositions have been generated.", undefined, generatedAt));
    const status = input.errors.length > 0 ? "error" : input.compositionsGenerated === 0 ? "empty" : warnings.length > 0 ? "partial" : "ready";
    return cloneAndFreezeCompositionValue({
      status,
      generatedAt,
      compositionsGenerated: input.compositionsGenerated,
      lastCompositionAt: input.lastCompositionAt,
      lastSourceType: input.lastSourceType,
      lastSourceId: input.lastSourceId,
      warnings,
      errors: input.errors,
      diagnostics: [
        ...input.diagnostics,
        ...warnings.map((warning) => ({ ...warning, severity: "warning" as const })),
        ...input.errors.map((error) => ({ ...error, severity: "error" as const })),
        createCompositionDiagnostic({ code: "composition.snapshot.generated", message: "UI Composition snapshot generated.", severity: "info", timestamp: generatedAt })
      ]
    });
  }
}
