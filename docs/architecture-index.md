# Veltryx OS Architecture Index

Documento mestre de navegacao e status. Revisao editorial: 2026-10-24.

## Estado atual

Foundation v1.0 permanece Frozen. O repositorio ja possui implementacao ate IMP-0033, em vez de estar aguardando bootstrap. A evidencia e o commit `936ddd4`; o [Development Status](DEVELOPMENT-STATUS.md) detalha os limites de cada capacidade.

Status de documento e status de implementacao sao independentes. `Approved` autoriza apenas o escopo descrito; nao prova conclusao, release ou seguranca operacional. Os documentos `Draft` e `Review` sao propostas para revisao e nao autorizam codigo.

## Documentos oficiais e prioridade

1. [Architecture Governance](../rfc/RFC-0099-architecture-governance.md).
2. Este Architecture Index.
3. RFCs.
4. ADRs.
5. Especificacoes tecnicas.
6. Codigo.

Divergencia do codigo nao altera contrato aprovado. Deve ser registrada e resolvida pelo processo de governanca. [AGENTS](../AGENTS.md) permanece aplicavel.

## Registro de RFCs

| RFC      | Documento                                                                                                                   | Status   |
| -------- | --------------------------------------------------------------------------------------------------------------------------- | -------- |
| RFC-0001 | [RFC-0001: Fundacao do Veltryx OS](../rfc/RFC-0001-foundation.md)                                                           | Frozen   |
| RFC-0002 | [RFC-0002: Platform Core do Veltryx OS](../rfc/RFC-0002-platform-core.md)                                                   | Frozen   |
| RFC-0003 | [RFC-0003: Module System & Module Loader do Veltryx OS](../rfc/RFC-0003-module-system-loader.md)                            | Frozen   |
| RFC-0004 | [RFC-0004: Service Registry & Dependency Injection do Veltryx OS](../rfc/RFC-0004-service-registry-dependency-injection.md) | Frozen   |
| RFC-0005 | [RFC-0005: Metadata Engine do Veltryx OS](../rfc/RFC-0005-metadata-engine.md)                                               | Frozen   |
| RFC-0006 | [RFC-0006: Runtime Engine do Veltryx OS](../rfc/RFC-0006-runtime-engine.md)                                                 | Frozen   |
| RFC-0007 | [RFC-0007: UI Composition System do Veltryx OS](../rfc/RFC-0007-ui-composition-system.md)                                   | Frozen   |
| RFC-0008 | [RFC-0008 Runtime Abstraction & Platform Adapters](../rfc/RFC-0008-runtime-abstraction-platform-adapters.md)                | Draft    |
| RFC-0009 | [RFC-0009: Builder e Application Model](../rfc/RFC-0009-builder-application-model.md)                                       | Draft    |
| RFC-0010 | [RFC-0010: Permission Engine](../rfc/RFC-0010-permission-engine.md)                                                         | Review   |
| RFC-0011 | [RFC-0011 Auth + Tenant Foundation](../rfc/RFC-0011-auth-tenant-foundation.md)                                              | Approved |
| RFC-0012 | [RFC-0012: Workflow Engine](../rfc/RFC-0012-workflow-engine.md)                                                             | Draft    |
| RFC-0013 | [RFC-0013 API Layer + Runtime API Bridge](../rfc/RFC-0013-api-engine.md)                                                    | Approved |
| RFC-0014 | [RFC-0014: Query Engine](../rfc/RFC-0014-query-engine.md)                                                                   | Draft    |
| RFC-0015 | [RFC-0015: Data Layer — Persistence & Data Access Contracts](../rfc/RFC-0015-data-layer.md)                                 | Approved |
| RFC-0016 | [RFC-0016: Event System](../rfc/RFC-0016-event-system.md)                                                                   | Draft    |
| RFC-0017 | [RFC-0017: Observability](../rfc/RFC-0017-observability.md)                                                                 | Draft    |
| RFC-0018 | [RFC-0018: Deployment e Release](../rfc/RFC-0018-deployment.md)                                                             | Draft    |
| RFC-0019 | [RFC-0019: Autenticacao operacional e tenancy](../rfc/RFC-0019-operational-auth-tenancy.md)                                 | Draft    |
| RFC-0020 | [RFC-0020: Persistencia duravel e consistencia](../rfc/RFC-0020-durable-data-access.md)                                     | Draft    |
| RFC-0099 | [RFC-0099: Architecture Governance do Veltryx OS](../rfc/RFC-0099-architecture-governance.md)                               | Approved |

