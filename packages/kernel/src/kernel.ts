import type {
  EventMetadata,
  IExecutionContext,
  IConfigurationProvider,
  IDependencyInjectionContainer,
  IEventBus,
  IKernelStatusService,
  IMetadataEngine,
  IMetadataRegistry,
  IModuleLoader,
  IRuntime,
  IRuntimeBootstrapService,
  IServiceRegistry,
  IStructuralEventPublisher
} from "@veltryx/contracts";

import { CONFIGURATION_KEYS, ConfigurationProvider } from "./core/configuration/index.js";
import {
  KERNEL_STRUCTURAL_EVENTS,
  KernelStructuralEventPublisher,
  normalizeStructuralEventError
} from "./core/events/index.js";
import { KernelStatusService } from "./core/status/index.js";
import { InMemoryEventBus } from "./event-bus.js";
import { createExecutionContext } from "./execution-context.js";
import { KernelExecutionContextFactory } from "./core/execution-context/index.js";
import { InMemoryMetadataRegistry } from "./metadata-registry.js";
import { KernelModuleLoader } from "./module-loader.js";
import { KernelRuntime } from "./runtime.js";
import { KernelServiceRegistry } from "./service-registry.js";
import { KERNEL_SERVICE_TOKENS } from "./core/services/index.js";
import { DependencyInjectionContainer } from "./core/di/index.js";
import { RuntimeBootstrapService } from "./core/runtime/index.js";

export type KernelState = "created" | "bootstrapped" | "initialized" | "ready";

export interface VeltryxKernelDependencies {
  readonly configuration: IConfigurationProvider;
  readonly events: IEventBus;
  readonly modules: IModuleLoader;
  readonly services: IServiceRegistry;
  readonly metadata: IMetadataRegistry;
  readonly runtime: IRuntime;
  readonly container?: IDependencyInjectionContainer;
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
  private readonly dependencyContainer: IDependencyInjectionContainer;
  private runtimeBootstrapService: IRuntimeBootstrapService | undefined;

  constructor(
    private readonly dependencies: VeltryxKernelDependencies = createKernelDependencies()
  ) {
    this.structuralEvents =
      dependencies.structuralEvents ?? new KernelStructuralEventPublisher(dependencies.events);
    this.dependencyContainer =
      dependencies.container ?? new DependencyInjectionContainer(dependencies.services);
  }

  async bootstrap(context: IExecutionContext): Promise<void> {
    const startedAt = new Date();
    const environment =
      this.dependencies.configuration.getString(CONFIGURATION_KEYS.environment) ?? "development";
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
    if (!this.dependencyContainer.has(KERNEL_SERVICE_TOKENS.runtimeBootstrap)) {
      await this.dependencies.runtime.bootstrap(context);
      this.currentState = "initialized";
      return;
    }
    this.runtimeBootstrapService = await this.dependencyContainer.resolve<IRuntimeBootstrapService>(
      KERNEL_SERVICE_TOKENS.runtimeBootstrap
    );
    const structuralResult = await this.runtimeBootstrapService.bootstrap(context.snapshot());
    if (!structuralResult.success) throw new Error("Runtime structural bootstrap failed");
    const runtimeContext = this.runtimeBootstrapService.context();
    const runtimeSnapshot = this.runtimeBootstrapService.snapshot();
    if (this.dependencies.runtime instanceof KernelRuntime && runtimeContext && runtimeSnapshot)
      this.dependencies.runtime.attachReadModel(runtimeContext, runtimeSnapshot);
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

  metadata(): IMetadataEngine {
    return this.dependencies.metadata;
  }

  runtime(): IRuntime {
    return this.dependencies.runtime;
  }

  container(): IDependencyInjectionContainer {
    return this.dependencyContainer;
  }

  runtimeBootstrap(): IRuntimeBootstrapService | undefined {
    return this.runtimeBootstrapService;
  }

  configuration(): IConfigurationProvider {
    return this.dependencies.configuration;
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
      includeTechnicalDetails: options.includeTechnicalDetails,
      runtimeBootstrapStatus: () => this.runtimeBootstrapService?.status().status
    });
  }
}

