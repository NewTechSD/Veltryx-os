import type { IExecutionContext } from "./context.js";

export type RuntimeState = "created" | "bootstrapped" | "initialized" | "ready" | "running" | "reloading" | "stopping" | "disposed";

export interface RuntimeBootstrapResult {
  readonly state: RuntimeState;
  readonly message: string;
  readonly session: RuntimeSession;
}

export interface RuntimeSession {
  readonly id: string;
  readonly state: RuntimeState;
  readonly context: IExecutionContext;
  readonly startedAt: Date;
}

export interface IRuntime {
  bootstrap(context: IExecutionContext): Promise<RuntimeBootstrapResult>;
  session(): RuntimeSession | undefined;
  state(): RuntimeState;
}