RFC-0008 permanece Draft. RFC-0009 identifica Builder/Application Model, nao Data Layer nem Finance Core. RFC-0011 autoriza somente identidade/contexto; RFC-0013 somente API estrutural read-only; RFC-0015 somente contratos e provider em memoria. RFC-0019 e RFC-0020 propoem complementos operacionais, sem substituir as aprovadas.

## Registro de IMPs recentes

| Documento                                                                                                                      | Status documental existente | Evidencia de implementacao                |
| ------------------------------------------------------------------------------------------------------------------------------ | --------------------------- | ----------------------------------------- |
| [IMP-0029: Admin Composition Adapter + Dynamic Screen Renderer](IMP-0029-admin-composition-adapter-dynamic-screen-renderer.md) | Approved                    | Codigo presente; ver evidencias no status |
| [IMP-0030: Dynamic Admin Shell + Navigation/Menu Composition](IMP-0030-dynamic-admin-shell-navigation-menu-composition.md)     | Approved                    | Codigo presente; ver evidencias no status |
| [IMP-0031: Persistence Layer + Data Access Contracts](IMP-0031-persistence-layer-data-access-contracts.md)                     | Approved                    | Codigo presente; ver evidencias no status |
| [IMP-0031B: Metadata Registry Persistence Integration](IMP-0031B-metadata-registry-persistence-integration.md)                 | Approved                    | Codigo presente; ver evidencias no status |
| [IMP-0031C: Configuration Provider Persistence Integration](IMP-0031C-configuration-provider-persistence-integration.md)       | Approved                    | Codigo presente; ver evidencias no status |
| [IMP-0031D: Component Registry Persistence Integration](IMP-0031D-component-registry-persistence-integration.md)               | Approved                    | Codigo presente; ver evidencias no status |
| [IMP-0031E: UI Composition Persistence Integration](IMP-0031E-ui-composition-persistence-integration.md)                       | Approved                    | Codigo presente; ver evidencias no status |
| [IMP-0031F: Snapshot Retention + Audit Policy](IMP-0031F-snapshot-retention-audit-policy.md)                                   | Approved                    | Codigo presente; ver evidencias no status |
| [IMP-0032 API Layer + Runtime API Bridge](IMP-0032-api-layer-runtime-api-bridge.md)                                            | Approved                    | Codigo presente; ver evidencias no status |
| [IMP-0033 Auth + Tenant Foundation](IMP-0033-auth-tenant-foundation.md)                                                        | Approved                    | Codigo presente; ver evidencias no status |
| [IMP-0034 Permission Engine Foundation](IMP-0034-permission-engine-foundation.md)                                              | Blocked                     | Proposta; depende da RFC-0010 Review      |

Aprovacao de IMP-0029 e IMP-0030 nao depende da RFC-0008: o mapping React e a navegacao sao internos de `apps/admin`, sem publicar sites. IMP-0031B/C/D/E/F tratam integracoes explicitas e snapshots derivados, sem banco real, scheduler ou auditoria duravel.

## Arquitetura e fronteiras

Builder produz revisoes declarativas; Metadata Engine valida e resolve; Runtime consome contratos e gera composicao abstrata; adapters externos implementam transporte e apresentacao. Core nao depende de modulos de negocio. A ordem de numeracao das RFCs nao e ordem linear de execucao.

Dependencias reais e propostas estao no [Dependency Graph](DEPENDENCY-GRAPH.md). Runtime nao depende do Builder. Component Registry armazena declaracoes; implementacao visual pertence ao adapter. Veltryx OS e Control Plane; delivery de sites e uma fronteira distinta sob RFC-0008.

## Continuidade e validacao

- [Development Status](DEVELOPMENT-STATUS.md): baseline, evidencias e restricoes.
- [Documentation Review](DOCUMENTATION-REVIEW.md): achados, correcoes e revisao preliminar.
- [Implementation Roadmap](IMPLEMENTATION-ROADMAP.md): proxima entrega e bloqueios.
- [Implementation Guide](IMPLEMENTATION-GUIDE.md) e [Checklist](IMPLEMENTATION-CHECKLIST.md).
- [Deploy Preview](DEPLOY-PREVIEW.md): operacao atual; nao prova deploy executado.

## Documentacao tecnica por capacidade

