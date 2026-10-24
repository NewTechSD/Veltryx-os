# RFC-0012: Workflow Engine

Status: Draft

Version: 0.1

Type: RFC arquitetural

Owner: Architecture Owner (designacao nominal pendente)

Reviewers: Maintainers dos contratos impactados (designacao pendente)

Created: 2026-10-24

Last Updated: 2026-10-24

Depends On: RFC-0004, RFC-0006, RFC-0010, RFC-0016, RFC-0020, RFC-0099

Impacts: Core, Runtime, Contracts e consumidores descritos abaixo

Supersedes: None

Proposta para revisao. Nao autoriza implementacao nem altera RFC Approved/Frozen.

## Indice

1. [Visao geral](#1-visao-geral)
2. [Objetivos e fronteiras](#2-objetivos-e-fronteiras)
3. [Arquitetura proposta](#3-arquitetura-proposta)
4. [Contratos publicos](#4-contratos-publicos)
5. [Seguranca e observabilidade](#5-seguranca-e-observabilidade)
6. [Compatibilidade e alternativas](#6-compatibilidade-e-alternativas)
7. [Criterios de aceite](#7-criterios-de-aceite)
8. [Riscos e decisoes pendentes](#8-riscos-e-decisoes-pendentes)
9. [Glossario e referencias](#9-glossario-e-referencias)
10. [Revisao e aprovacao](#10-revisao-e-aprovacao)

## 1. Visao geral

O Event Bus nao coordena processos duraveis. Esta proposta define workflow versionado como coordenacao de contratos publicos, mantendo regra de negocio no modulo proprietario.

## 2. Objetivos e fronteiras

Coordenacao de estados; sem BPMN completo, designer visual, filas concretas, cron, scripts ou regras financeiras.

A capacidade pertence ao owner descrito pelos contratos; transporte, UI e infraestrutura concreta ficam nas bordas. Modules e Plugins consomem apenas contratos publicos. Nenhuma regra de negocio passa a pertencer ao Kernel por esta proposta.

## 3. Arquitetura proposta

Workflow Definition possui namespace, owner, versao, estados, transicoes, evento/comando de entrada e referencias de acoes. Workflow Instance fixa a versao da definicao e o contexto autorizado. Instancias existentes nao mudam de semantica quando uma nova definicao e publicada.

O lifecycle proposto e Pending, Running, Waiting, Completed, Failed ou Cancelled. Cada transicao valida estado atual, evento esperado, permissao e idempotencyKey. Versao de instancia protege contra duas transicoes concorrentes. Estado e registro da transicao devem ser atomicos; publicacao externa usa outbox sob RFC-0020 e RFC-0016.

Acoes invocam services publicos; nao executam scripts livres nem acessam storage de outro modulo. Reexecucao exige idempotencia da acao. Compensacao e uma acao de dominio declarada e auditada, nao rollback magico de efeitos externos.

Uma primeira implementacao pode provar o state machine em memoria, mas nao pode prometer retomada apos crash. Timers, scheduler e worker distribuido exigem IMP proprio; nenhum timer do processo deve ser apresentado como duravel.

Fluxo conceitual:

Authorized Trigger -> Instance -> Transition Validation -> Public Action -> History.

## 4. Contratos publicos

Nomes propostos, ainda nao exportados nem garantidos como API estavel:

| Contrato proposto                     | Responsabilidade                                  |
| ------------------------------------- | ------------------------------------------------- |
| WorkflowDefinition / WorkflowInstance | Definicao versionada e instancia fixada           |
| TransitionInput / TransitionResult    | Estado esperado, versao, contexto e resultado     |
| WorkflowActionPort                    | Invocar acao publica autorizada e idempotente     |
| WorkflowHistory                       | Registrar transicao, ator, resultado e correlacao |

Novos tokens, entradas e resultados devem ser fixados por IMP apos aprovacao arquitetural. Resultados esperados devem distinguir sucesso, negativa, conflito, indisponibilidade e entrada invalida quando aplicavel.

## 5. Seguranca e observabilidade

Contexto operacional nao e prova de autorizacao. Tenant/workspace, principal e permissoes precisam de origem confiavel em operacoes protegidas. Nao registrar secrets, credenciais ou payloads sensiveis em diagnostics. Falhas esperadas produzem codigo seguro, resultado e correlacao. Auditoria duravel nao pode ser prometida pelo provider em memoria.

Revisoes de contratos e resultados devem permitir rastrear operacao, owner, requestId/correlationId e scope quando aplicavel. A RFC-0017 propoe portas de sinais; sua ausencia nao dispensa erros seguros no MVP.

## 6. Compatibilidade e alternativas

A proposta e aditiva; nao remove nem altera exports atuais. Consumo de nova capacidade depende de declaracao explicita, nunca de deteccao silenciosa. Contratos publicados preservam semantica e versionamento; incompatibilidade exige major, migracao e nova revisao conforme RFC-0099.

Forward compatibility nao permite ignorar campos de seguranca, capabilities obrigatorias ou versoes desconhecidas: estes casos falham de forma explicita. Migracao e rollout sao responsabilidade do IMP consumidor; nao ha migracao executada nesta alteracao documental.

Alternativas consideradas: acoplar a capacidade ao Admin simplifica o primeiro consumidor, mas impede reuso e viola as fronteiras; expandir implicitamente contratos existentes evita novos nomes, mas esconde mudanca de semantica. A proposta prefere portas pequenas e explicitas.

## 7. Criterios de aceite

- Evento duplicado nao repete efeito confirmado.
- Transicao invalida ou sem permissao nao altera instancia.
- Atualizar definicao nao altera instancia em andamento.
- Corrida entre duas transicoes gera uma vencedora e conflito seguro.
- Falha externa fica registrada e nao e tratada como sucesso.
- Recuperacao duravel so e aceita com teste de crash e retomada.

## 8. Riscos e decisoes pendentes

Politica de compensacao e timeout deve ser explicitada por workflow no IMP. Durabilidade depende de RFC-0020; entrega confiavel de eventos depende de RFC-0016.

Escopo excessivo e aprovacao conjunta sem revisar dependencias podem criar falsa prontidao. Aprovar a RFC nao significa aprovar todos os adapters ou IMPs consumidores. A sequencia esta em [Implementation Roadmap](../docs/IMPLEMENTATION-ROADMAP.md).

## 9. Glossario e referencias

Workflow: coordenacao versionada. Instance: execucao fixada em uma definicao. Compensation: acao explicita para tratar efeito anterior.

Dependencias normativas: RFC-0004, RFC-0006, RFC-0010, RFC-0016, RFC-0020, RFC-0099. Relacoes de consumo e dependencias opcionais estao no [Dependency Graph](../docs/DEPENDENCY-GRAPH.md). A [revisao documental](../docs/DOCUMENTATION-REVIEW.md) registra compatibilidade preliminar e bloqueios. Decisoes desta RFC permanecem propostas ate aprovacao.

## 10. Revisao e aprovacao

- [x] Objetivo, escopo, contratos, alternativas e criterios de aceite documentados.
- [x] Riscos, seguranca, tenancy e compatibilidade avaliados preliminarmente.
- [ ] Owners/reviewers nominais designados.
- [ ] Dependencias Draft aprovadas para a entrega pretendida.
- [ ] Cross Review formal concluido pelos owners afetados.
- [ ] Pendencias do IMP correspondente resolvidas.
- [ ] Decisao de aprovacao registrada pelo Architecture Owner.

Historico: 2026-10-24 — proposta documental preparada por Codex; sem implementacao, aprovacao ou mudanca de status de contratos existentes.
