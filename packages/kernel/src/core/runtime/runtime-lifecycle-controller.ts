import type { IRuntimeLifecycleController, RuntimeLifecycleStatus } from "@veltryx/contracts";

const TRANSITIONS: Readonly<Record<RuntimeLifecycleStatus, readonly RuntimeLifecycleStatus[]>> = {
  idle: ["bootstrapping", "stopped"],
  bootstrapping: ["ready", "warning", "error"],
  ready: ["bootstrapping", "stopped"],
  warning: ["bootstrapping", "stopped"],
  error: ["bootstrapping", "stopped"],
  stopped: []
};

export class RuntimeLifecycleController implements IRuntimeLifecycleController {
  private current: RuntimeLifecycleStatus = "idle";

  status(): RuntimeLifecycleStatus {
    return this.current;
  }

  transition(next: RuntimeLifecycleStatus): RuntimeLifecycleStatus {
    if (!TRANSITIONS[this.current].includes(next))
      throw new Error(`Invalid Runtime lifecycle transition: ${this.current} -> ${next}`);
    this.current = next;
    return this.current;
  }
}
