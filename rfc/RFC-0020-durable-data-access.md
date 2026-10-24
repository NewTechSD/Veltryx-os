# RFC-0020: Persistencia duravel e consistencia

Status: Draft

Version: 0.1

Type: RFC arquitetural

Owner: Architecture Owner (designacao nominal pendente)

Reviewers: Maintainers dos contratos impactados (designacao pendente)

Created: 2026-10-24

Last Updated: 2026-10-24

Depends On: RFC-0001, RFC-0004, RFC-0015, RFC-0099

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

A RFC-0015 possui adapter in-memory e exclui transacoes e locking otimista. Persistencia real, concorrencia, idempotencia e outbox precisam de contrato complementar antes de dados operacionais.

## 2. Objetivos e fronteiras

Contratos adicionais e limites do adapter; sem driver no Kernel, schema financeiro, multi-region, event sourcing ou migrations nesta tarefa.

A capacidade pertence ao owner descrito pelos contratos; transporte, UI e infraestrutura concreta ficam nas bordas. Modules e Plugins consomem apenas contratos publicos. Nenhuma regra de negocio passa a pertencer ao Kernel por esta proposta.

## 3. Arquitetura proposta

O adapter duravel fica em pacote de infraestrutura separado. Ele implementa contratos publicos e nunca introduz driver/ORM em Kernel ou Contracts. A stack PostgreSQL/Prisma ja prevista na Foundation pode ser materializada por IMP especifico; esta proposta nao fornece schema, migration ou conexao.

Compatibilidade exige preservar IRepository atual. Novas portas separadas oferecem Unit of Work, Conditional Update e Idempotency Store, com capability declarada. Provider sem suporte retorna unsupported; nao simula atomicidade com sequencia de writes. Operacao condicional recebe expectedVersion e falha em conflito, sem sobrescrever revisao concorrente.

Unit of Work confirma ou reverte todas as escritas participantes no mesmo storage transacional. Efeitos externos nao participam da transacao. Outbox e gravada junto com a alteracao de dominio e publicada depois; nao ha promessa de transacao distribuida. IdempotencyKey e escopada por tenant + operacao + principal quando necessario, com fingerprint do pedido e resultado seguro; reutilizacao com payload diferente retorna conflito.

TenantId em metadata nao garante isolamento. Portas scoped recebem contexto confiavel, validam ownership e aplicam filtro obrigatorio. Recursos globais sao explicitos, separados e protegidos. O provider deve impedir colisoes de chaves entre tenants sem alterar silenciosamente a semantica do IRepository legado.

Migrations pertencem ao owner da infraestrutura/modulo, sao versionadas, revisadas e executadas por processo autorizado separado do bootstrap. Backup, restore e compatibilidade entre versoes sao testados. Falha de storage nao faz fallback silencioso para memoria em producao.

Fluxo conceitual:

Trusted Scoped Command -> Unit of Work -> Records + Outbox + Idempotency -> Commit.

## 4. Contratos publicos

Nomes propostos, ainda nao exportados nem garantidos como API estavel:

| Contrato proposto              | Responsabilidade                                 |
| ------------------------------ | ------------------------------------------------ |
| DurableProviderCapabilities    | Durabilidade, atomicidade e operacoes suportadas |
| UnitOfWorkPort                 | Commit/rollback em storage unico                 |
| ConditionalUpdatePort          | expectedVersion, sucesso ou conflito             |
| IdempotencyStore / OutboxStore | Dedupe e entrega pos-commit                      |
| ScopedRepositoryPort           | Ownership e scope obrigatorios por operacao      |

Novos tokens, entradas e resultados devem ser fixados por IMP apos aprovacao arquitetural. Resultados esperados devem distinguir sucesso, negativa, conflito, indisponibilidade e entrada invalida quando aplicavel.

## 5. Seguranca e observabilidade

Contexto operacional nao e prova de autorizacao. Tenant/workspace, principal e permissoes precisam de origem confiavel em operacoes protegidas. Nao registrar secrets, credenciais ou payloads sensiveis em diagnostics. Falhas esperadas produzem codigo seguro, resultado e correlacao. Auditoria duravel nao pode ser prometida pelo provider em memoria.

Revisoes de contratos e resultados devem permitir rastrear operacao, owner, requestId/correlationId e scope quando aplicavel. A RFC-0017 propoe portas de sinais; sua ausencia nao dispensa erros seguros no MVP.

## 6. Compatibilidade e alternativas

A proposta e aditiva; nao remove nem altera exports atuais. Consumo de nova capacidade depende de declaracao explicita, nunca de deteccao silenciosa. Contratos publicados preservam semantica e versionamento; incompatibilidade exige major, migracao e nova revisao conforme RFC-0099.

Forward compatibility nao permite ignorar campos de seguranca, capabilities obrigatorias ou versoes desconhecidas: estes casos falham de forma explicita. Migracao e rollout sao responsabilidade do IMP consumidor; nao ha migracao executada nesta alteracao documental.

Alternativas consideradas: acoplar a capacidade ao Admin simplifica o primeiro consumidor, mas impede reuso e viola as fronteiras; expandir implicitamente contratos existentes evita novos nomes, mas esconde mudanca de semantica. A proposta prefere portas pequenas e explicitas.

## 7. Criterios de aceite

- Restart preserva dados confirmados no adapter duravel.
- Falha no meio da transacao reverte todos os writes participantes.
- Duas escritas com mesma expectedVersion produzem um conflito.
- Repeticao idempotente nao duplica efeito; payload divergente conflita.
- Outbox nao perde evento confirmado em crash e tolera duplicatas.
- get/list/count/update/delete nao atravessam tenant.
- Adapter nao suportado retorna erro; outage nao ativa memoria automaticamente.
- Restore em ambiente isolado recupera dados e versao conhecida.

## 8. Riscos e decisoes pendentes

Estrategia fisica de tenancy, isolation level, TTL de idempotencia, politica de backup e lifecycle de conexoes exigem ADR/IMP antes de adapter real. Nao presumir escolhas feitas em outros projetos.

Escopo excessivo e aprovacao conjunta sem revisar dependencias podem criar falsa prontidao. Aprovar a RFC nao significa aprovar todos os adapters ou IMPs consumidores. A sequencia esta em [Implementation Roadmap](../docs/IMPLEMENTATION-ROADMAP.md).

## 9. Glossario e referencias

Unit of Work: fronteira atomica local. Conditional update: escrita com versao esperada. Idempotency: repeticao sem novo efeito confirmado.

Dependencias normativas: RFC-0001, RFC-0004, RFC-0015, RFC-0099. Relacoes de consumo e dependencias opcionais estao no [Dependency Graph](../docs/DEPENDENCY-GRAPH.md). A [revisao documental](../docs/DOCUMENTATION-REVIEW.md) registra compatibilidade preliminar e bloqueios. Decisoes desta RFC permanecem propostas ate aprovacao.

## 10. Revisao e aprovacao

- [x] Objetivo, escopo, contratos, alternativas e criterios de aceite documentados.
- [x] Riscos, seguranca, tenancy e compatibilidade avaliados preliminarmente.
- [ ] Owners/reviewers nominais designados.
- [ ] Dependencias Draft aprovadas para a entrega pretendida.
- [ ] Cross Review formal concluido pelos owners afetados.
- [ ] Pendencias do IMP correspondente resolvidas.
- [ ] Decisao de aprovacao registrada pelo Architecture Owner.

Historico: 2026-10-24 — proposta documental preparada por Codex; sem implementacao, aprovacao ou mudanca de status de contratos existentes.
