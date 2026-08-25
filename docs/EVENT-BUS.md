# Event Bus

## Objetivo

O Event Bus oficial em memoria do Veltryx OS fornece publicacao, assinatura e despacho de eventos internos do Kernel de forma framework-agnostic, testavel e independente de infraestrutura externa.

Esta implementacao pertence ao Platform Core e opera exclusivamente em memoria.

## Escopo Atual

Implementado:

- Event Bus em memoria;
- Event Envelope oficial;
- Event Metadata;
- Event Handler;
- Event Subscription;
- Event Publisher;
- Event Dispatcher;
- Event Dispatch Result;
- Event Types conceituais;
- handlers sincrononos;
- handlers assincronos;
- tratamento controlado de erro;
- suporte a `ExecutionContextSnapshot`.

## Fora do Escopo

Nao implementa:

- Redis;
- Kafka;
- BullMQ;
- RabbitMQ;
- filas externas;
- retry avancado;
- dead letter queue;
- scheduler;
- workflow;
- webhooks;
- persistencia de eventos;
- event sourcing;
- observabilidade completa;
- API NestJS;
- Runtime real;
- Auth;
- banco;
- eventos de negocio.

## Contratos Principais

Contratos publicos em `@veltryx/contracts`:

- `IEventBus`
- `IEventPublisher`
- `IEventDispatcher`
- `EventEnvelope`
- `EventPublishInput`
- `EventMetadata`
- `EventHandler`
- `EventSubscription`
- `EventDispatchResult`
- `EventDispatchError`
- `EventType`

Implementacao em `@veltryx/kernel`:

```text
packages/kernel/src/core/events/
    event-bus.ts
    event-envelope.ts
    event-metadata.ts
    event-handler.ts
    event-subscription.ts
    event-publisher.ts
    event-dispatcher.ts
    event-dispatch-result.ts
    event-types.ts
    index.ts
```

## Fluxo de Publicacao

```text
Publisher
    |
    v
Event Bus
    |
    v
Dispatcher
    |
    v
Handlers
    |
    v
Dispatch Result
```

`KernelEventPublisher` recebe `EventPublishInput`, delega para `IEventBus` e retorna `EventDispatchResult`.

## Fluxo de Assinatura

```text
subscribe(eventName, handler)
    |
    v
EventSubscription
    |
    v
InMemoryEventBus subscriptions
```

Cada subscription possui `subscriptionId` estavel e pode ser removida por `unsubscribe(subscriptionId)` sem afetar outras subscriptions.

## Envelope

`EventEnvelope` contem:

- `eventId`
- `eventName`
- `eventType`
- `payload`
- `metadata`
- `contextSnapshot`
- `occurredAt`

O envelope e congelado para reduzir risco de mutacao acidental apos publicacao.

## Metadata

`EventMetadata` suporta campos estruturais opcionais:

- `source`
- `moduleId`
- `correlationId`
- `causationId`
- `tenantId`
- `workspaceId`
- `tags`

Dados ausentes nao sao inventados.

## Execution Context

O Event Bus aceita `ExecutionContextSnapshot` no envelope.

```text
Execution Context
    |
    v
ExecutionContextSnapshot
    |
    v
Event Envelope
    |
    v
Handlers
```

Quando informado, o snapshot preserva dados estruturais como `requestId`, `correlationId`, `tenantId`, `workspaceId` e `userId`.

O snapshot nao e mecanismo de autenticacao ou autorizacao.

## Tratamento de Erro

O dispatcher captura erros sincrononos e assincronos de handlers.

Regras:

- erro em um handler nao derruba o Kernel inteiro;
- handlers seguintes continuam executando;
- falhas sao normalizadas em `EventDispatchError`;
- `EventDispatchResult` agrega sucesso, falha, warnings e timestamp de despacho;
- stack trace nao e requisito para consumidores futuros.

## Tipos de Evento

Tipos conceituais suportados:

- `kernel`
- `module`
- `metadata`
- `runtime`
- `system`

Nao ha eventos de negocio nesta task.

## Compatibilidade

O `InMemoryEventBus` aceita envelopes legados usados pelo Kernel inicial (`name`, `version`, `context`) e os normaliza para o envelope oficial. Isso preserva o lifecycle atual sem manter o contrato legado como direcao futura.

## Limitacoes Conhecidas

- O barramento e local ao processo Node.js.
- Eventos nao sao persistidos.
- Nao ha retry, DLQ, scheduler ou distribuicao.
- Nao ha garantias cross-process ou cross-node.
- Nao ha ordenacao global alem da execucao sequencial dos handlers encontrados no processo atual.

## Proximos Passos

Possiveis evolucoes futuras, somente com RFC/IMP apropriada:

- registro formal de eventos por modulo;
- diagnostics agregados de eventos;
- observabilidade estruturada;
- Event System distribuido;
- filas externas;
- integrações com Workflow Engine.

## Kernel Structural Events

O Kernel e o Module System publicam eventos estruturais internos usando KernelStructuralEventPublisher. O catalogo e os payloads estao documentados em docs/KERNEL-STRUCTURAL-EVENTS.md. Esses eventos nao sao eventos de negocio e nao controlam o fluxo funcional das operacoes.

