# Runtime Bootstrap v1

O Runtime Bootstrap v1 valida a disponibilidade estrutural necessária para o Runtime, sem renderizar UI ou interpretar metadata.

```text
Kernel
  |
DI Container
  |
Runtime Bootstrap Service
  |-- Configuration Provider
  |-- Service Registry Snapshot
  `-- Module System Snapshot
  |
Runtime Ready / Warning / Error
```

O serviço inicia em `idle`, passa por `bootstrapping` e termina em `ready`, `warning` ou `error`; `stopped` existe como estado estrutural. Seu status mínimo informa `bootstrappedAt`, `runtimeMode`, `environment`, serviços e módulos disponíveis, além de warnings, errors e diagnostics normalizados.

O Kernel resolve o bootstrap por `kernel.runtimeBootstrap` através do container antes de chamar a API legada `runtime.bootstrap(context)`. Isso preserva consumidores existentes enquanto separa validação estrutural da sessão operacional.

O bootstrap agora alimenta o [Runtime Context](RUNTIME-CONTEXT.md), que por sua vez gera o [Runtime Status Snapshot](RUNTIME-STATUS-SNAPSHOT.md). A fachada legada expõe esses read models por `kernel.runtime().context()` e `kernel.runtime().snapshot()`.

Configuration, Service Registry e Module System são consumidos exclusivamente por seus snapshots públicos. O status não contém instâncias, stacks ou detalhes internos mutáveis.

Eventos específicos de Runtime foram adiados: o bootstrap já depende da ordem estrutural do Kernel e introduzi-los nesta entrega aumentaria o risco de ciclo entre Event Bus, container e Runtime. Os eventos existentes do Kernel continuam ativos.

## Limitações e próximos passos

Não há Runtime Context completo, renderer, metadata resolver, UI composition, persistência ou shutdown operacional. A próxima implementação recomendada é a TASK-0310, Runtime Context e Runtime Status Snapshot completo.

## Metadata Engine Input

O Runtime Bootstrap v1 pode receber o Metadata Snapshot publico como dependencia estrutural opcional. Ele copia apenas contadores e status para o Runtime Context, sem resolver metadata ou executar comportamento declarado.
