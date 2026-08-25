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
RFC-0008 Builder
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

| RFC      | Documento                                                         | Status  |
| -------- | ----------------------------------------------------------------- | ------- |
| RFC-0007 | [UI Composition System](../rfc/RFC-0007-ui-composition-system.md) | Frozen  |
| RFC-0008 | Builder                                                           | Planned |
| RFC-0009 | Application Model                                                 | Planned |
| RFC-0010 | Permission Engine                                                 | Planned |
| RFC-0011 | Authentication                                                    | Planned |
| RFC-0012 | Workflow Engine                                                   | Planned |
| RFC-0013 | API Engine                                                        | Planned |
| RFC-0014 | Query Engine                                                      | Planned |
| RFC-0015 | Data Layer                                                        | Planned |
| RFC-0016 | Event System                                                      | Planned |

## Infraestrutura

| RFC      | Documento     | Status  |
| -------- | ------------- | ------- |
| RFC-0017 | Observability | Planned |
| RFC-0018 | Deployment    | Planned |

## Governanca

| RFC      | Documento                                                             | Status   |
| -------- | --------------------------------------------------------------------- | -------- |
| RFC-0099 | [Architecture Governance](../rfc/RFC-0099-architecture-governance.md) | Approved |

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
