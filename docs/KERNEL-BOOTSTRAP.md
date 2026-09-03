# Kernel Bootstrap

> `kernel.metadataPersistence` is registered as a singleton DI provider over the public Metadata Registry and Persistence Service contracts.

> `kernel.configurationPersistence` is registered as a singleton over the public Configuration Provider and Persistence Service contracts.

> `kernel.componentPersistence` is registered as a singleton over the public Component Registry and Persistence Service contracts.

## Objetivo

Documentar o bootstrap do Kernel e os contratos iniciais adicionados nas sprints de Kernel Core Services e First Online Shell.

O kernel inicializa a infraestrutura tecnica minima do Veltryx OS e entra no estado `Kernel Ready` sem regras de negocio, UI, API, Auth ou persistencia.

## Pacotes

- `@veltryx/contracts`: contratos publicos do kernel, registries, Event Bus e status snapshot.
- `@veltryx/kernel`: implementacao tecnica inicial do kernel, registries in-memory, Event Bus em memoria, Execution Context, Module Manifest, Module Discovery, Runtime bootstrap e Kernel Public Status Snapshot.
- `Configuration Provider`: fonte oficial e segura para configuracao estrutural do Kernel, exposta por `kernel.configuration()`.
- `Service Registry`: catálogo oficial dos serviços estruturais existentes, com tokens, descriptors e snapshot público seguro.
- `@veltryx/kernel-cli`: app minimo para executar o bootstrap e emitir `Kernel Ready`.

## Interfaces

- `IServiceRegistry`
- `IModuleLoader`
- `IModuleManifest`
- `IModuleManifestParser`
- `IModuleManifestValidator`
- `IModuleDiscovery`
- `IModuleDiscoveryValidator`
- `IModuleCatalog`
- `IMetadataRegistry`
- `IRuntime`
- `IExecutionContext`
- `IExecutionContextFactory`
- `IExecutionContextValidator`
- `ExecutionContextSnapshot`
- `IConfigurationProvider`
- `IEventBus`
- `IEventPublisher`
- `IEventDispatcher`
- `EventEnvelope`
- `EventDispatchResult`
- `IKernelStatusService`
- `KernelStatusSnapshot`

## Servicos e Registries

- `KernelExecutionContext`
- `KernelExecutionContextFactory`
- `KernelExecutionContextValidator`
- `KernelTenantContext`
- `KernelWorkspaceContext`
- `KernelUserContext`
- `KernelRequestContext`
- `KernelServiceRegistry`
- `KernelModuleLoader`
- `KernelModuleManifestParser`
- `KernelModuleManifestValidator`
- `KernelModuleVersion`
- `KernelModuleDiscovery`
- `KernelModuleDiscoveryValidator`
- `KernelModuleCatalog`
- `KernelModuleDescriptor`
- `InMemoryMetadataRegistry`
- `InMemoryConfigurationProvider`
- `InMemoryEventBus`
- `KernelEventPublisher`
- `KernelEventDispatcher`
- `KernelRuntime`
- `KernelStatusService`
- `VeltryxKernel`

## Fluxo de Bootstrap

```text
VeltryxKernel
      |
      v
Bootstrap
      |
      v
Module Loader
      |
      v
Service Registry
      |
      v
Metadata Registry
      |
      v
Runtime Bootstrap
      |
      v
Kernel Ready
      |
      v
VeltryxKernel.status().snapshot()
```

## Snapshot publico

Apos ou durante o lifecycle, consumidores podem chamar `VeltryxKernel.status().snapshot()` para obter estado estruturado do Kernel sem depender de Next.js, HTTP, banco, auth ou Runtime Renderer.

## Fora do Escopo

- Auth.
- Users.
- Prisma.
- PostgreSQL.
- Redis.
- Builder.
- CRUD.
- API.
- Frontend.
- Dashboard.
- Workflows.
- Modulos de negocio.

## Validacao

Comandos esperados:

- `pnpm install`
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm --filter @veltryx/kernel-cli dev`

## Eventos Estruturais

O Kernel publica eventos estruturais de bootstrap e readiness via Event Bus em memoria: kernel.bootstrap.started, kernel.bootstrap.completed, kernel.bootstrap.failed e kernel.ready. O catalogo completo esta em docs/KERNEL-STRUCTURAL-EVENTS.md.

`r`n## Module System Public Snapshot`r`n`r`nO Kernel expoe `kernel.modules().snapshot()` como read model publico do Module System. Gerar o snapshot nao executa bootstrap, discovery, resolution, loading ou Runtime.`r`n

## Metadata Engine Services

O bootstrap estrutural registra `kernel.metadataRegistry` e `kernel.metadataEngine` como servicos reais apontando para a implementacao do Metadata Registry evoluido. O Runtime Bootstrap recebe apenas o snapshot publico para montar resumo no Runtime Context.

## Component Registry e UI Composition

O bootstrap padrao registra os servicos reais kernel.componentRegistry e kernel.uiCompositionRuntime no Service Registry e no DI Container. Ambos permanecem declarativos e agnosticos de runtime/plataforma.

## Persistence structural service

Kernel dependency creation installs the in-memory Persistence Service as a singleton, registers `kernel.persistence` in Service Registry and DI, and supplies its public snapshot to Runtime Bootstrap. No external connection is opened during bootstrap.
## UI Composition Persistence provider

Bootstrap registers the singleton `kernel.uiCompositionPersistence` with public UI Composition Runtime, Component Registry, Metadata Registry and Persistence dependencies. Registration does not trigger composition, persistence or loading.

The singleton `kernel.snapshotRetentionAudit` is registered alongside it. Registration does not execute pruning, scheduling or background work.
