import type {
  ConfigurationQuery,
  ConfigurationSnapshot,
  IConfigurationProvider
} from "@veltryx/contracts";
import { ConfigurationProvider } from "./core/configuration/configuration-provider.js";

/** @deprecated Prefer ConfigurationProvider with immutable sources. */
export class InMemoryConfigurationProvider implements IConfigurationProvider {
  private readonly values = new Map<string, unknown>();
  set<TValue>(key: string, value: TValue): void {
    this.values.set(key, value);
  }
  get<TValue>(query: ConfigurationQuery): Promise<TValue | undefined>;
  get(key: string): unknown;
  get<TValue>(keyOrQuery: string | ConfigurationQuery): unknown {
    const key = typeof keyOrQuery === "string" ? keyOrQuery : keyOrQuery.key;
    const value = this.values.get(key);
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
    return this.values.has(key);
  }
  snapshot(): ConfigurationSnapshot {
    return new ConfigurationProvider({ overrides: Object.fromEntries(this.values) }).snapshot();
  }
}
