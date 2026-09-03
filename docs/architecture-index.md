# Veltryx OS Architecture Index

> Documento mestre da arquitetura do Veltryx OS.
>
> Este documento funciona como indice oficial das RFCs, mostrando a organizacao da plataforma, dependencias arquiteturais, roadmap e status de cada especificacao.

## Status

Projeto em fase de especificacao arquitetural.

Fase 0 Foundation: Frozen.

Nenhuma implementacao deve ocorrer sem uma RFC aprovada.

## Visao Geral

O Veltryx OS e uma plataforma empresarial modular orientada a metadados.

Seu objetivo e permitir a construcao de aplicacoes completas atraves de configuracao, contratos e metadados, reduzindo codigo repetitivo e promovendo extensibilidade.

A plataforma e organizada em quatro grandes camadas conceituais:

```text
Applications
    |
Builder
    |
Runtime
    |
Metadata
    |
Platform Core
    |
Infrastructure
```

## Arquitetura Geral

```text
                           Veltryx OS
                                |
                         Applications
                                |
                            Builder
                                |
                        Runtime Engine
                                |
                        Metadata Engine
                                |
                         Platform Core
                                |
                         Infrastructure
```

## Dependencias entre RFCs

```text
RFC-0001 Foundation
        |
        v
RFC-0002 Platform Core
        |
        v
RFC-0003 Module System
        |
        v
RFC-0004 Service Registry
        |
        v
RFC-0005 Metadata Engine
        |
        v
RFC-0006 Runtime Engine
        |
        v
RFC-0007 UI Composition System
        |
        v
RFC-0008 Runtime Abstraction & Platform Adapters
        |
        v
RFC-0009 Application Model
        |
        v
RFC-0010 Permission Engine
        |
        v
RFC-0011 Authentication
        |
        v
RFC-0012 Workflow Engine
        |
        v
RFC-0013 API Engine
        |
        v
RFC-0014 Query Engine
        |
        v
RFC-0015 Data Layer
        |
        v
RFC-0016 Event System
        |
        v
RFC-0017 Observability
        |
        v
RFC-0018 Deployment
```

## Nucleo da Plataforma (Kernel)

Estas RFCs formam o nucleo imutavel do Veltryx OS.

| RFC      | Documento                                                                    | Status |
| -------- | ---------------------------------------------------------------------------- | ------ |
| RFC-0001 | [Foundation](../rfc/RFC-0001-foundation.md)                                  | Frozen |
| RFC-0002 | [Platform Core](../rfc/RFC-0002-platform-core.md)                            | Frozen |
| RFC-0003 | [Module System](../rfc/RFC-0003-module-system-loader.md)                     | Frozen |
| RFC-0004 | [Service Registry](../rfc/RFC-0004-service-registry-dependency-injection.md) | Frozen |
| RFC-0005 | [Metadata Engine](../rfc/RFC-0005-metadata-engine.md)                        | Frozen |
| RFC-0006 | [Runtime Engine](../rfc/RFC-0006-runtime-engine.md)                          | Frozen |

## Plataforma

| RFC      | Documento                                                                                           | Status   |
| -------- | --------------------------------------------------------------------------------------------------- | -------- |
| RFC-0007 | [UI Composition System](../rfc/RFC-0007-ui-composition-system.md)                                   | Frozen   |
| RFC-0008 | [Runtime Abstraction & Platform Adapters](../rfc/RFC-0008-runtime-abstraction-platform-adapters.md) | Draft    |
| RFC-0009 | Builder / Application Model                                                                         | Planned  |
| RFC-0010 | Permission Engine                                                                                   | Planned  |
| RFC-0011 | Authentication                                                                                      | Planned  |
| RFC-0012 | Workflow Engine                                                                                     | Planned  |
| RFC-0013 | API Engine                                                                                          | Planned  |
| RFC-0014 | Query Engine                                                                                        | Planned  |
| RFC-0015 | [Data Layer — Persistence & Data Access Contracts](../rfc/RFC-0015-data-layer.md)                   | Approved |
| RFC-0016 | Event System                                                                                        | Planned  |

## Infraestrutura

| RFC      | Documento     | Status  |
| -------- | ------------- | ------- |
| RFC-0017 | Observability | Planned |
| RFC-0018 | Deployment    | Planned |

## Governanca

| RFC      | Documento                                                             | Status   |
| -------- | --------------------------------------------------------------------- | -------- |
| RFC-0099 | [Architecture Governance](../rfc/RFC-0099-architecture-governance.md) | Approved |

### Autorizacoes de Implementacao

