import {
  CONFIGURATION_KEYS,
  type ConfigurationResolutionResult,
  type ConfigurationSnapshot,
  type RuntimeMode,
  type VeltryxEnvironment
} from "@veltryx/contracts";

export function createConfigurationSnapshot(
  resolution: ConfigurationResolutionResult,
  generatedAt: Date
): ConfigurationSnapshot {
  return Object.freeze({
    generatedAt: generatedAt.toISOString(),
    environment: resolution.values[CONFIGURATION_KEYS.environment] as VeltryxEnvironment,
    appName: resolution.values[CONFIGURATION_KEYS.appName] as string,
    appVersion: resolution.values[CONFIGURATION_KEYS.appVersion] as string,
    runtimeMode: resolution.values[CONFIGURATION_KEYS.runtimeMode] as RuntimeMode,
    debugEnabled: resolution.values[CONFIGURATION_KEYS.debugEnabled] as boolean,
    sources: Object.freeze(
      resolution.sources.map((source) =>
        Object.freeze({ ...source, loadedKeys: Object.freeze([...source.loadedKeys]) })
      )
    ),
    warnings: Object.freeze(resolution.warnings.map((warning) => Object.freeze({ ...warning }))),
    errors: Object.freeze(resolution.errors.map((error) => Object.freeze({ ...error }))),
    diagnostics: Object.freeze(resolution.diagnostics.map((entry) => Object.freeze({ ...entry })))
  });
}
