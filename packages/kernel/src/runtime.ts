import type {
  IExecutionContext,
  IRuntime,
  RuntimeContext,
  RuntimeBootstrapResult,
  RuntimeSession,
  RuntimeState,
  RuntimeStatusSnapshot,
  RuntimeLifecycleStatus
} from "@veltryx/contracts";

export class KernelRuntime implements IRuntime {
  private currentState: RuntimeState = "created";
  private currentSession: RuntimeSession | undefined;
  private readContext: RuntimeContext | undefined;
  private readSnapshot: RuntimeStatusSnapshot | undefined;

  async bootstrap(context: IExecutionContext): Promise<RuntimeBootstrapResult> {
    if (!context.requestId || !context.correlationId) {
      throw new Error("Runtime bootstrap requires requestId and correlationId");
    }

    this.currentState = "bootstrapped";
    this.currentState = "initialized";
    this.currentState = "ready";
    this.currentSession = {
      id: context.correlationId,
      state: this.currentState,
      context,
      startedAt: new Date()
    };

    return {
      state: this.currentState,
      message: "Runtime Ready",
      session: this.currentSession
    };
  }

  session(): RuntimeSession | undefined {
    return this.currentSession;
  }

  state(): RuntimeState {
    return this.currentState;
  }

  context(): RuntimeContext | undefined {
    return this.readContext;
  }
  snapshot(): RuntimeStatusSnapshot | undefined {
    return this.readSnapshot;
  }
  status(): RuntimeLifecycleStatus {
    return this.readSnapshot?.status ?? "idle";
  }
  attachReadModel(context: RuntimeContext, snapshot: RuntimeStatusSnapshot): void {
    this.readContext = context;
    this.readSnapshot = snapshot;
  }
}
