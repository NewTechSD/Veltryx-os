import type { ConfigurationValues, IConfigurationSource } from "@veltryx/contracts";

export class InMemoryConfigurationSource implements IConfigurationSource {
  readonly name = "in-memory";
  readonly type = "in-memory" as const;
  private readonly values: Readonly<Record<string, unknown>>;

  constructor(values: Readonly<Record<string, unknown>> = {}) {
    this.values = Object.freeze({ ...values });
  }

  load(): ConfigurationValues {
    return Object.freeze({ ...this.values }) as ConfigurationValues;
  }
}
