# Kernel Public Status Snapshot

## Objetivo

O Kernel Public Status Snapshot define a fronteira publica para leitura do estado atual do `@veltryx/kernel`.

A fonte oficial do status e o proprio Kernel. Aplicacoes consumidoras, incluindo `apps/admin` e suas rotas operacionais `/health`, `/status` e `/diagnostics`, nao devem consolidar nem inferir estado interno quando o snapshot publico ja fornece essa informacao.

## Contratos

Os contratos ficam em `packages/contracts/src/kernel-status.ts` e sao exportados por `@veltryx/contracts` e `@veltryx/kernel`.

Interfaces e tipos principais:

- `IKernelStatusService`
- `KernelStatusSnapshot`
- `KernelStatus`
- `KernelBootStatus`
- `KernelModuleSystemStatus`
- `KernelRegistryStatus`
- `KernelStatusMetric`
- `KernelDiagnosticEntry`

## Implementacao

A implementacao fica em:

```text
packages/kernel/src/core/status/
    kernel-status-snapshot.ts
    kernel-status-service.ts
    kernel-status-types.ts
    index.ts
```

`VeltryxKernel.status()` retorna `IKernelStatusService` e o metodo `snapshot()` produz uma estrutura serializavel, sem dependencia de Next.js, HTTP, banco, auth ou Runtime Renderer.

Os campos `environment`, `appName`, `appVersion` e `runtimeMode` são obtidos do Configuration Provider oficial quando disponíveis. O snapshot completo de configuração não é duplicado nesta superfície.

`servicesRegistered` e `serviceRegistryStatus` são derivados do summary oficial do Service Registry Snapshot quando a API evoluída está disponível. Descriptors e instâncias não são duplicados no Kernel Status Snapshot.

## Dados expostos

O snapshot expoe:

- `kernelStatus`
- `bootStatus`
- `bootTimestamp`
- `environment`
- `servicesRegistered`
- `modulesDiscovered`
- `modulesResolved`
- `modulesLoaded`
- `moduleSystemStatus`
- `metadataRegistryStatus`
- `runtimeStatus`
- `warnings`
- `errors`
- `diagnostics`

## Estados explicitos

Metricas usam `KernelSnapshotAvailability`:

- `available`
- `notBootstrapped`
- `notImplemented`
- `unavailable`

O Kernel deve retornar indisponibilidade explicita quando uma superficie nao puder ser consultada. Ele nao deve inventar contadores ou expor estruturas internas alem dos contratos publicos.

## Diagnostics

Warnings e errors sao estruturados como `KernelDiagnosticEntry`, com:

- `code`
- `message`
- `severity`
- `source`
- `detail`
- `stack` opcional

Stacks podem ser habilitados por `includeTechnicalDetails`, mas nao devem ser obrigatorios para consumidores.

## Limites

O snapshot nao cria API externa, REST, GraphQL, banco, Prisma, Redis, Auth, login, sessao, JWT, Runtime Renderer, Builder, CRUD, metricas Prometheus, tracing, observabilidade avancada ou Event Bus.

`r`n## Module System Snapshot`r`n`r`nOs contadores de modulos do Kernel Status Snapshot devem ser alimentados pelo Module System Public Snapshot quando disponivel. O status geral nao deve recalcular discovery, resolution ou loading.`r`n
