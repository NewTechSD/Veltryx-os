# Service Registry

## Objetivo

O Service Registry é o catálogo oficial de serviços estruturais do Kernel. Ele registra, localiza, descreve e expõe serviços por tokens estáveis sem revelar instâncias no read model público.

```text
Service Instance
    |
Service Descriptor
    |
Service Registry
    |
Service Registry Snapshot
    |
Kernel Status / Diagnostics / DI Futuro
```

## Registry versus DI Container

```text
Service Registry = registra e localiza serviços
DI Container     = resolve dependências e cria instâncias
```

O método legado `resolve()` permanece por compatibilidade com providers simples existentes. A nova API direta `get()` não executa factories, não resolve dependências, não faz autowiring e não materializa scopes.

## Tokens oficiais

- `kernel.configuration`
- `kernel.eventBus`
- `kernel.moduleSystem`
- `kernel.executionContextFactory`
- `kernel.status`
- `kernel.metadataRegistry`
- `kernel.runtime`

O catálogo reserva tokens oficiais, mas o Kernel registra somente serviços que possuem instância estrutural atual. `kernel.status` não é registrado porque o status é criado sob demanda e não existe como instância persistente.

Tokens devem ser estáveis, não vazios, legíveis e formados por segmentos separados por `.`, `_` ou `-`. O contrato legado com `id`, `version`, `owner`, `scope` e `description` foi preservado.

## Descriptors

Descriptors públicos contêm token, nome, descrição opcional, categoria, lifecycle, scope, status, momento de registro, source, version, tags, warnings, errors e diagnostics. Instâncias, providers, factories e objetos internos não fazem parte do descriptor.

Categorias: `kernel`, `configuration`, `events`, `modules`, `metadata`, `runtime`, `execution`, `status` e `system`.

Lifecycle estrutural: `registered`, `available`, `unavailable`, `replaced`, `removed` e `error`. Ele representa a entrada no registry, não o lifecycle operacional de módulos ou Runtime.

Scopes declarativos: `global`, `singleton`, `transient`, `scoped`, `request`, `tenant` e `workspace`. Somente a reutilização legada de `global`/`singleton` e o comportamento transient legado permanecem ativos. Os demais scopes são metadata para o DI futuro.

Status: `ok`, `warning`, `error` e `unknown`. Errors têm precedência sobre warnings; warnings têm precedência sobre o status nominal.

## Regras de registro

- Token vazio ou malformado é rejeitado.
- Serviço `null` ou `undefined` é rejeitado.
- Descriptor incompleto ou inválido é rejeitado.
- Duplicidade falha por padrão.
- Replacement exige `{ replace: true }`.
- Replacement limpa singleton legado e registra warning e diagnostic.
- Nenhuma sobrescrita silenciosa é permitida.

O registro legado `register(ServiceProvider)` continua funcionando. O registro novo recebe token, instância, descriptor e opções.

## Lookup e remoção

`get()` retorna somente instâncias registradas diretamente e nunca executa provider. `has()` verifica tokens sem criar serviços. `list()` preserva a lista legada de tokens. `remove()` remove explicitamente uma entrada e registra diagnostic. Tokens válidos ausentes retornam `undefined` em `get()`, `false` em `has()` e falha explícita no `resolve()` legado.

## Snapshot público

O snapshot expõe `status`, `generatedAt`, `servicesRegistered`, `servicesAvailable`, `servicesWithWarnings`, `servicesWithErrors`, descriptors públicos, warnings, errors e diagnostics. O status pode ser `ready`, `empty`, `partial` ou `error`.

Objetos e arrays são clonados e congelados. O snapshot não contém instâncias, funções, factories, stacks ou estado interno mutável. Diagnostics resumem categorias, scopes, replacements, último registro e último replacement. Falhas de snapshot são normalizadas sem stack trace.

## Integrações

O Kernel registra Configuration Provider, Event Bus, Module System, Execution Context Factory, Metadata Registry e Runtime. A versão dos descriptors vem do Configuration Provider, sem tornar o registry dependente dele para funcionar.

O Kernel Status Snapshot consome `servicesRegistered` e a disponibilidade do Service Registry Snapshot, sem duplicar descriptors.

Eventos `service.registered`, `service.replaced`, `service.removed` e `service.registry.snapshot.generated` não são emitidos nesta entrega. Fazer o registry depender do Event Bus que ele próprio registra criaria acoplamento circular no bootstrap. A integração deve ocorrer futuramente por uma porta de observabilidade aprovada.

## Limitações conhecidas

Não há DI Container, autowiring, resolução automática de dependências, autorização contextual, scopes reais, descarte operacional, proxies ou lazy loading novo. O provider legado é executado apenas por `resolve()` para preservar compatibilidade.

## Próximos passos

A TASK-0309 pode implementar o Dependency Injection Container sobre tokens e descriptors públicos, mantendo resolução, criação de instâncias, scopes e ciclos de dependências fora do Service Registry.
