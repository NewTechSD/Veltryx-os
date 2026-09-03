# Implementation Roadmap do Veltryx OS

## Objetivo

Definir o roadmap oficial de implementacao do Veltryx OS.

Este documento transforma RFCs aprovadas e planejadas em entregas de engenharia organizadas por fases, dependencias, prioridade, complexidade e status.

O roadmap nao autoriza implementacao por si so. Toda entrega deve respeitar a Architecture Governance, o Architecture Index e as RFCs aplicaveis.

## Filosofia

RFC define arquitetura.

IMP implementa RFC.

Uma implementacao somente pode iniciar quando:

- a RFC correspondente existe;
- a RFC esta aprovada;
- dependencias arquiteturais foram resolvidas;
- riscos criticos foram avaliados;
- ADRs necessarias foram identificadas;
- existe plano de testes e documentacao.

## Fases

### Fase 1

Kernel.

Objetivo da fase:

Estabelecer a base minima executavel da plataforma, incluindo bootstrap, contratos do Core, carregamento de modulos, registro de servicos, registro de metadados e inicializacao conceitual do Runtime.

Implementacoes:

| IMP      | Entrega           | Objetivo                                                                              | RFCs Dependentes                                           | Prioridade | Complexidade | Status  | Dependencias                 |
| -------- | ----------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------- | ------------ | ------- | ---------------------------- |
| IMP-0001 | Bootstrap         | Criar o fluxo inicial de inicializacao da plataforma e validar pre-condicoes do Core. | RFC-0001, RFC-0002, RFC-0099                               | Alta       | Media        | Planned | Nenhuma                      |
| IMP-0002 | Core Contracts    | Materializar contratos publicos iniciais do Platform Core.                            | RFC-0001, RFC-0002, RFC-0004, RFC-0099                     | Alta       | Alta         | Planned | IMP-0001                     |
| IMP-0003 | Module Loader     | Implementar descoberta, validacao e lifecycle inicial de modulos.                     | RFC-0001, RFC-0002, RFC-0003, RFC-0099                     | Alta       | Alta         | Planned | IMP-0001, IMP-0002           |
| IMP-0004 | Service Registry  | Implementar registro, resolucao e descarte basico de services por contrato.           | RFC-0002, RFC-0003, RFC-0004, RFC-0099                     | Alta       | Alta         | Planned | IMP-0002, IMP-0003           |
| IMP-0005 | Metadata Registry | Implementar registro e consulta de metadata validada.                                 | RFC-0001, RFC-0003, RFC-0005, RFC-0099                     | Alta       | Alta         | Planned | IMP-0002, IMP-0003, IMP-0004 |
| IMP-0006 | Runtime Bootstrap | Implementar inicializacao minima do Runtime e conexao com registries.                 | RFC-0001, RFC-0002, RFC-0004, RFC-0005, RFC-0006, RFC-0099 | Alta       | Alta         | Planned | IMP-0002, IMP-0004, IMP-0005 |

### Fase 2

Platform.

Objetivo da fase:

Construir as capacidades de plataforma que transformam metadata em experiencia utilizavel, incluindo Builder, UI Composition e Application Model.

Implementacoes:

