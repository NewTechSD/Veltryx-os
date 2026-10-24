# RFC-0010: Permission Engine

Status: Draft

Version: 0.1

Type: RFC arquitetural

Owner: Architecture Owner (designacao nominal pendente)

Reviewers: Maintainers dos contratos impactados (designacao pendente)

Created: 2026-10-24

Last Updated: 2026-10-24

Depends On: RFC-0001, RFC-0002, RFC-0004, RFC-0006, RFC-0011, RFC-0099

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

Roles e permissions no Execution Context sao dados estruturais. Nao existe avaliador de acesso. Esta proposta define decisao de permissao sem transformar hints HTTP ou metadata visual em autoridade.

## 2. Objetivos e fronteiras

Avaliacao de permissoes; sem login, persistencia de grants, ABAC generico, UI de roles ou substituicao do Auth Bridge.

A capacidade pertence ao owner descrito pelos contratos; transporte, UI e infraestrutura concreta ficam nas bordas. Modules e Plugins consomem apenas contratos publicos. Nenhuma regra de negocio passa a pertencer ao Kernel por esta proposta.

## 3. Arquitetura proposta

O avaliador recebe principal confiavel, resource namespaced, action, escopo, identidade opcional do objeto e revisao da politica. Retorna allow ou deny, reasonCode e revisao avaliada. Contexto ausente, principal inativo, recurso desconhecido, politica indisponivel ou scope inconsistente resultam em deny.

Um catalogo declara recursos e acoes; declaracao nao concede acesso. Grants sao obtidos de um provider confiavel, com vinculo a tenant/workspace. RBAC inicial permite concessoes exatas por role; regras de objeto pertencem ao owner do recurso e podem restringir, nunca ampliar uma negativa. Negativa explicita prevalece. Nao existe wildcard ou heranca implicita de administrador na primeira entrega.

O MVP e um avaliador puro, com provider em memoria injetado somente por codigo confiavel e sem alteracao das rotas publicas existentes. Posteriormente, enforcement no servidor precede query, comando e exposicao de field. Filtro de menu e apenas apresentacao. `system` exige origem interna explicita e nao implica bypass universal.

Cache inicial fica desabilitado. Uma evolucao exige chave por principal, tenant, workspace, recurso, acao e revisao de politica, com invalidacao em revogacao. Politicas e concessoes nunca sao aceitas de headers, query params ou claims nao verificadas.

Fluxo conceitual:

Trusted Context + Policy Provider -> Permission Evaluator -> allow / deny -> Resource Owner.

## 4. Contratos publicos

Nomes propostos, ainda nao exportados nem garantidos como API estavel:

| Contrato proposto                         | Responsabilidade                                                 |
| ----------------------------------------- | ---------------------------------------------------------------- |
| PermissionResource / PermissionAction     | Catalogo namespaced, owner e versao                              |
| PermissionCheckInput / PermissionDecision | Contexto confiavel, allow/deny, reasonCode e policyVersion       |
| IPermissionPolicyProvider                 | Entregar grants confiaveis e revisao sem armazenamento implicito |
| IPermissionEvaluator                      | Avaliar sem transporte, UI ou consulta a internals               |

Novos tokens, entradas e resultados devem ser fixados por IMP apos aprovacao arquitetural. Resultados esperados devem distinguir sucesso, negativa, conflito, indisponibilidade e entrada invalida quando aplicavel.

## 5. Seguranca e observabilidade

Contexto operacional nao e prova de autorizacao. Tenant/workspace, principal e permissoes precisam de origem confiavel em operacoes protegidas. Nao registrar secrets, credenciais ou payloads sensiveis em diagnostics. Falhas esperadas produzem codigo seguro, resultado e correlacao. Auditoria duravel nao pode ser prometida pelo provider em memoria.

Revisoes de contratos e resultados devem permitir rastrear operacao, owner, requestId/correlationId e scope quando aplicavel. A RFC-0017 propoe portas de sinais; sua ausencia nao dispensa erros seguros no MVP.

## 6. Compatibilidade e alternativas

A proposta e aditiva; nao remove nem altera exports atuais. Consumo de nova capacidade depende de declaracao explicita, nunca de deteccao silenciosa. Contratos publicados preservam semantica e versionamento; incompatibilidade exige major, migracao e nova revisao conforme RFC-0099.

Forward compatibility nao permite ignorar campos de seguranca, capabilities obrigatorias ou versoes desconhecidas: estes casos falham de forma explicita. Migracao e rollout sao responsabilidade do IMP consumidor; nao ha migracao executada nesta alteracao documental.

Alternativas consideradas: acoplar a capacidade ao Admin simplifica o primeiro consumidor, mas impede reuso e viola as fronteiras; expandir implicitamente contratos existentes evita novos nomes, mas esconde mudanca de semantica. A proposta prefere portas pequenas e explicitas.

## 7. Criterios de aceite

- Sem grant, contexto invalido ou principal inativo: deny.
- Grant do tenant A nao autoriza tenant B; workspace exige vinculo correto.
- Deny explicito prevalece; recurso/acao desconhecido nao recebe permissao.
- Header `x-tenant-id`, role textual `admin` e menu visivel nao criam grants.
- Mesma entrada e politica produzem decisao deterministica; dados publicados sao imutaveis.
- Falha do provider nao permite fallback permissivo; system nao recebe bypass automatico.

## 8. Riscos e decisoes pendentes

Nome final dos tokens e reasonCodes sera fixado no IMP-0034 antes de implementacao. A aprovacao deste avaliador nao autoriza enforcement incompleto sobre dados de clientes.

Escopo excessivo e aprovacao conjunta sem revisar dependencias podem criar falsa prontidao. Aprovar a RFC nao significa aprovar todos os adapters ou IMPs consumidores. A sequencia esta em [Implementation Roadmap](../docs/IMPLEMENTATION-ROADMAP.md).

## 9. Glossario e referencias

Grant: concessao explicita e escopada. Deny: negativa de acesso. Policy revision: versao usada para reproduzir a decisao.

Dependencias normativas: RFC-0001, RFC-0002, RFC-0004, RFC-0006, RFC-0011, RFC-0099. Relacoes de consumo e dependencias opcionais estao no [Dependency Graph](../docs/DEPENDENCY-GRAPH.md). A [revisao documental](../docs/DOCUMENTATION-REVIEW.md) registra compatibilidade preliminar e bloqueios. Decisoes desta RFC permanecem propostas ate aprovacao.

## 10. Revisao e aprovacao

- [x] Objetivo, escopo, contratos, alternativas e criterios de aceite documentados.
- [x] Riscos, seguranca, tenancy e compatibilidade avaliados preliminarmente.
- [ ] Owners/reviewers nominais designados.
- [ ] Dependencias Draft aprovadas para a entrega pretendida.
- [ ] Cross Review formal concluido pelos owners afetados.
- [ ] Pendencias do IMP correspondente resolvidas.
- [ ] Decisao de aprovacao registrada pelo Architecture Owner.

Historico: 2026-10-24 — proposta documental preparada por Codex; sem implementacao, aprovacao ou mudanca de status de contratos existentes.
