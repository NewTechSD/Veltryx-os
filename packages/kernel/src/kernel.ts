import type {
  EventMetadata,
  IComponentRegistry,
  IComponentPersistenceService,
  IConfigurationProvider,
  IConfigurationPersistenceService,
  IDependencyInjectionContainer,
  IEventBus,
  IExecutionContext,
  IKernelStatusService,
  IMetadataEngine,
  IMetadataPersistenceService,
  IMetadataRegistry,
  IPersistenceService,
  IModuleLoader,
  IRuntime,
  IRuntimeBootstrapService,
  IRuntimeApiBridge,
  IAuthBridge,
  ISnapshotRetentionAuditService,
  IServiceRegistry,
  IStructuralEventPublisher,
  IUICompositionPersistenceService,
  IUICompositionRuntime
} from "@veltryx/contracts";

import { CONFIGURATION_KEYS, ConfigurationPersistenceService, ConfigurationProvider } from "./core/configuration/index.js";
import { DependencyInjectionContainer } from "./core/di/index.js";
import {
  KERNEL_STRUCTURAL_EVENTS,
  KernelStructuralEventPublisher,
  normalizeStructuralEventError
} from "./core/events/index.js";
import { RuntimeBootstrapService } from "./core/runtime/index.js";
import { KERNEL_SERVICE_TOKENS } from "./core/services/index.js";
import { KernelStatusService } from "./core/status/index.js";
import { ComponentPersistenceService, ComponentRegistry, registerSystemComponents } from "./core/components/index.js";
import { SnapshotRetentionAuditService, UICompositionPersistenceService, UICompositionRuntime } from "./core/ui-composition/index.js";
import { InMemoryPersistenceProvider, PersistenceService } from "./core/persistence/index.js";
import { MetadataPersistenceService } from "./core/metadata/persistence/index.js";
import { RuntimeApiBridge } from "./core/api/index.js";
import { AuthBridge } from "./core/auth/index.js";
import { InMemoryEventBus } from "./event-bus.js";
import { createExecutionContext } from "./execution-context.js";
import { KernelExecutionContextFactory } from "./core/execution-context/index.js";
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
  readonly components: IComponentRegistry;
  readonly uiComposition: IUICompositionRuntime;
  readonly persistence?: IPersistenceService;
  readonly metadataPersistence?: IMetadataPersistenceService;
  readonly configurationPersistence?: IConfigurationPersistenceService;
  readonly componentPersistence?: IComponentPersistenceService;
  readonly uiCompositionPersistence?: IUICompositionPersistenceService;
  readonly snapshotRetentionAudit?: ISnapshotRetentionAuditService;
  readonly auth?: IAuthBridge;
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
  private readonly persistenceService: IPersistenceService;
  private readonly metadataPersistenceService: IMetadataPersistenceService;
  private readonly configurationPersistenceService: IConfigurationPersistenceService;
  private readonly componentPersistenceService: IComponentPersistenceService;
  private readonly uiCompositionPersistenceService: IUICompositionPersistenceService;
  private readonly snapshotRetentionAuditService: ISnapshotRetentionAuditService;
  private readonly runtimeApiBridge: IRuntimeApiBridge;
  private readonly authBridge: IAuthBridge;

  constructor(
    private readonly dependencies: VeltryxKernelDependencies = createKernelDependencies()
  ) {
    this.structuralEvents =
      dependencies.structuralEvents ?? new KernelStructuralEventPublisher(dependencies.events);
    this.dependencyContainer =
      dependencies.container ?? new DependencyInjectionContainer(dependencies.services);
    this.persistenceService = dependencies.persistence ?? new PersistenceService(new InMemoryPersistenceProvider());
    this.metadataPersistenceService =
      dependencies.metadataPersistence ??
      new MetadataPersistenceService(dependencies.metadata, this.persistenceService);
    this.configurationPersistenceService =
      dependencies.configurationPersistence ??
      new ConfigurationPersistenceService(dependencies.configuration, this.persistenceService);
    this.componentPersistenceService =
      dependencies.componentPersistence ??
      new ComponentPersistenceService(dependencies.components, this.persistenceService);
    this.snapshotRetentionAuditService =
      dependencies.snapshotRetentionAudit ?? new SnapshotRetentionAuditService(this.persistenceService);
    this.authBridge = dependencies.auth ?? new AuthBridge();
    this.uiCompositionPersistenceService =
      dependencies.uiCompositionPersistence ??
      new UICompositionPersistenceService(dependencies.uiComposition, dependencies.metadata, this.persistenceService, undefined, undefined, this.snapshotRetentionAuditService);
    this.runtimeApiBridge = new RuntimeApiBridge(this);
  }

  async bootstrap(context: IExecutionContext): Promise<void> {
    const startedAt = new Date();
    const environment =
      this.dependencies.configuration.getString(CONFIGURATION_KEYS.environment) ?? "development";
    const contextSnapshot = context.snapshot();

    await this.publishStructuralEvent({
      eventName: KERNEL_STRUCTURAL_EVENTS.bootstrapStarted,
      eventType: "kernel",
      payload: { environment, startedAt: startedAt.toISOString() },
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
    if (this.currentState !== "bootstrapped") throw new Error("Kernel must be bootstrapped before initialize");
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
    if (this.currentState !== "initialized") throw new Error("Kernel must be initialized before ready");
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
    return { state: this.currentState, message: "Kernel Ready" };
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

  components(): IComponentRegistry {
    return this.dependencies.components;
  }

  uiComposition(): IUICompositionRuntime {
    return this.dependencies.uiComposition;
  }

  persistence(): IPersistenceService {
    return this.persistenceService;
  }

  metadataPersistence(): IMetadataPersistenceService {
    return this.metadataPersistenceService;
  }

  configurationPersistence(): IConfigurationPersistenceService {
    return this.configurationPersistenceService;
  }

  componentPersistence(): IComponentPersistenceService {
    return this.componentPersistenceService;
  }

  uiCompositionPersistence(): IUICompositionPersistenceService {
    return this.uiCompositionPersistenceService;
  }

  snapshotRetentionAudit(): ISnapshotRetentionAuditService {
    return this.snapshotRetentionAuditService;
  }

  runtimeApi(): IRuntimeApiBridge { return this.runtimeApiBridge; }

  auth(): IAuthBridge { return this.authBridge; }

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

  status(options: KernelStatusOptions = {}): IKernelStatusService {
    return new KernelStatusService(
      {
        ...this.dependencies,
        persistence: this.persistenceService,
        metadataPersistence: this.metadataPersistenceService,
        configurationPersistence: this.configurationPersistenceService,
        componentPersistence: this.componentPersistenceService,
        uiCompositionPersistence: this.uiCompositionPersistenceService,
        snapshotRetentionAudit: this.snapshotRetentionAuditService
        , auth: this.authBridge
      },
      {
        kernelState: () => this.currentState,
        bootTimestamp: () => this.bootedAt,
        environment: options.environment,
        includeTechnicalDetails: options.includeTechnicalDetails,
        runtimeBootstrapStatus: () => this.runtimeBootstrapService?.status().status
      }
    );
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
}

export function createKernelDependencies(): VeltryxKernelDependencies {
  const configuration = new ConfigurationProvider();
  const events = new InMemoryEventBus();
  const structuralEvents = new KernelStructuralEventPublisher(events);
  const modules = new KernelModuleLoader(undefined, structuralEvents);
  const services = new KernelServiceRegistry();
  const metadata = new InMemoryMetadataRegistry();
  const components = new ComponentRegistry();
  registerSystemComponents(components);
  const uiComposition = new UICompositionRuntime(components);
  const persistence = new PersistenceService(new InMemoryPersistenceProvider());
  const metadataPersistence = new MetadataPersistenceService(metadata, persistence);
  const configurationPersistence = new ConfigurationPersistenceService(configuration, persistence);
  const componentPersistence = new ComponentPersistenceService(components, persistence);
  const snapshotRetentionAudit = new SnapshotRetentionAuditService(persistence);
  const uiCompositionPersistence = new UICompositionPersistenceService(uiComposition, metadata, persistence, undefined, undefined, snapshotRetentionAudit);
  const auth = new AuthBridge();
  const runtime = new KernelRuntime();
  const container = new DependencyInjectionContainer(services);
  const executionContextFactory = new KernelExecutionContextFactory();
  const version = configuration.getString(CONFIGURATION_KEYS.appVersion) ?? "0.1.0";

  registerStructuralService(services, KERNEL_SERVICE_TOKENS.configuration, configuration, "Configuration Provider", "configuration", version);
  registerStructuralService(services, KERNEL_SERVICE_TOKENS.serviceRegistry, services, "Service Registry", "system", version);
  registerStructuralService(services, KERNEL_SERVICE_TOKENS.dependencyInjection, container, "Dependency Injection Container", "system", version);
  registerStructuralService(services, KERNEL_SERVICE_TOKENS.runtimeApi, { name: "Runtime API Bridge" }, "Runtime API Bridge", "runtime", version);
  registerStructuralService(services, KERNEL_SERVICE_TOKENS.auth, auth, "Auth Bridge", "system", version);

  container.registerProvider({ token: KERNEL_SERVICE_TOKENS.configuration, kind: "value", lifecycle: "singleton", useValue: configuration });
  container.registerProvider({ token: KERNEL_SERVICE_TOKENS.eventBus, kind: "value", lifecycle: "singleton", useValue: events });
  container.registerProvider({ token: KERNEL_SERVICE_TOKENS.moduleSystem, kind: "value", lifecycle: "singleton", useValue: modules });
  container.registerProvider({ token: KERNEL_SERVICE_TOKENS.serviceRegistry, kind: "value", lifecycle: "singleton", useValue: services });
  container.registerProvider({ token: KERNEL_SERVICE_TOKENS.metadataRegistry, kind: "value", lifecycle: "singleton", useValue: metadata });
  container.registerProvider({ token: KERNEL_SERVICE_TOKENS.metadataEngine, kind: "value", lifecycle: "singleton", useValue: metadata });
  container.registerProvider({ token: KERNEL_SERVICE_TOKENS.componentRegistry, kind: "value", lifecycle: "singleton", useValue: components });
  container.registerProvider({ token: KERNEL_SERVICE_TOKENS.uiCompositionRuntime, kind: "value", lifecycle: "singleton", useValue: uiComposition });
  container.registerProvider({ token: KERNEL_SERVICE_TOKENS.persistence, kind: "value", lifecycle: "singleton", useValue: persistence });
  container.registerProvider({
    token: KERNEL_SERVICE_TOKENS.metadataPersistence,
    kind: "factory",
    lifecycle: "singleton",
    dependencies: [KERNEL_SERVICE_TOKENS.metadataRegistry, KERNEL_SERVICE_TOKENS.persistence],
    useFactory: () => metadataPersistence
  });
  container.registerProvider({ token: KERNEL_SERVICE_TOKENS.runtimeApi, kind: "factory", lifecycle: "singleton", dependencies: [KERNEL_SERVICE_TOKENS.persistence], useFactory: () => new RuntimeApiBridge({
    status: () => new KernelStatusService({ configuration, services, modules, metadata, components, uiComposition, persistence, metadataPersistence, configurationPersistence, componentPersistence, uiCompositionPersistence, snapshotRetentionAudit, runtime }, { kernelState: () => "ready", bootTimestamp: () => undefined, environment: configuration.getString(CONFIGURATION_KEYS.environment), runtimeBootstrapStatus: () => undefined }),
    runtime: () => runtime,
    configuration: () => configuration,
    metadata: () => metadata,
    components: () => components,
    uiComposition: () => uiComposition,
    auth: () => auth
  }) });
  container.registerProvider({ token: KERNEL_SERVICE_TOKENS.auth, kind: "value", lifecycle: "singleton", useValue: auth });
  container.registerProvider({
    token: KERNEL_SERVICE_TOKENS.configurationPersistence,
    kind: "factory",
    lifecycle: "singleton",
    dependencies: [KERNEL_SERVICE_TOKENS.configuration, KERNEL_SERVICE_TOKENS.persistence],
    useFactory: () => configurationPersistence
  });
  container.registerProvider({
    token: KERNEL_SERVICE_TOKENS.componentPersistence,
    kind: "factory",
    lifecycle: "singleton",
    dependencies: [KERNEL_SERVICE_TOKENS.componentRegistry, KERNEL_SERVICE_TOKENS.persistence],
    useFactory: () => componentPersistence
  });
  container.registerProvider({
    token: KERNEL_SERVICE_TOKENS.uiCompositionPersistence,
    kind: "factory",
    lifecycle: "singleton",
    dependencies: [KERNEL_SERVICE_TOKENS.uiCompositionRuntime, KERNEL_SERVICE_TOKENS.componentRegistry, KERNEL_SERVICE_TOKENS.metadataRegistry, KERNEL_SERVICE_TOKENS.persistence],
    useFactory: () => uiCompositionPersistence
  });
  container.registerProvider({
    token: KERNEL_SERVICE_TOKENS.snapshotRetentionAudit,
    kind: "factory",
    lifecycle: "singleton",
    dependencies: [KERNEL_SERVICE_TOKENS.uiCompositionPersistence, KERNEL_SERVICE_TOKENS.persistence],
    useFactory: () => snapshotRetentionAudit
  });
  container.registerProvider({ token: KERNEL_SERVICE_TOKENS.runtime, kind: "value", lifecycle: "singleton", useValue: runtime });
  container.registerProvider({ token: KERNEL_SERVICE_TOKENS.dependencyInjection, kind: "value", lifecycle: "singleton", useValue: container });
  container.registerProvider({
    token: KERNEL_SERVICE_TOKENS.runtimeBootstrap,
    kind: "factory",
    lifecycle: "singleton",
    dependencies: [
      KERNEL_SERVICE_TOKENS.configuration,
      KERNEL_SERVICE_TOKENS.serviceRegistry,
      KERNEL_SERVICE_TOKENS.moduleSystem,
      KERNEL_SERVICE_TOKENS.dependencyInjection,
      KERNEL_SERVICE_TOKENS.metadataEngine,
      KERNEL_SERVICE_TOKENS.componentRegistry,
      KERNEL_SERVICE_TOKENS.uiCompositionRuntime,
      KERNEL_SERVICE_TOKENS.persistence,
      KERNEL_SERVICE_TOKENS.metadataPersistence,
      KERNEL_SERVICE_TOKENS.configurationPersistence,
      KERNEL_SERVICE_TOKENS.componentPersistence,
      KERNEL_SERVICE_TOKENS.uiCompositionPersistence,
      KERNEL_SERVICE_TOKENS.snapshotRetentionAudit
      , KERNEL_SERVICE_TOKENS.auth
    ],
    useFactory: (resolvedConfiguration, resolvedServices, resolvedModules, resolvedContainer, resolvedMetadata, resolvedComponents, resolvedUIComposition, resolvedPersistence, resolvedMetadataPersistence, resolvedConfigurationPersistence, resolvedComponentPersistence, resolvedUICompositionPersistence, resolvedSnapshotRetentionAudit, resolvedAuth) =>
      new RuntimeBootstrapService({
        configuration: resolvedConfiguration as IConfigurationProvider,
        services: resolvedServices as IServiceRegistry,
        modules: resolvedModules as IModuleLoader,
        dependencyInjection: resolvedContainer as IDependencyInjectionContainer,
        metadata: resolvedMetadata as IMetadataEngine,
        componentRegistry: resolvedComponents as IComponentRegistry,
        uiComposition: resolvedUIComposition as IUICompositionRuntime,
        persistence: resolvedPersistence as IPersistenceService,
        metadataPersistence: resolvedMetadataPersistence as IMetadataPersistenceService,
        configurationPersistence: resolvedConfigurationPersistence as IConfigurationPersistenceService,
        componentPersistence: resolvedComponentPersistence as IComponentPersistenceService,
        uiCompositionPersistence: resolvedUICompositionPersistence as IUICompositionPersistenceService,
        snapshotRetentionAudit: resolvedSnapshotRetentionAudit as ISnapshotRetentionAuditService,
        auth: resolvedAuth as IAuthBridge
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

  registerStructuralService(services, KERNEL_SERVICE_TOKENS.eventBus, events, "Event Bus", "events", version);
  registerStructuralService(services, KERNEL_SERVICE_TOKENS.moduleSystem, modules, "Module System", "modules", version);
  registerStructuralService(services, KERNEL_SERVICE_TOKENS.executionContextFactory, executionContextFactory, "Execution Context Factory", "execution", version);
  registerStructuralService(services, KERNEL_SERVICE_TOKENS.metadataRegistry, metadata, "Metadata Registry", "metadata", version);
  registerStructuralService(services, KERNEL_SERVICE_TOKENS.metadataEngine, metadata, "Metadata Engine", "metadata", version);
  registerStructuralService(services, KERNEL_SERVICE_TOKENS.componentRegistry, components, "Component Registry", "system", version);
  registerStructuralService(services, KERNEL_SERVICE_TOKENS.uiCompositionRuntime, uiComposition, "UI Composition Runtime", "runtime", version);
  registerStructuralService(services, KERNEL_SERVICE_TOKENS.persistence, persistence, "Persistence Service", "system", version);
  registerStructuralService(services, KERNEL_SERVICE_TOKENS.metadataPersistence, metadataPersistence, "Metadata Persistence Service", "metadata", version);
  registerStructuralService(services, KERNEL_SERVICE_TOKENS.configurationPersistence, configurationPersistence, "Configuration Persistence Service", "configuration", version);
  registerStructuralService(services, KERNEL_SERVICE_TOKENS.componentPersistence, componentPersistence, "Component Persistence Service", "system", version);
  registerStructuralService(services, KERNEL_SERVICE_TOKENS.uiCompositionPersistence, uiCompositionPersistence, "UI Composition Persistence Service", "runtime", version);
  registerStructuralService(services, KERNEL_SERVICE_TOKENS.snapshotRetentionAudit, snapshotRetentionAudit, "Snapshot Retention Audit Service", "runtime", version);
  registerStructuralService(services, KERNEL_SERVICE_TOKENS.runtime, runtime, "Runtime", "runtime", version);

  return {
    configuration,
    events,
    modules,
    services,
    metadata,
    components,
    uiComposition,
    persistence,
    metadataPersistence,
    configurationPersistence,
    componentPersistence,
    uiCompositionPersistence,
    snapshotRetentionAudit,
    auth,
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
  category: "configuration" | "events" | "modules" | "execution" | "metadata" | "runtime" | "system",
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