| IMP      | Entrega                                             | Objetivo                                                                                                      | RFCs Dependentes                                                     | Prioridade | Complexidade | Status   | Dependencias                           |
| -------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------- | ------------ | -------- | -------------------------------------- |
| IMP-0007 | UI Composition                                      | Implementar composicao abstrata de UI por componentes, slots, propriedades, eventos e acoes.                  | RFC-0005, RFC-0006, RFC-0007, RFC-0099                               | Alta       | Alta         | Planned  | IMP-0005, IMP-0006                     |
| IMP-0008 | Runtime Adapters                                    | Definir e implementar adapters de runtime para traduzir Site Schema e Composition Tree para delivery targets. | RFC-0005, RFC-0006, RFC-0007, RFC-0008, RFC-0099                     | Alta       | Alta         | Blocked  | RFC-0008, IMP-0005, IMP-0006, IMP-0007 |
| IMP-0009 | Application Model                                   | Implementar modelo de aplicacao gerado por Runtime, metadata e composicao.                                    | RFC-0005, RFC-0006, RFC-0007, RFC-0009, RFC-0099                     | Media      | Alta         | Blocked  | RFC-0009, IMP-0006, IMP-0007           |
| IMP-0029 | Admin Composition Adapter + Dynamic Screen Renderer | Renderizar Composition Tree somente dentro do Admin, sem constituir adapter de publicacao.                    | RFC-0007, RFC-0099                                                   | Alta       | Alta         | Approved | ADR-0004, TASK-0312                    |
| IMP-0030 | Dynamic Admin Shell + Navigation/Menu Composition   | Derivar a navegacao interna do Admin de metadata/menu/composition sem implementar adapter de publicacao.      | RFC-0005, RFC-0006, RFC-0007, RFC-0099                               | Alta       | Alta         | Approved | IMP-0029, TASK-0313, ADR-0004          |
| IMP-0031 | Persistence Layer + Data Access Contracts           | Criar contratos agnosticos, provider in-memory e snapshots publicos sem banco, ORM, driver ou SQL.            | RFC-0001, RFC-0002, RFC-0004, RFC-0005, RFC-0006, RFC-0015, RFC-0099 | Critica    | Alta         | Approved | RFC-0015                               |
| IMP-0031B | Metadata Registry Persistence Integration           | Usar IPersistenceService como backing store explicito do Metadata Registry, com hidratacao segura.           | RFC-0005, RFC-0015, RFC-0099                                         | Alta       | Alta         | Approved | IMP-0031, TASK-0315                    |
| IMP-0031C | Configuration Provider Persistence Integration      | Persistir e hidratar explicitamente apenas configuracoes publicas, preservando precedencia e secrets.        | RFC-0002, RFC-0015, RFC-0099                                         | Alta       | Alta         | Approved | IMP-0031, IMP-0031B, TASK-0307         |
| IMP-0031D | Component Registry Persistence Integration          | Persistir e hidratar definicoes declarativas de componentes sem implementacao visual ou plataforma.         | RFC-0007, RFC-0015, RFC-0099, ADR-0004                               | Alta       | Alta         | Approved | IMP-0031, TASK-0312, TASK-0315         |
| IMP-0031E | UI Composition Persistence Integration              | Persistir snapshots derivados e controlados sem substituir metadata, components ou composition runtime.     | RFC-0005, RFC-0007, RFC-0015, RFC-0099, ADR-0004                     | Alta       | Alta         | Approved | IMP-0031, TASK-0312, TASK-0315D        |
| IMP-0031F | Snapshot Retention + Audit Policy                    | Aplicar retencao explicita, checksum deterministico, audit estrutural e reparo de latest.                    | RFC-0005, RFC-0007, RFC-0015, RFC-0099, ADR-0004                     | Alta       | Alta         | Approved | IMP-0031E, TASK-0315E                  |
| IMP-0032 | API Layer + Runtime API Bridge                         | Criar API v1 read-only com bridge agnostica no Kernel e adapter HTTP inicial no Admin.                    | RFC-0013, RFC-0002, RFC-0006, RFC-0099                                  | Critica    | Alta         | Approved | IMP-0031F, TASK-0315F                  |

### Fase 3

Business.

Objetivo da fase:

Implementar capacidades empresariais basicas de identidade, acesso, usuarios, organizacoes e isolamento logico por tenant.

Implementacoes:

