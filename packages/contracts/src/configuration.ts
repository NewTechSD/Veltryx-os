export type ConfigurationScope = "global" | "environment" | "tenant" | "workspace" | "module" | "plugin" | "user";

export interface ConfigurationQuery {
  readonly key: string;
  readonly scope: ConfigurationScope;
  readonly context?: IExecutionContext;
}

export interface IConfigurationProvider {
  get<TValue>(query: ConfigurationQuery): Promise<TValue | undefined>;
}

import type { IExecutionContext } from "./context.js";

