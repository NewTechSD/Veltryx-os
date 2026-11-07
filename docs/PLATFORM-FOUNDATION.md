# Platform Foundation — OS-CORE-PHASE-01

**Status:** Review-ready  
**Scope:** OS-CORE-0001, OS-CORE-0002 e OS-CORE-0003  
**Architectural basis:** ADR-0005 (Approved), RFC-0003 (Frozen), RFC-0099 (Approved)

## Resultado operacional

A fundação operacional integra host, Kernel, Runtime e Admin sem importar
módulos de negócio ou descobrir arquivos do monorepo:

```text
Host composition root
  -> explicit manifest catalog
  -> IModuleLoader.register(manifest, source?)
  -> Discovery / Validation
  -> Dependency Resolution
  -> Loading / Module Registry
  -> Kernel Module Snapshot
  -> Runtime Snapshot / Admin adapters
```

O catálogo padrão do Admin é vazio. Um host ou fixture pode fornecer uma lista
explícita de registros autorizados à composição root; cada registro mantém
`source` somente como informação declarada para diagnóstico. O Kernel não
transforma presença física, pacote instalado ou source em autorização.

## Matriz de implementação

| Entrega                                  | Implementação                                                                                  | Evidência                                                                 | Estado                            |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------- |
| OS-CORE-0001 Host Module Registration    | `apps/admin/lib/host-kernel.ts` e `host-module-catalog.ts`                                     | registro antes de `initialize()`; catálogo vazio por padrão               | Implementado; pronto para revisão |
| OS-CORE-0002 Admin & Runtime Integration | `module-system-adapter.ts`, `kernel-status-adapter.ts`, Runtime Bootstrap e snapshots públicos | Admin/Runtime consomem `kernel.modules().snapshot()` e métricas derivadas | Implementado; pronto para revisão |
| OS-CORE-0003 Documentation & Governance  | docs técnicos, roadmap, README e relatório de fase                                             | rastreabilidade preservada; RFC/ADR históricos não alterados              | Implementado; pronto para revisão |

## Limites

O lifecycle operacional termina em `discovered -> validated -> resolved ->
loaded`. Permanecem fora desta fase instalação, trust, assinatura, marketplace,
filesystem discovery, persistência externa, autenticação real, RBAC, Finance,
Builder, Hosting e estados posteriores a `loaded`.

Readiness técnica nesta fase significa que a pipeline e suas superfícies de
observabilidade estão integradas e testadas. Não significa prontidão de
produção, distribuição remota ou autorização de módulos.

## Governança e próximos passos

Esta fase não altera RFCs, ADRs ou estados históricos de IMPs. O próximo passo
é revisão do diff e abertura/atualização do PR correspondente. Evoluções de
instalação, trust, lifecycle posterior ou catálogo persistente exigem decisão
arquitetural própria.