| IMP      | Entrega       | Objetivo                                                                   | RFCs Dependentes                                 | Prioridade | Complexidade | Status  | Dependencias                 |
| -------- | ------------- | -------------------------------------------------------------------------- | ------------------------------------------------ | ---------- | ------------ | ------- | ---------------------------- |
| IMP-0010 | Auth          | Implementar autenticacao de usuarios, servicos e integracoes.              | RFC-0001, RFC-0002, RFC-0011, RFC-0099           | Alta       | Alta         | Blocked | RFC-0011, IMP-0002           |
| IMP-0011 | RBAC          | Implementar controle de acesso por roles, permissoes, recursos e contexto. | RFC-0001, RFC-0002, RFC-0006, RFC-0010, RFC-0099 | Alta       | Alta         | Blocked | RFC-0010, IMP-0010           |
| IMP-0012 | Users         | Implementar modelo operacional de usuarios e identidades.                  | RFC-0011, RFC-0099                               | Alta       | Media        | Blocked | RFC-0011, IMP-0010           |
| IMP-0013 | Organizations | Implementar organizacoes como estrutura administrativa de negocio.         | RFC-0001, RFC-0011, RFC-0099                     | Media      | Media        | Blocked | RFC-0011, IMP-0012           |
| IMP-0014 | Tenants       | Implementar isolamento logico por tenant e workspace.                      | RFC-0001, RFC-0002, RFC-0011, RFC-0099           | Alta       | Alta         | Blocked | RFC-0011, IMP-0010, IMP-0011 |

### Fase 4

Automation.

Objetivo da fase:

Adicionar capacidades de automacao, eventos, agendamento, filas e orquestracao controlada.

Implementacoes:

| IMP      | Entrega   | Objetivo                                                                    | RFCs Dependentes                       | Prioridade | Complexidade | Status  | Dependencias                 |
| -------- | --------- | --------------------------------------------------------------------------- | -------------------------------------- | ---------- | ------------ | ------- | ---------------------------- |
| IMP-0015 | Workflow  | Implementar workflow conforme contratos futuros de automacao.               | RFC-0012, RFC-0016, RFC-0099           | Media      | Alta         | Blocked | RFC-0012, RFC-0016           |
| IMP-0016 | Scheduler | Implementar agendamento de tarefas e execucoes rastreaveis.                 | RFC-0012, RFC-0016, RFC-0099           | Media      | Media        | Blocked | RFC-0012, RFC-0016           |
| IMP-0017 | Event Bus | Implementar barramento operacional de eventos.                              | RFC-0002, RFC-0003, RFC-0016, RFC-0099 | Alta       | Alta         | Blocked | RFC-0016, IMP-0002, IMP-0003 |
| IMP-0018 | Queue     | Implementar processamento assincrono e filas conforme arquitetura aprovada. | RFC-0016, RFC-0018, RFC-0099           | Media      | Alta         | Blocked | RFC-0016, RFC-0018, IMP-0017 |

### Fase 5

Marketplace.

Objetivo da fase:

Habilitar ecossistema de extensoes por SDK, CLI e plugins, preparando a plataforma para distribuicao controlada de modulos.

Implementacoes:

| IMP      | Entrega | Objetivo                                                                               | RFCs Dependentes                                           | Prioridade | Complexidade | Status  | Dependencias                                     |
| -------- | ------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------- | ------------ | ------- | ------------------------------------------------ |
| IMP-0019 | SDK     | Implementar SDK oficial para modulos, plugins, metadata, runtime e contratos publicos. | RFC-0001, RFC-0003, RFC-0004, RFC-0005, RFC-0006, RFC-0099 | Media      | Alta         | Planned | IMP-0002, IMP-0003, IMP-0004, IMP-0005, IMP-0006 |
| IMP-0020 | CLI     | Implementar CLI para operacoes de desenvolvimento, validacao e suporte a modulos.      | RFC-0003, RFC-0099                                         | Media      | Media        | Blocked | RFC de CLI, IMP-0019                             |
| IMP-0021 | Plugins | Implementar instalacao, validacao e ativacao controlada de plugins.                    | RFC-0003, RFC-0004, RFC-0005, RFC-0007, RFC-0099           | Media      | Alta         | Planned | IMP-0003, IMP-0004, IMP-0005, IMP-0007           |

## Para cada implementacao

Toda implementacao deve definir:

### Objetivo

Descrever o resultado de engenharia esperado e o problema resolvido.

### RFCs Dependentes

Listar RFCs obrigatorias e seu status. Implementacao deve permanecer bloqueada quando uma RFC dependente estiver ausente, planejada, em proposta ou em revisao.

### Prioridade

