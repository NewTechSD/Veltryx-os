import type {
  EventMetadata,
  IExecutionContext,
  IConfigurationProvider,
  IEventBus,
  IKernelStatusService,
  IMetadataRegistry,
  IModuleLoader,
  IRuntime,
  IServiceRegistry,
  IStructuralEventPublisher
} from "@veltryx/contracts";

import { InMemoryConfigurationProvider } from "./configuration-provider.js";
import {
  KERNEL_STRUCTURAL_EVENTS,
  KernelStructuralEventPublisher,
  normalizeStructuralEventError
} from "./core/events/index.js";
import { KernelStatusService } from "./core/status/index.js";
import { InMemoryEventBus } from "./event-bus.js";
import { createExecutionContext } from "./execution-context.js";
import { InMemoryMetadataRegistry } from "./metadata-registry.js";
import { KernelModuleLoader } from "./module-loader.js";
import { KernelRuntime } from "./runtime.js";
import { KernelServiceRegistry } from "./service-registry.js";

export type KernelState = "created" | "bootstrapped" | "initialized" | "ready";

export interface VeltryxKernelDependencies {
  readonly configuration: IConfigurationProvider;
  readonly events: IEventBus;
  readonly modules: IModuleLoader;
  readonly services: IServiceRegistry;
  readonly metadata: IMetadataRegistry;
  readonly runtime: IRuntime;
  readonly structuralEvents?: IStructuralEventPublisher;
}

export interface KernelReadyResult {
  readonly state: KernelState;
  readonly message: "Kernel Ready";
}

export interface KernelStatusOptions {
  readonly environment?: string;
  readonly includeTechnicalDetails?: boolean;
}

export class VeltryxKernel {
  private currentState: KernelState = "created";
  private bootedAt: Date | undefined;
  private readonly structuralEvents: IStructuralEventPublisher;

  constructor(private readonly dependencies: VeltryxKernelDependencies = createKernelDependencies()) {
    this.structuralEvents = dependencies.structuralEvents ?? new KernelStructuralEventPublisher(dependencies.events);
  }

  async bootstrap(context: IExecutionContext): Promise<void> {
    const startedAt = new Date();
    const environment = process.env.NODE_ENV ?? "development";
    const contextSnapshot = context.snapshot();

    await this.publishStructuralEvent({
      eventName: KERNEL_STRUCTURAL_EVENTS.bootstrapStarted,
      eventType: "kernel",
      payload: {
        environment,
        startedAt: startedAt.toISOString()
      },
      metadata: createKernelEventMetadata(contextSnapshot),
      contextSnapshot,
      occurredAt: startedAt
    });

    try {
      this.currentState = "bootstrapped";
      this.bootedAt = new Date();

      const completedAt = new Date();
      await this.publishStructuralEvent({
        eventName: KERNEL_STRUCTURAL_EVENTS.bootstrapCompleted,
        eventType: "kernel",
        payload: {
          environment,
          completedAt: completedAt.toISOString(),
          servicesRegistered: this.dependencies.services.list().length
        },
        metadata: createKernelEventMetadata(contextSnapshot),
        contextSnapshot,
        occurredAt: completedAt
      });
    } catch (error) {
      const failedAt = new Date();
      await this.publishStructuralEvent({
        eventName: KERNEL_STRUCTURAL_EVENTS.bootstrapFailed,
        eventType: "kernel",
        payload: {
          environment,
          failedAt: failedAt.toISOString(),
          error: normalizeStructuralEventError(error)
        },
        metadata: createKernelEventMetadata(contextSnapshot),
        contextSnapshot,
        occurredAt: failedAt
      });

      throw error;
    }
  }

  async initialize(context: IExecutionContext): Promise<void> {
    if (this.currentState !== "bootstrapped") {
      throw new Error("Kernel must be bootstrapped before initialize");
    }

    await this.dependencies.modules.discover();
    await this.dependencies.runtime.bootstrap(context);

    this.currentState = "initialized";
  }

  async ready(context: IExecutionContext): Promise<KernelReadyResult> {
    if (this.currentState !== "initialized") {
      throw new Error("Kernel must be initialized before ready");
    }

    this.currentState = "ready";

    const readyAt = new Date();
    await this.publishStructuralEvent({
      eventName: KERNEL_STRUCTURAL_EVENTS.ready,
      eventType: "kernel",
      payload: {
        readyAt: readyAt.toISOString(),
        bootTimestamp: this.bootedAt?.toISOString() ?? "unavailable"
      },
      metadata: createKernelEventMetadata(context.snapshot()),
      contextSnapshot: context.snapshot(),
      occurredAt: readyAt
    });

    return {
      state: this.currentState,
      message: "Kernel Ready"
    };
  }

  state(): KernelState {
    return this.currentState;
  }

  services(): IServiceRegistry {
    return this.dependencies.services;
  }

  modules(): IModuleLoader {
    return this.dependencies.modules;
  }

  metadata(): IMetadataRegistry {
    return this.dependencies.metadata;
  }

  runtime(): IRuntime {
    return this.dependencies.runtime;
  }


  private async publishStructuralEvent(
    event: Parameters<IStructuralEventPublisher["publish"]>[0]
  ): Promise<void> {
    try {
      await this.structuralEvents.publish(event);
    } catch {
      return;
    }
  }
  status(options: KernelStatusOptions = {}): IKernelStatusService {
    return new KernelStatusService(this.dependencies, {
      kernelState: () => this.currentState,
      bootTimestamp: () => this.bootedAt,
      environment: options.environment,
      includeTechnicalDetails: options.includeTechnicalDetails
    });
  }
}

export function createKernelDependencies(): VeltryxKernelDependencies {
  const events = new InMemoryEventBus();
  const structuralEvents = new KernelStructuralEventPublisher(events);

  return {
    configuration: new InMemoryConfigurationProvider(),
    events,
    modules: new KernelModuleLoader(undefined, structuralEvents),
    services: new KernelServiceRegistry(),
    metadata: new InMemoryMetadataRegistry(),
    runtime: new KernelRuntime(),
    structuralEvents
  };
}

export function createBootstrapContext(): IExecutionContext {
  return createExecutionContext({
    tenant: "system",
    roles: ["kernel"],
    permissions: ["kernel.bootstrap"],
    locale: "en-US",
    timezone: "UTC",
    requestId: "kernel-bootstrap",
    correlationId: "kernel-bootstrap"
  });
}

function createKernelEventMetadata(contextSnapshot: ReturnType<IExecutionContext["snapshot"]>): EventMetadata {
  return {
    source: "kernel",
    correlationId: contextSnapshot.correlationId,
    tenantId: contextSnapshot.tenantContext.tenantId,
    workspaceId: contextSnapshot.workspaceContext?.workspaceId,
    tags: ["kernel", "structural"]
  };
}

