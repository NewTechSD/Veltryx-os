import type { IExecutionContext } from "./context.js";

export type ServiceScope = "global" | "tenant" | "workspace" | "request" | "transient";

export interface ServiceToken {
  readonly id: string;
  readonly version: string;
  readonly owner: string;
  readonly scope: ServiceScope;
  readonly description?: string;
}

export interface ServiceProvider<TService = unknown> {
  readonly token: ServiceToken;
  readonly resolve: (context?: IExecutionContext) => Promise<TService> | TService;
}

export interface IServiceRegistry {
  register<TService>(provider: ServiceProvider<TService>): Promise<void>;
  resolve<TService>(token: ServiceToken, context?: IExecutionContext): Promise<TService>;
  has(tokenId: string): boolean;
  list(): readonly ServiceToken[];
}