Classificar como:

- Alta;
- Media;
- Baixa.

### Complexidade

Classificar como:

- Baixa;
- Media;
- Alta.

### Status

Classificar como:

- Planned: planejada, mas ainda nao iniciada.
- Blocked: bloqueada por RFC, decisao, dependencia ou risco.
- Ready: pronta para iniciar.
- In Progress: em implementacao.
- Review: pronta para revisao tecnica.
- Done: concluida e validada.
- Deprecated: nao recomendada para novas implementacoes.
- Archived: preservada apenas para historico.

### Dependencias

Listar IMPs, RFCs, ADRs, contratos ou decisoes que precisam existir antes do inicio.

## Criterio

Nenhum codigo.

Somente planejamento.

## Entregas Implementadas Recentes

- TASK-0302 / IMP-0018 Event Bus: barramento interno em memoria do Platform Core implementado em @veltryx/kernel, com contratos publicos em @veltryx/contracts e documentacao em docs/EVENT-BUS.md.

- TASK-0303 / IMP-0019 Kernel Structural Events: eventos estruturais internos do Kernel e Module System publicados via Event Bus em memoria, documentados em docs/KERNEL-STRUCTURAL-EVENTS.md.

`r`n## TASK-0304 / IMP-0020`r`n`r`nModule System Public Snapshot implementado como fronteira publica de leitura via `kernel.modules().snapshot()`, preparando a futura tela `/modules` sem expor internals do Kernel.`r`n

## TASK-0311 / IMP-0027

Metadata Engine Core e Metadata Registry Evolution implementam a fundacao estrutural de metadata para SPRINT-0004. A entrega cobre namespaces, resources, entities, fields, relations, actions, views, forms, lists, pages, menus, permission declarations, validator, resolver, snapshot publico e diagnostics seguros.

A proxima entrega recomendada e TASK-0312 Component Registry + UI Composition Runtime, com a trava arquitetural TASK-0312A de runtime/platform agnosticism.

## TASK-0312A / Architecture Guardrail

ADR-0004 Builder Runtime Agnosticism foi aceita para impedir acoplamento prematuro do Builder, Site Schema, Component Registry e UI Composition Runtime a qualquer runtime ou plataforma.

RFC-0008 Runtime Abstraction & Platform Adapters foi criada como Draft. Ela prepara uma futura camada de Runtime Adapter responsavel por compatibilidade, preview, publish, deploy, rollback, capabilities e mapping concreto de implementacoes.

Criterios adicionais para TASK-0312:

- Component Registry deve armazenar contratos declarativos, nao implementacoes visuais.
- UI Composition Runtime deve gerar Composition Tree universal.
- Site Schema deve permanecer contrato universal.
- Builder manipula schema, nao entrega visual.
- Runtime Adapter traduz schema/composition para plataforma.
- Veltryx OS permanece Control Plane.
- Site publicado pertence ao Delivery Plane.

## TASK-0313 / IMP-0029

A TASK-0313 esta aprovada sob o nome **Admin Composition Adapter + Dynamic Screen Renderer**.

- Status: Approved.
- Implementation: completed in `apps/admin` with the Admin Composition Adapter, Dynamic Screen Renderer, server-side demonstration route, safe component mapping, tests and technical documentation.
- Depends On: RFC-0007, RFC-0099, ADR-0004 e TASK-0312.
- Related To: RFC-0008, que permanece Draft.
- Does Not Depend On: aprovacao da RFC-0008.

A autorizacao limita a implementacao a renderizacao de Composition Tree dentro de `apps/admin`. O mapping concreto de `componentKey` para React pertence somente ao Admin; `packages/kernel`, `packages/contracts` e a Composition Tree permanecem runtime-agnostic.

O Admin Composition Adapter nao e Runtime Adapter de publicacao. Next Runtime Adapter, WordPress Runtime Adapter, Static Runtime Adapter, Publishing Pipeline, Preview, Publish, Rollback e deploy targets reais continuam bloqueados ate a aprovacao da RFC-0008.

## TASK-0314 / IMP-0030

