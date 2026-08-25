import {
  type ConfigurationKey,
  type ConfigurationQuery,
  type ConfigurationSnapshot,
  type IConfigurationProvider,
  type IConfigurationResolver,
  type IConfigurationSource
} from "@veltryx/contracts";
import { ConfigurationResolver } from "./configuration-resolver.js";
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
  private readonly resolution;
  private readonly now: () => Date;
  constructor(options: ConfigurationProviderOptions = {}) {
    const sources = options.sources ?? [
      new DefaultConfigurationSource(),
      new EnvironmentConfigurationSource(options.environment),
      new InMemoryConfigurationSource(options.overrides)
    ];
    this.resolution = (options.resolver ?? new ConfigurationResolver()).resolve(sources);
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
}
export function createDefaultConfigurationProvider(
  options: ConfigurationProviderOptions = {}
): ConfigurationProvider {
  return new ConfigurationProvider(options);
}
