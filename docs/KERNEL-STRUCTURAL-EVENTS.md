# Kernel Structural Events

## Objetivo

Eventos estruturais internos tornam o ciclo tecnico do Kernel e do Module System observavel por meio do Event Bus oficial em memoria.

Eles representam acontecimentos de plataforma, como bootstrap, discovery, resolution e loading. Nao representam regra de negocio, Domain Events empresariais ou Workflow Engine.

## Diferenca Para Eventos de Negocio

Eventos estruturais:

- descrevem operacoes tecnicas do Kernel;
- possuem payload minimo e seguro;
- usam `EventMetadata` estrutural;
- nao controlam fluxo funcional;
- nao exigem handlers para a operacao principal funcionar.

Eventos de negocio:

- nao sao implementados nesta task;
- dependem de RFC/IMP propria;
- nao devem ser misturados ao catalogo estrutural.

## Catalogo

Eventos do Kernel:

- `kernel.bootstrap.started`
- `kernel.bootstrap.completed`
- `kernel.bootstrap.failed`
- `kernel.ready`

Eventos do Module System:

- `module.discovery.started`
- `module.discovery.completed`
- `module.discovery.failed`
- `module.resolution.started`
- `module.resolution.completed`
- `module.resolution.failed`
- `module.loading.started`
- `module.loading.completed`
- `module.loading.failed`

## Payloads Minimos

`kernel.bootstrap.started`:

```ts
{ environment: string; startedAt: string }
```

`kernel.bootstrap.completed`:

```ts
{ environment: string; completedAt: string; servicesRegistered: number }
```

`kernel.bootstrap.failed`:

```ts
{ environment: string; failedAt: string; error: { name: string; message: string } }
```

`kernel.ready`:

```ts
{ readyAt: string; bootTimestamp: string }
```

`module.discovery.started`:

```ts
{ candidatesCount: number; startedAt: string }
```

`module.discovery.completed`:

```ts
{ candidatesCount: number; validModules: number; invalidModules: number; duplicatedModules: number; completedAt: string }
```

`module.discovery.failed`:

```ts
{ failedAt: string; error: { name: string; message: string } }
```

`module.resolution.started`:

```ts
{ modulesCount: number; startedAt: string }
```

`module.resolution.completed`:

```ts
{ modulesCount: number; resolvedModules: number; missingDependencies: number; cyclesDetected: number; completedAt: string }
```

`module.resolution.failed`:

```ts
{ failedAt: string; error: { name: string; message: string } }
```

`module.loading.started`:

```ts
{ modulesCount: number; startedAt: string }
```

`module.loading.completed`:

```ts
{ modulesCount: number; loadedModules: number; rejectedModules: number; completedAt: string }
```

`module.loading.failed`:

```ts
{ failedAt: string; error: { name: string; message: string } }
```

## Metadata

Eventos do Kernel usam:

```ts
{ source: "kernel" }
```

Eventos do Module System usam:

```ts
{ source: "module-system" }
```

Quando existe `ExecutionContextSnapshot`, metadata pode incluir `correlationId`, `tenantId` e `workspaceId`. Dados ausentes nao sao inventados.

## Event Type

Mapeamento atual:

```text
kernel.* -> kernel
module.* -> module
```

## ExecutionContextSnapshot

Quando o Kernel possui contexto, o evento carrega `contextSnapshot` no envelope oficial.

```text
Kernel Operation
    |
    v
Structural Event Publisher
    |
    v
Event Bus
    |
    v
Dispatcher
    |
    v
Handlers
```

Para Module System:

```text
Discovery / Resolver / Loader
    |
    v
Structural Events
    |
    v
Event Bus
    |
    v
Diagnostics / Observability futura
```

## Tratamento de Erro

A publicacao de evento estrutural nao altera o resultado funcional da operacao principal.

- falha de handler fica no `EventDispatchResult`;
- falha do publisher estrutural e isolada;
- Kernel e Module System nao dependem de handlers registrados;
- eventos nao sao mecanismo de controle de fluxo.

## Contratos

Contratos publicos em `@veltryx/contracts`:

- `KernelStructuralEventName`
- `KernelStructuralEventPayload`
- `ModuleSystemStructuralEventName`
- `ModuleSystemStructuralEventPayload`
- `StructuralEventName`
- `StructuralEventPayload`
- `StructuralEventPublishInput`
- `IStructuralEventPublisher`

Implementacao em `@veltryx/kernel`:

- `KERNEL_STRUCTURAL_EVENTS`
- `MODULE_SYSTEM_STRUCTURAL_EVENTS`
- `STRUCTURAL_EVENT_NAMES`
- `KernelStructuralEventPublisher`
- `publishStructuralEvent`

## Limitacoes Conhecidas

- Eventos sao locais ao processo.
- Eventos nao sao persistidos.
- Nao ha replay, retry avancado, DLQ, scheduler ou filas externas.
- Nao ha eventos de negocio.
- Nao ha Workflow Engine.

## Proximos Passos

Possiveis proximas etapas, apenas com RFC/IMP aprovada:

- expor resumo simples de ultimos eventos no Kernel Status Snapshot;
- conectar diagnostics futuros ao Event Bus;
- registrar eventos declarados por modulos;
- implementar Event System distribuido em etapa propria.
