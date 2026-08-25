import type { ConfigurationQuery, IConfigurationProvider } from "@veltryx/contracts";

export class InMemoryConfigurationProvider implements IConfigurationProvider {
  private readonly values = new Map<string, unknown>();

  set<TValue>(key: string, value: TValue): void {
    this.values.set(key, value);
  }

  async get<TValue>(query: ConfigurationQuery): Promise<TValue | undefined> {
    return this.values.get(query.key) as TValue | undefined;
  }
}

