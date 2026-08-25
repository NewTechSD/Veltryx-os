import {
  CONFIGURATION_KEYS,
  type ConfigurationValues,
  type IConfigurationSource
} from "@veltryx/contracts";

export type EnvironmentRecord = Readonly<Record<string, string | undefined>>;

export class EnvironmentConfigurationSource implements IConfigurationSource {
  readonly name = "environment";
  readonly type = "environment" as const;

  constructor(private readonly environment: EnvironmentRecord = process.env) {}

  load(): ConfigurationValues {
    const values: Partial<Record<string, unknown>> = {};
    assign(
      values,
      CONFIGURATION_KEYS.environment,
      firstDefined(
        this.environment.VELTRYX_ENV,
        this.environment.NEXT_PUBLIC_APP_ENV,
        this.environment.NODE_ENV
      )
    );
    assign(values, CONFIGURATION_KEYS.appName, this.environment.NEXT_PUBLIC_APP_NAME);
    assign(values, CONFIGURATION_KEYS.appVersion, this.environment.NEXT_PUBLIC_APP_VERSION);
    assign(values, CONFIGURATION_KEYS.runtimeMode, this.environment.VELTRYX_RUNTIME_MODE);
    assign(values, CONFIGURATION_KEYS.debugEnabled, parseBoolean(this.environment.VELTRYX_DEBUG));
    return Object.freeze(values) as ConfigurationValues;
  }
}

function assign(target: Partial<Record<string, unknown>>, key: string, value: unknown): void {
  if (value !== undefined) target[key] = value;
}

function firstDefined(...values: readonly (string | undefined)[]): string | undefined {
  return values.find((value) => value !== undefined);
}

function parseBoolean(value: string | undefined): boolean | string | undefined {
  if (value === undefined) return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  return value;
}
