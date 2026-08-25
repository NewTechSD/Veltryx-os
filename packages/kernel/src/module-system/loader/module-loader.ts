import type {
  IModuleLoadingService,
  IModuleRegistry,
  IModuleStateValidator,
  IStructuralEventPublisher,
  LoadedModule,
  ModuleDependencyResolutionResult,
  ModuleDescriptor,
  ModuleLifecycleState,
  ModuleLoadingIgnoredEntry,
  ModuleLoadingRejectedEntry,
  ModuleLoadingResult,
  ModuleLoadingState
} from "@veltryx/contracts";

import {
  MODULE_SYSTEM_STRUCTURAL_EVENTS,
  normalizeStructuralEventError,
  publishStructuralEvent
} from "../../core/events/index.js";
import { KernelLoadedModule } from "./loaded-module.js";
import { createKernelModuleLoadingResult } from "./loading-result.js";
import { KernelModuleRegistry } from "./module-registry.js";
import { KernelModuleStateValidator } from "./module-state.js";

const MODULE_LOADING_METADATA = { source: "module-system", tags: ["module", "loading", "structural"] } as const;

export class KernelResolvedModuleLoader implements IModuleLoadingService {
  constructor(
    private readonly registry: IModuleRegistry = new KernelModuleRegistry(),
    private readonly stateValidator: IModuleStateValidator = new KernelModuleStateValidator(),
    private readonly now: () => Date = () => new Date(),
    private readonly structuralEvents?: IStructuralEventPublisher
  ) {}

  load(resolution: ModuleDependencyResolutionResult): ModuleLoadingResult {
    const startedAt = new Date();
    publishStructuralEvent(this.structuralEvents, {
      eventName: MODULE_SYSTEM_STRUCTURAL_EVENTS.loadingStarted,
      eventType: "module",
      payload: {
        modulesCount: resolution.order.length,
        startedAt: startedAt.toISOString()
      },
      metadata: MODULE_LOADING_METADATA,
      occurredAt: startedAt
    });

    try {
      const result = this.loadResolvedModules(resolution);
      const completedAt = new Date();
      publishStructuralEvent(this.structuralEvents, {
        eventName: MODULE_SYSTEM_STRUCTURAL_EVENTS.loadingCompleted,
        eventType: "module",
        payload: {
          modulesCount: resolution.order.length,
          loadedModules: result.loaded.length,
          rejectedModules: result.rejected.length,
          completedAt: completedAt.toISOString()
        },
        metadata: MODULE_LOADING_METADATA,
        occurredAt: completedAt
      });

      return result;
    } catch (error) {
      const failedAt = new Date();
      publishStructuralEvent(this.structuralEvents, {
        eventName: MODULE_SYSTEM_STRUCTURAL_EVENTS.loadingFailed,
        eventType: "module",
        payload: {
          failedAt: failedAt.toISOString(),
          error: normalizeStructuralEventError(error)
        },
        metadata: MODULE_LOADING_METADATA,
        occurredAt: failedAt
      });

      throw error;
    }
  }

  getRegistry(): IModuleRegistry {
    return this.registry;
  }

  private loadResolvedModules(resolution: ModuleDependencyResolutionResult): ModuleLoadingResult {
    const loaded: LoadedModule[] = [];
    const ignored: ModuleLoadingIgnoredEntry[] = [];
    const rejected: ModuleLoadingRejectedEntry[] = [];
    const duplicated: ModuleLoadingRejectedEntry[] = [];
    const requested = resolution.order.length;

    if (!resolution.valid) {
      for (const descriptor of resolution.order) {
        rejected.push({
          descriptor,
          reason: "invalid-resolution",
          message: `module resolution is invalid: ${descriptor.manifest.id}`
        });
      }

      return createKernelModuleLoadingResult({
        requested,
        loaded,
        ignored,
        rejected,
        duplicated,
        errors: resolution.errors
      });
    }

    for (const descriptor of resolution.order) {
      const descriptorIssue = validateDescriptor(descriptor);

      if (descriptorIssue) {
        rejected.push({
          descriptor,
          reason: "invalid-descriptor",
          message: descriptorIssue
        });
        continue;
      }

      if (!this.stateValidator.isAllowed(descriptor.state)) {
        rejected.push({
          descriptor,
          reason: "invalid-state",
          message: `module state cannot be loaded in this phase: ${descriptor.manifest.id} is ${descriptor.state}`
        });
        continue;
      }

      if (descriptor.state === "loaded") {
        rejected.push({
          descriptor,
          reason: "invalid-state",
          message: `module is already marked as loaded: ${descriptor.manifest.id}`
        });
        continue;
      }

      if (this.registry.has(descriptor.manifest.id)) {
        const duplicate = {
          descriptor,
          reason: "duplicate" as const,
          message: `module already loaded: ${descriptor.manifest.id}`
        };
        rejected.push(duplicate);
        duplicated.push(duplicate);
        ignored.push({
          descriptor,
          reason: "duplicate",
          message: `module ignored because it is already loaded: ${descriptor.manifest.id}`
        });
        continue;
      }

      const resolvedState = advanceToResolved(descriptor.state, this.stateValidator);
      this.stateValidator.transition(resolvedState, "loaded");
      const loadedModule = new KernelLoadedModule(
        { ...descriptor, state: "loaded" as ModuleLifecycleState },
        this.now()
      );

      this.registry.register(loadedModule);
      loaded.push(loadedModule);
    }

    return createKernelModuleLoadingResult({ requested, loaded, ignored, rejected, duplicated });
  }
}

function advanceToResolved(
  state: ModuleLoadingState,
  stateValidator: IModuleStateValidator
): ModuleLoadingState {
  if (state === "discovered") {
    stateValidator.transition("discovered", "validated");
    stateValidator.transition("validated", "resolved");
    return "resolved";
  }

  if (state === "validated") {
    stateValidator.transition("validated", "resolved");
    return "resolved";
  }

  return state;
}

function validateDescriptor(descriptor: ModuleDescriptor): string | undefined {
  if (!isNonEmptyString(descriptor.manifest.id)) {
    return "loaded module descriptor requires a non-empty manifest id";
  }

  if (!isNonEmptyString(descriptor.manifest.name)) {
    return `loaded module descriptor requires a non-empty manifest name: ${descriptor.manifest.id}`;
  }

  if (!isNonEmptyString(descriptor.manifest.version)) {
    return `loaded module descriptor requires a non-empty manifest version: ${descriptor.manifest.id}`;
  }

  return undefined;
}

function isNonEmptyString(candidate: unknown): candidate is string {
  return typeof candidate === "string" && candidate.trim().length > 0;
}
