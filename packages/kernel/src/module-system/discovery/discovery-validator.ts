import type {
  IModuleCatalog,
  IModuleDiscoveryValidator,
  IModuleManifestParser,
  ModuleDiscoveryValidationResult,
  ModuleManifestValidationIssue
} from "@veltryx/contracts";

import { KernelModuleManifestParser } from "../../module-loader.js";

export class KernelModuleDiscoveryValidator implements IModuleDiscoveryValidator {
  constructor(private readonly parser: IModuleManifestParser = new KernelModuleManifestParser()) {}

  validate(
    candidate: unknown,
    catalog: IModuleCatalog,
    discoveredIds: ReadonlySet<string>
  ): ModuleDiscoveryValidationResult {
    const manifestValidation = this.parser.validate(candidate);

    if (!manifestValidation.valid) {
      return {
        valid: false,
        issues: manifestValidation.issues
      };
    }

    const manifest = this.parser.parse(candidate);
    const duplicateIssues = this.validateDuplicate(manifest.id, catalog, discoveredIds);

    if (duplicateIssues.length > 0) {
      return {
        valid: false,
        issues: duplicateIssues,
        manifest,
        duplicate: true
      };
    }

    return {
      valid: true,
      issues: [],
      manifest
    };
  }

  private validateDuplicate(
    moduleId: string,
    catalog: IModuleCatalog,
    discoveredIds: ReadonlySet<string>
  ): readonly ModuleManifestValidationIssue[] {
    if (catalog.has(moduleId) || discoveredIds.has(moduleId)) {
      return [
        {
          field: "id",
          message: `module id must be unique: ${moduleId}`
        }
      ];
    }

    return [];
  }
}
