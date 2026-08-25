import {
  CONFIGURATION_KEYS,
  type ConfigurationKey,
  type ConfigurationValidationIssue,
  type ConfigurationValidationResult,
  type ConfigurationValues,
  type IConfigurationValidator
} from "@veltryx/contracts";
import { OFFICIAL_CONFIGURATION_KEYS } from "./configuration-keys.js";

const ENVIRONMENTS = new Set(["development", "test", "preview", "production"]);
const RUNTIME_MODES = new Set(["development", "preview", "production", "test"]);
const BOOLEAN_KEYS = new Set<ConfigurationKey>([
  CONFIGURATION_KEYS.debugEnabled,
  CONFIGURATION_KEYS.kernelStatusEnabled,
  CONFIGURATION_KEYS.structuralEventsEnabled,
  CONFIGURATION_KEYS.moduleSnapshotEnabled
]);

export class ConfigurationValidator implements IConfigurationValidator {
  isKnownKey(key: string): key is ConfigurationKey {
    return (OFFICIAL_CONFIGURATION_KEYS as readonly string[]).includes(key);
  }

  validateValue(key: ConfigurationKey, value: unknown): ConfigurationValidationResult {
    let issue: ConfigurationValidationIssue | undefined;
    if (
      key === CONFIGURATION_KEYS.environment &&
      (typeof value !== "string" || !ENVIRONMENTS.has(value))
    )
      issue = createError(
        "CONFIGURATION_ENVIRONMENT_INVALID",
        "Environment must be one of: development, test, preview, production.",
        key
      );
    else if (
      key === CONFIGURATION_KEYS.runtimeMode &&
      (typeof value !== "string" || !RUNTIME_MODES.has(value))
    )
      issue = createError(
        "CONFIGURATION_RUNTIME_MODE_INVALID",
        "Runtime mode must be one of: development, preview, production, test.",
        key
      );
    else if (
      (key === CONFIGURATION_KEYS.appName || key === CONFIGURATION_KEYS.appVersion) &&
      (typeof value !== "string" || value.trim().length === 0)
    )
      issue = createError(
        "CONFIGURATION_REQUIRED_STRING_INVALID",
        `${key} must be a non-empty string.`,
        key
      );
    else if (BOOLEAN_KEYS.has(key) && typeof value !== "boolean")
      issue = createError("CONFIGURATION_BOOLEAN_INVALID", `${key} must be a boolean.`, key);
    return freezeResult(issue ? [issue] : []);
  }

  validate(values: ConfigurationValues): ConfigurationValidationResult {
    const issues: ConfigurationValidationIssue[] = [];
    for (const [key, value] of Object.entries(values)) {
      if (!this.isKnownKey(key))
        issues.push(
          createError("CONFIGURATION_KEY_UNKNOWN", `Unknown configuration key: ${key}.`, key)
        );
      else issues.push(...this.validateValue(key, value).issues);
    }
    for (const key of [
      CONFIGURATION_KEYS.environment,
      CONFIGURATION_KEYS.appName,
      CONFIGURATION_KEYS.appVersion,
      CONFIGURATION_KEYS.runtimeMode,
      CONFIGURATION_KEYS.debugEnabled
    ] as const) {
      if (values[key] === undefined)
        issues.push(
          createError(
            "CONFIGURATION_REQUIRED_VALUE_MISSING",
            `Required configuration value is missing: ${key}.`,
            key
          )
        );
    }
    return freezeResult(issues);
  }

  validateNumber(value: unknown, key = "value"): ConfigurationValidationResult {
    return freezeResult(
      typeof value === "number" && Number.isFinite(value)
        ? []
        : [createError("CONFIGURATION_NUMBER_INVALID", `${key} must be a finite number.`, key)]
    );
  }
}

function createError(code: string, message: string, key?: string): ConfigurationValidationIssue {
  return Object.freeze({ code, message, key, severity: "error" });
}
function freezeResult(
  issues: readonly ConfigurationValidationIssue[]
): ConfigurationValidationResult {
  const frozenIssues = Object.freeze(issues.map((issue) => Object.freeze({ ...issue })));
  return Object.freeze({ valid: frozenIssues.length === 0, issues: frozenIssues });
}