| IMP      | Documento                                                                                                            | Status   | Autorizado por                                                             | Relacionado a                          |
| -------- | -------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------- | -------------------------------------- |
| IMP-0029 | [Admin Composition Adapter + Dynamic Screen Renderer](IMP-0029-admin-composition-adapter-dynamic-screen-renderer.md) | Approved | RFC-0007 + RFC-0099 + ADR-0004                                             | RFC-0008 Draft                         |
| IMP-0030 | [Dynamic Admin Shell + Navigation/Menu Composition](IMP-0030-dynamic-admin-shell-navigation-menu-composition.md)     | Approved | RFC-0005 + RFC-0006 + RFC-0007 + RFC-0099 + ADR-0004                       | IMP-0029; RFC-0008 Draft, not required |
| IMP-0031 | [Persistence Layer + Data Access Contracts](IMP-0031-persistence-layer-data-access-contracts.md)                     | Approved | RFC-0001 + RFC-0002 + RFC-0004 + RFC-0005 + RFC-0006 + RFC-0015 + RFC-0099 | RFC-0008 Draft, not required           |
| IMP-0031B | [Metadata Registry Persistence Integration](IMP-0031B-metadata-registry-persistence-integration.md)                  | Approved | RFC-0005 + RFC-0015 + RFC-0099 | Metadata Engine + Data Layer           |
| IMP-0031C | [Configuration Provider Persistence Integration](IMP-0031C-configuration-provider-persistence-integration.md)       | Approved | RFC-0002 + RFC-0015 + RFC-0099 | Configuration Provider + Data Layer    |
| IMP-0031D | [Component Registry Persistence Integration](IMP-0031D-component-registry-persistence-integration.md)               | Approved | RFC-0007 + RFC-0015 + RFC-0099 + ADR-0004 | Component Registry + Data Layer     |
| IMP-0031E | [UI Composition Persistence Integration](IMP-0031E-ui-composition-persistence-integration.md)                       | Approved | RFC-0005 + RFC-0007 + RFC-0015 + RFC-0099 + ADR-0004 | UI Composition Runtime + Data Layer |
| IMP-0031F | [Snapshot Retention + Audit Policy](IMP-0031F-snapshot-retention-audit-policy.md)                                   | Approved | RFC-0005 + RFC-0007 + RFC-0015 + RFC-0099 + ADR-0004 | UI Composition Persistence + Data Layer |

O IMP-0029 autoriza a TASK-0313 somente como renderizacao interna de Composition Tree em `apps/admin`. A aprovacao da RFC-0008 nao e dependencia dessa task porque o Admin Composition Adapter nao e um Runtime Adapter de publicacao.

Implementation references: [Admin Composition Adapter](ADMIN-COMPOSITION-ADAPTER.md) and [Dynamic Screen Renderer](DYNAMIC-SCREEN-RENDERER.md). Both remain restricted to `apps/admin`.

O IMP-0030 autoriza a TASK-0314 a derivar a navegacao do Admin Shell de metadata/menu/composition exclusivamente em `apps/admin`. A Composition Tree permanece universal; a RFC-0008 continua Draft e nao e requerida por esta task.

O IMP-0031 autoriza a Persistence Layer agnostica e o provider in-memory sob a RFC-0015. RFC-0009 permanece reservada para Builder/Application Model. Banco, ORM, driver, SQL e migrations nao sao autorizados.

O IMP-0031B prova o primeiro uso estrutural da Persistence Layer no Core por meio do Metadata Registry. A integracao nao implementa banco real, ORM, Prisma, PostgreSQL, API ou migrations.

O IMP-0031C autoriza uma ponte explicita entre Configuration Provider e Data Layer. A precedencia segura e preservada; secrets e ambiente bruto permanecem fora da persistencia e dos snapshots.

O IMP-0031D autoriza uma ponte explicita para definicoes declarativas do Component Registry. O Core continua runtime/platform agnostic e implementacoes visuais permanecem restritas aos apps/adapters apropriados.

O IMP-0031E autoriza uma ponte explicita para snapshots derivados de UI Composition. Metadata e Component Registry continuam como source of truth; snapshots persistidos nao sao artifacts de publicacao, e Runtime/Platform Adapters continuam bloqueados pela RFC-0008 Draft.

O IMP-0031F autoriza retencao e auditoria explicitas somente sobre snapshots derivados. A politica nao substitui Metadata Registry, Component Registry ou UI Composition Runtime e nao autoriza processamento em background ou publishing.

Implementation references: [Dynamic Admin Shell](DYNAMIC-ADMIN-SHELL.md) and [Navigation/Menu Composition](NAVIGATION-MENU-COMPOSITION.md).

A RFC-0008 permanece Draft. Next Runtime Adapter, WordPress Runtime Adapter, Static Runtime Adapter, Publishing Pipeline, Preview, Publish, Rollback e deploy targets reais continuam bloqueados ate sua aprovacao.