export function createKernelDependencies(): VeltryxKernelDependencies {
  const configuration = new ConfigurationProvider();
  const events = new InMemoryEventBus();
  const structuralEvents = new KernelStructuralEventPublisher(events);
  const modules = new KernelModuleLoader(undefined, structuralEvents);
  const services = new KernelServiceRegistry();
  const metadata = new InMemoryMetadataRegistry();
  const runtime = new KernelRuntime();
  const container = new DependencyInjectionContainer(services);
  const executionContextFactory = new KernelExecutionContextFactory();
  const version = configuration.getString(CONFIGURATION_KEYS.appVersion) ?? "0.1.0";

  registerStructuralService(
    services,
    KERNEL_SERVICE_TOKENS.configuration,
    configuration,
    "Configuration Provider",
    "configuration",
    version
  );
  registerStructuralService(
    services,
    KERNEL_SERVICE_TOKENS.serviceRegistry,
    services,
    "Service Registry",
    "system",
    version
  );
  registerStructuralService(
    services,
    KERNEL_SERVICE_TOKENS.dependencyInjection,
    container,
    "Dependency Injection Container",
    "system",
    version
  );

  container.registerProvider({
    token: KERNEL_SERVICE_TOKENS.configuration,
    kind: "value",
    lifecycle: "singleton",
    useValue: configuration
  });
  container.registerProvider({
    token: KERNEL_SERVICE_TOKENS.eventBus,
    kind: "value",
    lifecycle: "singleton",
    useValue: events
  });
  container.registerProvider({
    token: KERNEL_SERVICE_TOKENS.moduleSystem,
    kind: "value",
    lifecycle: "singleton",
    useValue: modules
  });
  container.registerProvider({
    token: KERNEL_SERVICE_TOKENS.serviceRegistry,
    kind: "value",
    lifecycle: "singleton",
    useValue: services
  });
  container.registerProvider({
    token: KERNEL_SERVICE_TOKENS.metadataRegistry,
    kind: "value",
    lifecycle: "singleton",
    useValue: metadata
  });
  container.registerProvider({
    token: KERNEL_SERVICE_TOKENS.metadataEngine,
    kind: "value",
    lifecycle: "singleton",
    useValue: metadata
  });
  container.registerProvider({
    token: KERNEL_SERVICE_TOKENS.runtime,
    kind: "value",
    lifecycle: "singleton",
    useValue: runtime
  });
  container.registerProvider({
    token: KERNEL_SERVICE_TOKENS.dependencyInjection,
    kind: "value",
    lifecycle: "singleton",
    useValue: container
  });
  container.registerProvider({
    token: KERNEL_SERVICE_TOKENS.runtimeBootstrap,
    kind: "factory",
    lifecycle: "singleton",
    dependencies: [
      KERNEL_SERVICE_TOKENS.configuration,
      KERNEL_SERVICE_TOKENS.serviceRegistry,
      KERNEL_SERVICE_TOKENS.moduleSystem,
      KERNEL_SERVICE_TOKENS.dependencyInjection,
      KERNEL_SERVICE_TOKENS.metadataEngine
    ],
    useFactory: (resolvedConfiguration, resolvedServices, resolvedModules, resolvedContainer, resolvedMetadata) =>
      new RuntimeBootstrapService({
        configuration: resolvedConfiguration as IConfigurationProvider,
        services: resolvedServices as IServiceRegistry,
        modules: resolvedModules as IModuleLoader,
        dependencyInjection: resolvedContainer as IDependencyInjectionContainer,
        metadata: resolvedMetadata as IMetadataEngine
      }),
    descriptor: {
      name: "Runtime Bootstrap",
      category: "runtime",
      lifecycle: "available",
      scope: "singleton",
      status: "ok",
      source: "kernel",
      version,
      tags: ["kernel", "structural"]
    }
  });
  registerStructuralService(
    services,
    KERNEL_SERVICE_TOKENS.eventBus,
    events,
    "Event Bus",
    "events",
    version
  );
  registerStructuralService(
    services,
    KERNEL_SERVICE_TOKENS.moduleSystem,
    modules,
    "Module System",
    "modules",
    version
  );
  registerStructuralService(
    services,
    KERNEL_SERVICE_TOKENS.executionContextFactory,
    executionContextFactory,
    "Execution Context Factory",
    "execution",
    version
  );
  registerStructuralService(
    services,
    KERNEL_SERVICE_TOKENS.metadataRegistry,
    metadata,
    "Metadata Registry",
    "metadata",
    version
  );
  registerStructuralService(
    services,
    KERNEL_SERVICE_TOKENS.metadataEngine,
    metadata,
    "Metadata Engine",
    "metadata",
    version
  );
  registerStructuralService(
    services,
    KERNEL_SERVICE_TOKENS.runtime,
    runtime,
    "Runtime",
    "runtime",
    version
  );

  return {
    configuration,
    events,
    modules,
    services,
    metadata,
    runtime,
    container,
    structuralEvents
  };
}

function registerStructuralService(
  registry: KernelServiceRegistry,
  id: string,
  service: unknown,
  name: string,
  category:
    "configuration" | "events" | "modules" | "execution" | "metadata" | "runtime" | "system",
  version: string
): void {
  void registry.register(id, service, {
    name,
    category,
    lifecycle: "available",
    scope: "global",
    status: "ok",
    source: "kernel",
    version,
    tags: Object.freeze(["kernel", "structural"])
  });
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

function createKernelEventMetadata(
  contextSnapshot: ReturnType<IExecutionContext["snapshot"]>
): EventMetadata {
  return {
    source: "kernel",
    correlationId: contextSnapshot.correlationId,
    tenantId: contextSnapshot.tenantContext.tenantId,
    workspaceId: contextSnapshot.workspaceContext?.workspaceId,
    tags: ["kernel", "structural"]
  };
}

