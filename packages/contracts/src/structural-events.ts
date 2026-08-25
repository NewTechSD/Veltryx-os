import type { ExecutionContextSnapshot } from "./context.js";
import type { EventDispatchResult, EventMetadata, EventType } from "./events.js";

export type KernelStructuralEventName =
  | "kernel.bootstrap.started"
  | "kernel.bootstrap.completed"
  | "kernel.bootstrap.failed"
  | "kernel.ready";

export type ModuleSystemStructuralEventName =
  | "module.discovery.started"
  | "module.discovery.completed"
  | "module.discovery.failed"
  | "module.resolution.started"
  | "module.resolution.completed"
  | "module.resolution.failed"
  | "module.loading.started"
  | "module.loading.completed"
  | "module.loading.failed";

export type StructuralEventName = KernelStructuralEventName | ModuleSystemStructuralEventName;

export interface StructuralEventErrorPayload {
  readonly name: string;
  readonly message: string;
}

export interface KernelBootstrapStartedPayload {
  readonly environment: string;
  readonly startedAt: string;
}

export interface KernelBootstrapCompletedPayload {
  readonly environment: string;
  readonly completedAt: string;
  readonly servicesRegistered: number;
}

export interface KernelBootstrapFailedPayload {
  readonly environment: string;
  readonly failedAt: string;
  readonly error: StructuralEventErrorPayload;
}

export interface KernelReadyPayload {
  readonly readyAt: string;
  readonly bootTimestamp: string;
}

export interface ModuleDiscoveryStartedPayload {
  readonly candidatesCount: number;
  readonly startedAt: string;
}

export interface ModuleDiscoveryCompletedPayload {
  readonly candidatesCount: number;
  readonly validModules: number;
  readonly invalidModules: number;
  readonly duplicatedModules: number;
  readonly completedAt: string;
}

export interface ModuleDiscoveryFailedPayload {
  readonly failedAt: string;
  readonly error: StructuralEventErrorPayload;
}

export interface ModuleResolutionStartedPayload {
  readonly modulesCount: number;
  readonly startedAt: string;
}

export interface ModuleResolutionCompletedPayload {
  readonly modulesCount: number;
  readonly resolvedModules: number;
  readonly missingDependencies: number;
  readonly cyclesDetected: number;
  readonly completedAt: string;
}

export interface ModuleResolutionFailedPayload {
  readonly failedAt: string;
  readonly error: StructuralEventErrorPayload;
}

export interface ModuleLoadingStartedPayload {
  readonly modulesCount: number;
  readonly startedAt: string;
}

export interface ModuleLoadingCompletedPayload {
  readonly modulesCount: number;
  readonly loadedModules: number;
  readonly rejectedModules: number;
  readonly completedAt: string;
}

export interface ModuleLoadingFailedPayload {
  readonly failedAt: string;
  readonly error: StructuralEventErrorPayload;
}

export type KernelStructuralEventPayload =
  | KernelBootstrapStartedPayload
  | KernelBootstrapCompletedPayload
  | KernelBootstrapFailedPayload
  | KernelReadyPayload;

export type ModuleSystemStructuralEventPayload =
  | ModuleDiscoveryStartedPayload
  | ModuleDiscoveryCompletedPayload
  | ModuleDiscoveryFailedPayload
  | ModuleResolutionStartedPayload
  | ModuleResolutionCompletedPayload
  | ModuleResolutionFailedPayload
  | ModuleLoadingStartedPayload
  | ModuleLoadingCompletedPayload
  | ModuleLoadingFailedPayload;

export type StructuralEventPayload = KernelStructuralEventPayload | ModuleSystemStructuralEventPayload;

export interface StructuralEventPublishInput<TPayload extends StructuralEventPayload = StructuralEventPayload> {
  readonly eventName: StructuralEventName;
  readonly eventType: EventType;
  readonly payload: TPayload;
  readonly metadata: EventMetadata;
  readonly contextSnapshot?: ExecutionContextSnapshot;
  readonly occurredAt?: Date;
}

export interface IStructuralEventPublisher {
  publish<TPayload extends StructuralEventPayload>(
    event: StructuralEventPublishInput<TPayload>
  ): Promise<EventDispatchResult | undefined>;
}