## Fluxo Arquitetural

```text
Builder
   |
   v
Metadata
   |
   v
Metadata Registry
   |
   v
Runtime
   |
   v
Component Registry
   |
   v
Application
```

## Principios

Toda decisao arquitetural deve seguir:

- Metadata First
- Runtime First
- Platform First
- Clean Architecture
- SOLID
- API First
- Contract First
- Documentation First
- Modularidade
- Observabilidade
- Seguranca

## Processo de Desenvolvimento

A ordem obrigatoria e:

```text
Problema
   |
   v
RFC
   |
   v
Architecture Review
   |
   v
Approved
   |
   v
Implementation
   |
   v
Tests
   |
   v
Documentation
   |
   v
Release
```

Nenhuma implementacao deve ocorrer sem RFC aprovada.

## Convencoes

RFCs:

- definem arquitetura.

ADRs:

- registram decisoes locais.

IMPs:

- implementam RFCs.

TESTs:

- validam implementacoes.

## Estrutura do Repositorio

```text
docs/
rfc/
adr/
tasks/
apps/
packages/
modules/
scripts/
```

## Roadmap

### Fundacao

- Foundation
- Core
- Modules
- Services
- Metadata
- Runtime

### Plataforma

- UI
- Builder
- Application Model
- Auth
- Workflow
- API
- Query

### Infraestrutura

- Observability
- Deployment
- Security

### Producao

- Marketplace
- SDK
- CLI
- Kubernetes
- Multi Region

## Checklist antes de implementar

- RFC existe?
- Esta aprovada?
- Nao existe conflito?
- Ha dependencias definidas?
- Existe Architecture Review?
- Existe ADR necessaria?

Se qualquer resposta for "nao", a implementacao nao deve comecar.

## Documentos Tecnicos

- [Event Bus](EVENT-BUS.md)
- [Kernel Structural Events](KERNEL-STRUCTURAL-EVENTS.md)
- [Module System Public Snapshot](MODULE-SYSTEM-SNAPSHOT.md)
- [Admin Module System Adapter](ADMIN-MODULE-SYSTEM-ADAPTER.md)
- [Admin Modules Screen](ADMIN-MODULES-SCREEN.md)
- [Configuration Provider](CONFIGURATION-PROVIDER.md)
- [Service Registry](SERVICE-REGISTRY.md)
- [Dependency Injection Container](DEPENDENCY-INJECTION-CONTAINER.md)
- [Runtime Bootstrap v1](RUNTIME-BOOTSTRAP.md)
- [Runtime Context](RUNTIME-CONTEXT.md)
- [Runtime Status Snapshot](RUNTIME-STATUS-SNAPSHOT.md)
- [Component Registry](COMPONENT-REGISTRY.md)
- [UI Composition Runtime](UI-COMPOSITION-RUNTIME.md)

## Documentos Oficiais

Ordem de prioridade:

1. Architecture Governance
2. Architecture Index
3. RFCs
4. ADRs
5. Technical Specifications
6. Codigo

Em caso de conflito, prevalece o documento de maior prioridade.

## Estado Atual

Fase atual:

Foundation v1.0 congelada.

Objetivo:

Iniciar a preparacao para IMP-0001 Bootstrap conforme governanca aprovada.

Apos o freeze da fundacao e a revisao arquitetural, a proxima etapa autorizavel e IMP-0001 Bootstrap.

## Metadata Engine Core Documentation

Documentos tecnicos adicionados para a fundacao de metadata:

- [Metadata Engine](METADATA-ENGINE.md)
- [Metadata Registry](METADATA-REGISTRY.md)

## Runtime Agnosticism Guardrail

ADR-0004 estabelece que Builder, Site Schema, Component Registry e UI Composition Runtime devem permanecer runtime-agnostic e platform-agnostic.

RFC-0008 nasce como Draft para formalizar Runtime Abstraction & Platform Adapters. Ate sua aprovacao, nenhuma implementacao pode acoplar o Core, Contracts, Component Registry ou UI Composition Runtime a um framework, DOM, plataforma de publicacao, template executavel ou mapping concreto de componente.

O Admin Composition Adapter autorizado pelo IMP-0029 nao altera essa restricao: seu mapping React fica exclusivamente em `apps/admin`, consome a Composition Tree universal e serve apenas ao painel administrativo. Ele nao e adapter de publicacao ou delivery e, portanto, nao depende da aprovacao da RFC-0008.

Fluxo arquitetural esperado:

```text
Veltryx OS
    |
    v
Builder
    |
    v
Site Schema
    |
    v
Publishing Pipeline
    |
    v
Runtime Adapter
    |
    v
Site publicado
```

Veltryx OS permanece Control Plane. Sites publicados pertencem ao Delivery Plane.
