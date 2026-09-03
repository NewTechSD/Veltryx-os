import {
  type ConfigurationKey,
  type ConfigurationQuery,
  type ConfigurationResolutionResult,
  type ConfigurationSnapshot,
  type ConfigurationValidationIssue,
  type ConfigurationValidationResult,
  type ConfigurationValues,
  type IConfigurationProvider,
  type IConfigurationResolver,
  type IConfigurationSource
} from "@veltryx/contracts";
import { ConfigurationResolver } from "./configuration-resolver.js";
import { ConfigurationValidator } from "./configuration-validator.js";
import { createConfigurationSnapshot } from "./configuration-snapshot.js";
import { DefaultConfigurationSource } from "./default-configuration-source.js";
import {
  EnvironmentConfigurationSource,
  type EnvironmentRecord
} from "./environment-configuration-source.js";
import { InMemoryConfigurationSource } from "./in-memory-configuration-source.js";

export interface ConfigurationProviderOptions {
  readonly sources?: readonly IConfigurationSource[];
  readonly environment?: EnvironmentRecord;
  readonly overrides?: Readonly<Record<string, unknown>>;
  readonly resolver?: IConfigurationResolver;
  readonly now?: () => Date;
}
export class ConfigurationProvider implements IConfigurationProvider {
  private resolution: ConfigurationResolutionResult;
  private readonly now: () => Date;
  private readonly resolver: IConfigurationResolver;
  private readonly sources: readonly IConfigurationSource[];
  constructor(options: ConfigurationProviderOptions = {}) {
    this.sources = options.sources ?? [
      new DefaultConfigurationSource(),
      new EnvironmentConfigurationSource(options.environment),
      new InMemoryConfigurationSource(options.overrides)
    ];
    this.resolver = options.resolver ?? new ConfigurationResolver();
    this.resolution = this.resolver.resolve(this.sources);
    this.now = options.now ?? (() => new Date());
  }
  get<TValue>(query: ConfigurationQuery): Promise<TValue | undefined>;
  get(key: string): unknown;
  get<TValue>(keyOrQuery: string | ConfigurationQuery): unknown {
    const key = typeof keyOrQuery === "string" ? keyOrQuery : keyOrQuery.key;
    const value = Object.prototype.hasOwnProperty.call(this.resolution.values, key)
      ? this.resolution.values[key as ConfigurationKey]
      : undefined;
    return typeof keyOrQuery === "string" ? value : Promise.resolve(value as TValue | undefined);
  }
  getString(key: string): string | undefined {
    const value = this.get(key);
    return typeof value === "string" ? value : undefined;
  }
  getBoolean(key: string): boolean | undefined {
    const value = this.get(key);
    return typeof value === "boolean" ? value : undefined;
  }
  getNumber(key: string): number | undefined {
    const value = this.get(key);
    return typeof value === "number" ? value : undefined;
  }
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }
  snapshot(): ConfigurationSnapshot {
    return createConfigurationSnapshot(this.resolution, this.now());
  }
  applyPersistenceOverrides(
    values: ConfigurationValues,
    options: { readonly allowOverride?: boolean } = {}
  ): ConfigurationValidationResult {
    const validator = new ConfigurationValidator();
    const issues: ConfigurationValidationIssue[] = [];
    for (const [key, value] of Object.entries(values)) {
      if (!validator.isKnownKey(key)) {
        issues.push(Object.freeze({ code: "CONFIGURATION_KEY_UNKNOWN", message: `Unknown configuration key: ${key}.`, key, severity: "error" }));
        continue;
      }
      issues.push(...validator.validateValue(key, value).issues);
    }
    if (issues.length) return Object.freeze({ valid: false, issues: Object.freeze(issues) });
    const persistence = new PersistenceConfigurationSource(values);
    const firstNonDefault = this.sources.findIndex((source) => source.type !== "default");
    const insertion = firstNonDefault < 0 ? this.sources.length : firstNonDefault;
    const sources = options.allowOverride
      ? [...this.sources, persistence]
      : [...this.sources.slice(0, insertion), persistence, ...this.sources.slice(insertion)];
    this.resolution = this.resolver.resolve(sources);
    return Object.freeze({ valid: true, issues: Object.freeze([]) });
  }
}

class PersistenceConfigurationSource implements IConfigurationSource {
  readonly name = "persistence";
  readonly type = "persistence" as const;
  constructor(private readonly values: ConfigurationValues) {}
  load(): ConfigurationValues { return Object.freeze({ ...this.values }); }
}

export function createDefaultConfigurationProvider(
  options: ConfigurationProviderOptions = {}
): ConfigurationProvider {
  return new ConfigurationProvider(options);
}
