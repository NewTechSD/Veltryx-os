import type {
  ConfigurationDiagnosticEntry,
  ConfigurationError,
  ConfigurationKey,
  ConfigurationResolutionResult,
  ConfigurationSourceSnapshot,
  ConfigurationValue,
  ConfigurationWarning,
  IConfigurationResolver,
  IConfigurationSource,
  IConfigurationValidator
} from "@veltryx/contracts";
import { SENSITIVE_CONFIGURATION_KEY_PATTERN } from "./configuration-keys.js";
import { ConfigurationValidator } from "./configuration-validator.js";

export class ConfigurationResolver implements IConfigurationResolver {
  constructor(private readonly validator: IConfigurationValidator = new ConfigurationValidator()) {}
  resolve(sources: readonly IConfigurationSource[]): ConfigurationResolutionResult {
    const values = new Map<ConfigurationKey, ConfigurationValue>();
    const snapshots: ConfigurationSourceSnapshot[] = [];
    const warnings: ConfigurationWarning[] = [];
    const errors: ConfigurationError[] = [];
    const diagnostics: ConfigurationDiagnosticEntry[] = [];
    for (const source of sources) {
      const loadedKeys: ConfigurationKey[] = [];
      try {
        for (const [key, value] of Object.entries(source.load())) {
          if (SENSITIVE_CONFIGURATION_KEY_PATTERN.test(key)) {
            errors.push(
              issue(
                "CONFIGURATION_SENSITIVE_KEY_REJECTED",
                "Sensitive configuration keys are not accepted by the structural provider.",
                source.name
              )
            );
            continue;
          }
          if (!this.validator.isKnownKey(key)) {
            errors.push(
              issue(
                "CONFIGURATION_KEY_UNKNOWN",
                `Unknown configuration key: ${key}.`,
                source.name,
                key
              )
            );
            continue;
          }
          const validation = this.validator.validateValue(key, value);
          if (!validation.valid) {
            errors.push(
              ...validation.issues.map((entry) =>
                issue(entry.code, entry.message, source.name, entry.key)
              )
            );
            continue;
          }
          values.set(key, value as ConfigurationValue);
          loadedKeys.push(key);
        }
        diagnostics.push(
          diagnostic(
            "CONFIGURATION_SOURCE_LOADED",
            `Configuration source loaded: ${source.name}.`,
            "info",
            source.name
          )
        );
      } catch {
        errors.push(
          issue(
            "CONFIGURATION_SOURCE_FAILED",
            `Configuration source failed: ${source.name}.`,
            source.name
          )
        );
      }
      snapshots.push(
        Object.freeze({
          name: source.name,
          type: source.type,
          loadedKeys: Object.freeze([...loadedKeys])
        })
      );
    }
    const finalValidation = this.validator.validate(Object.fromEntries(values) as never);
    errors.push(
      ...finalValidation.issues.map((entry) =>
        issue(entry.code, entry.message, "resolver", entry.key)
      )
    );
    diagnostics.push(
      ...warnings.map((entry) =>
        diagnostic(entry.code, entry.message, "warning", entry.source, entry.key)
      )
    );
    diagnostics.push(
      ...errors.map((entry) =>
        diagnostic(entry.code, entry.message, "error", entry.source, entry.key)
      )
    );
    return Object.freeze({
      values: Object.freeze(Object.fromEntries(values)) as Readonly<
        Record<ConfigurationKey, ConfigurationValue>
      >,
      sources: Object.freeze(snapshots),
      warnings: Object.freeze(warnings.map((entry) => Object.freeze(entry))),
      errors: Object.freeze(errors.map((entry) => Object.freeze(entry))),
      diagnostics: Object.freeze(diagnostics.map((entry) => Object.freeze(entry)))
    });
  }
}
function issue(code: string, message: string, source: string, key?: string): ConfigurationError {
  return { code, message, source, key };
}
function diagnostic(
  code: string,
  message: string,
  severity: ConfigurationDiagnosticEntry["severity"],
  source: string,
  key?: string
): ConfigurationDiagnosticEntry {
  return { code, message, severity, source, key };
}
