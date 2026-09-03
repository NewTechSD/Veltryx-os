# Runtime Context

O Runtime Context Ã© a representaÃ§Ã£o operacional, pÃºblica e imutÃ¡vel do Runtime. Ele consolida read models estruturais sem acessar registries, providers ou mÃ³dulos internos.

```text
Configuration Snapshot
Service Registry Snapshot
DI Snapshot
Module System Snapshot
Execution Context Snapshot opcional
        |
        v
Runtime Context Factory
        |
        v
Runtime Context
```

## Runtime Context e Execution Context

The public context may include an aggregate `metadataPersistence` summary; metadata resources and persistence records are excluded.

It may also include aggregate Configuration Persistence status and counters; configuration values are never included.

Component Persistence contributes only provider identity and persisted/hydrated counters, never definitions.

O Execution Context descreve quem, onde e sob qual execuÃ§Ã£o uma operaÃ§Ã£o ocorre. O Runtime Context descreve como a plataforma estÃ¡ configurada e disponÃ­vel. O resumo opcional de execuÃ§Ã£o contÃ©m apenas request/correlation IDs e indicadores de disponibilidade de tenant, workspace e user. Roles, permissions, metadata e dados de usuÃ¡rio nÃ£o sÃ£o copiados.

## ComposiÃ§Ã£o

O contexto informa `runtimeId`, lifecycle, environment, runtime mode, timestamps, configuraÃ§Ã£o pÃºblica, summary do Service Registry, summary de DI, summary do Module System, warnings, errors e diagnostics.

O lifecycle estrutural aceita `idle`, `bootstrapping`, `ready`, `warning`, `error` e `stopped`. TransiÃ§Ãµes invÃ¡lidas falham de forma controlada. NÃ£o hÃ¡ shutdown avanÃ§ado ou disposal de recursos externos.

## SeguranÃ§a e imutabilidade

A factory recebe somente snapshots pÃºblicos. Ela nÃ£o resolve providers, nÃ£o executa factories, nÃ£o carrega mÃ³dulos e nÃ£o inicia serviÃ§os. Objetos aninhados e arrays sÃ£o congelados. O validator rejeita ids, enums e contadores invÃ¡lidos e detecta funÃ§Ãµes em estruturas pÃºblicas. Secrets, `process.env`, stacks, instÃ¢ncias e authorization data nÃ£o fazem parte do contrato.

## LimitaÃ§Ãµes

O contexto ainda nÃ£o possui Metadata Engine, Component Registry, renderer ou UI Composition. Eventos especÃ­ficos de Runtime continuam adiados para evitar ciclo estrutural com o Event Bus. O prÃ³ximo passo recomendado Ã© a evoluÃ§Ã£o do Metadata Engine.

## Metadata Summary

O Runtime Context recebe um resumo leve do Metadata Engine durante o bootstrap estrutural. O campo `metadata` informa status, namespaces registrados, resources registrados, entities registradas e pages registradas.

O Runtime nao resolve, executa, renderiza ou duplica metadata nesta etapa.

## Component Registry e UI Composition

O Runtime Context expõe somente componentRegistry.status, componentRegistry.componentsRegistered, uiComposition.status e uiComposition.compositionsGenerated. O objetivo e permitir observabilidade estrutural sem transformar o contexto em dump de registry ou composition tree.

## Persistence context

Runtime Context may contain an optional `PersistenceSummary` derived exclusively from the public provider snapshot. The context does not carry repositories, provider instances, maps or record payloads.
## UI Composition Persistence summary

Runtime Context may include status, provider identity, persisted/loaded snapshot counts, latest count and diagnostic counts. It never contains Composition Trees or persistence records.

It may also include aggregate Snapshot Retention/Audit counters, never audit entries or trees.
