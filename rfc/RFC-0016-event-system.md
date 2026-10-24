# RFC-0016: Event System

Status: Draft

Version: 0.1

Type: RFC arquitetural

Owner: Architecture Owner (designacao nominal pendente)

Reviewers: Maintainers dos contratos impactados (designacao pendente)

Created: 2026-10-24

Last Updated: 2026-10-24

Depends On: RFC-0002, RFC-0003, RFC-0004, RFC-0099

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

Ja existe Event Bus interno em memoria autorizado pelo Platform Core. Esta proposta trata evolucao de contratos e entrega de eventos entre processos; nao renomeia nem reautoriza retroativamente o barramento existente.

## 2. Objetivos e fronteiras

Contratos e semantica de entrega; sem escolher broker, Redis client, worker ou implantar infraestrutura nesta RFC.

A capacidade pertence ao owner descrito pelos contratos; transporte, UI e infraestrutura concreta ficam nas bordas. Modules e Plugins consomem apenas contratos publicos. Nenhuma regra de negocio passa a pertencer ao Kernel por esta proposta.

## 3. Arquitetura proposta

Eventos publicos representam fatos imutaveis namespaced e versionados, com owner, eventId, occurredAt, correlationId, causationId e scope quando aplicavel. O contrato existente de EventEnvelope e a base; extensoes exigem compatibilidade e nunca mudam payload publicado na mesma versao.

Duas classes de entrega sao distintas: despacho local best-effort, ja existente, e entrega duravel futura at-least-once. Nao ha promessa exactly-once. Consumidores duraveis usam idempotencia por subscription + eventId + tenant; efeitos externos precisam de chave propria ou mecanismo de deduplicacao.

Publicacao de fato associado a transacao usa outbox atomica no storage do owner. Um relay confirmado publica e marca a entrega, com possibilidade de duplicata apos crash. Retry limitado, backoff e dead letter sao politicas explicitas do consumer. Nao se assume ordenacao global; ordenacao por agregado so pode ser declarada com versao/sequencia e suporte do adapter.

Snapshots de contexto sao correlacao, nao credenciais. Consumers revalidam autorizacao relevante e tenant antes de executar acoes. Subscribers nao usam identidade system generica para ampliar permissao. Assinatura de eventos de outro modulo depende de contrato publico e scope declarado.

Fluxo conceitual:

Domain Commit + Outbox -> Relay -> Event Transport -> Scoped Consumer -> Acknowledge.

## 4. Contratos publicos

Nomes propostos, ainda nao exportados nem garantidos como API estavel:

| Contrato proposto                    | Responsabilidade                                |
| ------------------------------------ | ----------------------------------------------- |
| EventDefinition / EventSchemaVersion | Owner, nome, versao e compatibilidade           |
| EventTransportPort                   | Publicacao e acknowledgement por capability     |
| DeliveryPolicy / DeliveryResult      | Retry, falha permanente e diagnosticos          |
| Outbox / ConsumerDeduplication ports | Entrega duravel futura sem tecnologia no Kernel |

Novos tokens, entradas e resultados devem ser fixados por IMP apos aprovacao arquitetural. Resultados esperados devem distinguir sucesso, negativa, conflito, indisponibilidade e entrada invalida quando aplicavel.

## 5. Seguranca e observabilidade

Contexto operacional nao e prova de autorizacao. Tenant/workspace, principal e permissoes precisam de origem confiavel em operacoes protegidas. Nao registrar secrets, credenciais ou payloads sensiveis em diagnostics. Falhas esperadas produzem codigo seguro, resultado e correlacao. Auditoria duravel nao pode ser prometida pelo provider em memoria.

Revisoes de contratos e resultados devem permitir rastrear operacao, owner, requestId/correlationId e scope quando aplicavel. A RFC-0017 propoe portas de sinais; sua ausencia nao dispensa erros seguros no MVP.

## 6. Compatibilidade e alternativas

A proposta e aditiva; nao remove nem altera exports atuais. Consumo de nova capacidade depende de declaracao explicita, nunca de deteccao silenciosa. Contratos publicados preservam semantica e versionamento; incompatibilidade exige major, migracao e nova revisao conforme RFC-0099.

Forward compatibility nao permite ignorar campos de seguranca, capabilities obrigatorias ou versoes desconhecidas: estes casos falham de forma explicita. Migracao e rollout sao responsabilidade do IMP consumidor; nao ha migracao executada nesta alteracao documental.

Alternativas consideradas: acoplar a capacidade ao Admin simplifica o primeiro consumidor, mas impede reuso e viola as fronteiras; expandir implicitamente contratos existentes evita novos nomes, mas esconde mudanca de semantica. A proposta prefere portas pequenas e explicitas.

## 7. Criterios de aceite

- Preservar testes e contrato do Event Bus em memoria.
- Duplicar evento nao repete efeito confirmado no consumer duravel.
- Crash apos publish antes de ack permite redelivery sem perda silenciosa.
- Evento de tenant A nao executa acao no tenant B.
- Retry esgotado produz falha observavel e politica de replay controlada.
- Compatibilidade de payload e checada por versao, sem mutar schema publicado.

## 8. Riscos e decisoes pendentes

Outbox, deduplicacao e relay dependem da RFC-0020; selecao do transporte e limites de retry devem ser ADR/IMP posteriores. Dispatch local nao depende de banco.

Escopo excessivo e aprovacao conjunta sem revisar dependencias podem criar falsa prontidao. Aprovar a RFC nao significa aprovar todos os adapters ou IMPs consumidores. A sequencia esta em [Implementation Roadmap](../docs/IMPLEMENTATION-ROADMAP.md).

## 9. Glossario e referencias

Outbox: fatos gravados com a transacao. At-least-once: evento pode ser entregue novamente. Dead letter: registro de entrega que esgotou tentativas.

Dependencias normativas: RFC-0002, RFC-0003, RFC-0004, RFC-0099. Relacoes de consumo e dependencias opcionais estao no [Dependency Graph](../docs/DEPENDENCY-GRAPH.md). A [revisao documental](../docs/DOCUMENTATION-REVIEW.md) registra compatibilidade preliminar e bloqueios. Decisoes desta RFC permanecem propostas ate aprovacao.

## 10. Revisao e aprovacao

- [x] Objetivo, escopo, contratos, alternativas e criterios de aceite documentados.
- [x] Riscos, seguranca, tenancy e compatibilidade avaliados preliminarmente.
- [ ] Owners/reviewers nominais designados.
- [ ] Dependencias Draft aprovadas para a entrega pretendida.
- [ ] Cross Review formal concluido pelos owners afetados.
- [ ] Pendencias do IMP correspondente resolvidas.
- [ ] Decisao de aprovacao registrada pelo Architecture Owner.

Historico: 2026-10-24 — proposta documental preparada por Codex; sem implementacao, aprovacao ou mudanca de status de contratos existentes.