| Capacidade                   | Referencias                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Bootstrap, contexto e status | [Kernel](KERNEL-BOOTSTRAP.md), [Execution Context](EXECUTION-CONTEXT.md), [Runtime Bootstrap](RUNTIME-BOOTSTRAP.md), [Runtime Context](RUNTIME-CONTEXT.md), [Kernel Status](KERNEL-STATUS-SNAPSHOT.md), [Runtime Status](RUNTIME-STATUS-SNAPSHOT.md)                                                                                             |
| Modules                      | [Manifest](MODULE-MANIFEST.md), [Discovery](MODULE-DISCOVERY.md), [Resolver](DEPENDENCY-RESOLVER.md), [Loader](MODULE-LOADER.md), [Snapshot](MODULE-SYSTEM-SNAPSHOT.md)                                                                                                                                                                          |
| Services e configuracao      | [Registry](SERVICE-REGISTRY.md), [DI](DEPENDENCY-INJECTION-CONTAINER.md), [Configuration](CONFIGURATION-PROVIDER.md)                                                                                                                                                                                                                             |
| Eventos locais               | [Event Bus](EVENT-BUS.md), [Structural Events](KERNEL-STRUCTURAL-EVENTS.md)                                                                                                                                                                                                                                                                      |
| Metadata e UI                | [Metadata Engine](METADATA-ENGINE.md), [Registry](METADATA-REGISTRY.md), [Components](COMPONENT-REGISTRY.md), [UI Composition](UI-COMPOSITION-RUNTIME.md)                                                                                                                                                                                        |
| Admin                        | [Shell](ADMIN-SHELL.md), [Dynamic Shell](DYNAMIC-ADMIN-SHELL.md), [Navigation](NAVIGATION-MENU-COMPOSITION.md), [Composition Adapter](ADMIN-COMPOSITION-ADAPTER.md), [Renderer](DYNAMIC-SCREEN-RENDERER.md), [Modules Screen](ADMIN-MODULES-SCREEN.md), [Module Adapter](ADMIN-MODULE-SYSTEM-ADAPTER.md)                                         |
| Persistencia                 | [Layer](PERSISTENCE-LAYER.md), [Contracts](DATA-ACCESS-CONTRACTS.md), [Metadata](METADATA-PERSISTENCE-INTEGRATION.md), [Configuration](CONFIGURATION-PERSISTENCE-INTEGRATION.md), [Components](COMPONENT-PERSISTENCE-INTEGRATION.md), [UI Snapshots](UI-COMPOSITION-PERSISTENCE-INTEGRATION.md), [Retention](SNAPSHOT-RETENTION-AUDIT-POLICY.md) |
| API                          | [Layer](API-LAYER.md), [Bridge](RUNTIME-API-BRIDGE.md), [Endpoints](API-ENDPOINTS.md)                                                                                                                                                                                                                                                            |
| Auth e scopes estruturais    | [Foundation](AUTH-TENANT-FOUNDATION.md), [Bridge](AUTH-BRIDGE.md), [Tenant/Workspace](TENANT-WORKSPACE-CONTEXT.md)                                                                                                                                                                                                                               |
| Diagnosticos                 | [Health](HEALTH-DIAGNOSTICS.md), [Status Adapter](KERNEL-STATUS-ADAPTER.md)                                                                                                                                                                                                                                                                      |

## Historico e identificadores

O [roadmap](IMPLEMENTATION-ROADMAP.md) registra colisoes de numeros IMP em planos antigos. Identificar entregas antigas por caminho, titulo e task, preservando a trilha historica. O [IMP-0002 historico](IMP-0002-kernel-core-services.md) e a [SPRINT-0002 historica](SPRINT-0002-kernel-core-services.md) nao descrevem a proxima etapa atual.

## Revisao desta edicao

Autor editorial: Codex. Motivo: sincronizar navegacao com baseline existente e materializar propostas ausentes. Nenhuma RFC Approved/Frozen foi alterada, nenhum contrato foi implementado e nenhuma aprovacao arquitetural foi registrada nesta revisao.

## Continuidade da revisao de permissions

RFC-0010 v0.2 esta em Review apos [revisao cruzada tecnica](RFC-0010-CROSS-REVIEW.md). IMP-0034 v0.2 fixa contratos, tokens, reasonCodes, scopes e 26 cenarios de aceite; permanece Blocked para codigo, aguardando aprovacao nominal. Essa transicao editorial nao aprova a arquitetura nem indica implementacao.
