import type { IModuleStateValidator, ModuleLifecycleState, ModuleLoadingState } from "@veltryx/contracts";

const ALLOWED_STATES: readonly ModuleLoadingState[] = [
  "discovered",
  "validated",
  "resolved",
  "loaded"
];

const TRANSITIONS: Readonly<Record<ModuleLoadingState, readonly ModuleLoadingState[]>> = {
  discovered: ["validated"],
  validated: ["resolved"],
  resolved: ["loaded"],
  loaded: []
};

export class KernelModuleStateValidator implements IModuleStateValidator {
  canTransition(from: ModuleLoadingState, to: ModuleLoadingState): boolean {
    return TRANSITIONS[from].includes(to);
  }

  transition(from: ModuleLoadingState, to: ModuleLoadingState): ModuleLoadingState {
    if (!this.canTransition(from, to)) {
      throw new Error(`Invalid module state transition: ${from} -> ${to}`);
    }

    return to;
  }

  isAllowed(state: ModuleLifecycleState): state is ModuleLoadingState {
    return ALLOWED_STATES.includes(state as ModuleLoadingState);
  }
}