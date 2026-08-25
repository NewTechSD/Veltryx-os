import {
  CONFIGURATION_KEYS,
  type ConfigurationValues,
  type IConfigurationSource
} from "@veltryx/contracts";

export class DefaultConfigurationSource implements IConfigurationSource {
  readonly name = "defaults";
  readonly type = "default" as const;
  load(): ConfigurationValues {
    return Object.freeze({
      [CONFIGURATION_KEYS.appName]: "Veltryx OS",
      [CONFIGURATION_KEYS.appVersion]: "0.1.0",
      [CONFIGURATION_KEYS.environment]: "development",
      [CONFIGURATION_KEYS.runtimeMode]: "preview",
      [CONFIGURATION_KEYS.debugEnabled]: false,
      [CONFIGURATION_KEYS.kernelStatusEnabled]: true,
      [CONFIGURATION_KEYS.structuralEventsEnabled]: true,
      [CONFIGURATION_KEYS.moduleSnapshotEnabled]: true
    });
  }
}
