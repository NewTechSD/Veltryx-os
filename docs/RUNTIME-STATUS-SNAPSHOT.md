# Runtime Status Snapshot

O Runtime Status Snapshot é o read model público detalhado do Runtime.

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

## Campos públicos

O snapshot expõe status, `generatedAt`, `runtimeId`, environment, runtime mode, `bootstrappedAt`, uptime, status de Configuration, Service Registry, DI e Module System, além dos contadores de serviços, providers e módulos. Warnings, errors e diagnostics são normalizados.

O uptime é calculado a partir de `bootstrappedAt` quando o timestamp é válido. O snapshot é uma projeção do Runtime Context e não contém os snapshots brutos usados pela factory.

## Relações

O Runtime Bootstrap alimenta o Runtime Context; o Runtime Context alimenta este snapshot. O Kernel Status consome apenas lifecycle, uptime e contadores de warnings/errors, preservando sua função de resumo global.

Instâncias, providers, factories, classes, closures, stacks, secrets, `process.env` e dados de usuário não são expostos. Objetos e arrays públicos são congelados.

## Limitações

Não há observabilidade externa, histórico de snapshots, persistência, renderer ou Metadata Runtime. Eventos `runtime.context.created`, `runtime.snapshot.generated` e `runtime.lifecycle.changed` permanecem adiados para uma integração futura sem dependências circulares.