A TASK-0314 esta aprovada sob o nome **Dynamic Admin Shell + Navigation/Menu Composition**.

- Status: Approved.
- Depends On: TASK-0313, RFC-0005, RFC-0006, RFC-0007, RFC-0099 e ADR-0004.
- Related To: IMP-0029.
- Does Not Depend On: aprovacao da RFC-0008.

A TASK-0314 evolui somente o Admin Shell interno de `apps/admin`. Ela nao implementa Runtime Adapter de publicacao. Runtime Adapters de publicacao continuam bloqueados ate aprovacao da RFC-0008.

## TASK-0315 / IMP-0031

A TASK-0315 esta aprovada como **Persistence Layer + Data Access Contracts** sob a RFC-0015 Data Layer.

- Status: Approved.
- Depends On: RFC-0001, RFC-0002, RFC-0004, RFC-0005, RFC-0006, RFC-0015 e RFC-0099.
- RFC-0009 permanece reservada para Builder/Application Model.
- Does Not Depend On: aprovacao da RFC-0008.

A implementacao limita-se a contratos publicos, Persistence Service, provider in-memory, repository e snapshots seguros. Banco real, Prisma, PostgreSQL, ORM, driver, SQL e migrations permanecem fora de escopo.

## TASK-0315B / IMP-0031B

- Status: Approved.
- Authorized By: RFC-0005, RFC-0015 e RFC-0099.
- Depends On: TASK-0315 e IMP-0031.
- Does Not Depend On: RFC-0008.
- Does Not Replace: RFC-0009.

A integracao usa `IPersistenceService` como backing store abstrato e mantem o Metadata Registry como indice operacional sincrono. Ela nao implementa banco, ORM, driver, SQL, migrations ou persistencia automatica oculta.

## TASK-0315C / IMP-0031C

- Status: Approved.
- Authorized By: RFC-0002, RFC-0015 e RFC-0099.
- Depends On: TASK-0307, TASK-0315 e TASK-0315B.
- Does Not Depend On: RFC-0008.
- Does Not Replace: RFC-0009.

Esta task prova o uso da Persistence Layer no Configuration Provider. Somente configuracoes publicas allowlisted podem ser persistidas; secrets, env bruto, banco, ORM, driver, SQL, API e migrations permanecem fora de escopo.

## TASK-0315D / IMP-0031D

- Status: Approved.
- Authorized By: RFC-0007, RFC-0015, RFC-0099 e ADR-0004.
- Depends On: TASK-0312 e TASK-0315.
- Does Not Depend On: RFC-0008.
- Does Not Replace: RFC-0009.

Esta task prova o uso da Persistence Layer no Component Registry somente para definicoes declarativas. Renderer, adapter visual, Builder, Marketplace, banco, ORM, Prisma, PostgreSQL, API e migrations permanecem fora de escopo.

## TASK-0315E / IMP-0031E

- Status: Approved.
- Authorized By: RFC-0005, RFC-0007, RFC-0015, RFC-0099 e ADR-0004.
- Depends On: TASK-0312, TASK-0315 e TASK-0315D.
- Does Not Depend On: RFC-0008.
- Does Not Replace: RFC-0009.

Esta task prova o uso da Persistence Layer no UI Composition Runtime para snapshots controlados e derivados. Metadata e Component Registry permanecem como fonte principal; `compose` nao persiste automaticamente. Renderer, publishing, Runtime Adapter, Builder, banco, ORM, Prisma, PostgreSQL, API e migrations permanecem fora de escopo.

## TASK-0315F / IMP-0031F

- Status: Approved.
- Authorized By: RFC-0005, RFC-0007, RFC-0015, RFC-0099 e ADR-0004.
- Depends On: TASK-0315E.
- Does Not Depend On: RFC-0008.
- Does Not Replace: RFC-0009.

Esta task adiciona retencao explicita, checksum deterministico, audit trail estrutural e reparo de latest para UI Composition Snapshots derivados. Banco real, scheduler, worker, publishing, Runtime Adapter, Prisma, PostgreSQL, ORM e driver permanecem fora de escopo.
