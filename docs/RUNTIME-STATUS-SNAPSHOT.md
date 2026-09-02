# Runtime Status Snapshot

O Runtime Status Snapshot Ã© o read model pÃºblico detalhado do Runtime.

```text
Runtime Context
      |
      v
Runtime Status Snapshot
      |
      v
Kernel Status Summary
      |
      v
Admin / Diagnostics futuros
```

## Campos pÃºblicos

O snapshot expÃµe status, `generatedAt`, `runtimeId`, environment, runtime mode, `bootstrappedAt`, uptime, status de Configuration, Service Registry, DI e Module System, alÃ©m dos contadores de serviÃ§os, providers e mÃ³dulos. Warnings, errors e diagnostics sÃ£o normalizados.

O uptime Ã© calculado a partir de `bootstrappedAt` quando o timestamp Ã© vÃ¡lido. O snapshot Ã© uma projeÃ§Ã£o do Runtime Context e nÃ£o contÃ©m os snapshots brutos usados pela factory.

## RelaÃ§Ãµes

O Runtime Bootstrap alimenta o Runtime Context; o Runtime Context alimenta este snapshot. O Kernel Status consome apenas lifecycle, uptime e contadores de warnings/errors, preservando sua funÃ§Ã£o de resumo global.

InstÃ¢ncias, providers, factories, classes, closures, stacks, secrets, `process.env` e dados de usuÃ¡rio nÃ£o sÃ£o expostos. Objetos e arrays pÃºblicos sÃ£o congelados.

## LimitaÃ§Ãµes

NÃ£o hÃ¡ observabilidade externa, histÃ³rico de snapshots, persistÃªncia, renderer ou Metadata Runtime. Eventos `runtime.context.created`, `runtime.snapshot.generated` e `runtime.lifecycle.changed` permanecem adiados para uma integraÃ§Ã£o futura sem dependÃªncias circulares.

## Metadata Summary

O Runtime Status Snapshot expoe somente contadores resumidos de metadata:

- `metadataStatus`
- `metadataNamespacesRegistered`
- `metadataResourcesRegistered`
- `metadataEntitiesRegistered`
- `metadataPagesRegistered`

Esses campos sao derivados do Runtime Context e nao substituem o Metadata Snapshot publico.

## Component Registry e UI Composition

O Runtime Status Snapshot expoe apenas campos leves: componentRegistryStatus, componentsRegistered, uiCompositionStatus e compositionsGenerated. Composition Trees completas permanecem fora do snapshot publico de status.

## Persistence summary

Runtime Status copies the immutable aggregate summary produced during structural bootstrap: status, provider identity/kind and counters only. Stored data and provider internals are excluded.
