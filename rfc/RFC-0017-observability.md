# RFC-0017: Observability

Status: Draft

Version: 0.1

Type: RFC arquitetural

Owner: Architecture Owner (designacao nominal pendente)

Reviewers: Maintainers dos contratos impactados (designacao pendente)

Created: 2026-10-24

Last Updated: 2026-10-24

Depends On: RFC-0001, RFC-0002, RFC-0004, RFC-0099

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

Snapshots e diagnostics existentes mostram estado estrutural; nao representam observabilidade operacional completa. A proposta define sinais e portas substituiveis sem acoplar Kernel a um exporter.

## 2. Objetivos e fronteiras

Sinais operacionais e readiness; sem substituir auditoria de negocio, selecionar SaaS, instalar Prometheus ou alterar endpoint existente automaticamente.

A capacidade pertence ao owner descrito pelos contratos; transporte, UI e infraestrutura concreta ficam nas bordas. Modules e Plugins consomem apenas contratos publicos. Nenhuma regra de negocio passa a pertencer ao Kernel por esta proposta.

## 3. Arquitetura proposta

Uma porta de observabilidade recebe eventos estruturados, metricas e spans, com implementacao no-op disponivel. Falha do exporter nao derruba a operacao de dominio nem altera resultado. Auditoria de seguranca e responsabilidade distinta, com politica de durabilidade propria.

Logs seguem allowlist de timestamp, severity, code, subsystem, operation, duration, outcome, requestId e correlationId. Identificadores de principal/tenant sao incluidos somente no canal restrito e quando necessarios. Senhas, tokens, cookies, claims completos, payloads de negocio e env bruto nunca sao registrados.

Metricas usam labels de cardinalidade limitada por subsystem, operacao e resultado. userId, requestId, tenantId arbitrario e URLs livres nao viram labels. Spans usam propagacao validada; correlationId recebido nao concede confianca nem permissao.

Liveness informa que o processo responde; readiness informa se dependencias obrigatorias da capacidade estao prontas. O /health atual e liveness, nao comprovacao de banco ou autenticacao. SLIs propostos sao disponibilidade, latencia e taxa de erros; metas numericas dependem de medicao e aprovacao operacional.

Fluxo conceitual:

Kernel / Adapter -> Safe Signal Port -> Redaction + Limits -> Exporter.

## 4. Contratos publicos

Nomes propostos, ainda nao exportados nem garantidos como API estavel:

| Contrato proposto                             | Responsabilidade                                   |
| --------------------------------------------- | -------------------------------------------------- |
| ObservabilityPort / NoOpObserver              | Receber sinais sem dependencia de ferramenta       |
| SafeLogEvent / MetricObservation / SpanHandle | Dados classificados e limitados                    |
| ReadinessCheck / ReadinessReport              | Disponibilidade de dependencias obrigatorias       |
| SignalPolicy                                  | Redacao, sampling, limites e retencao por ambiente |

Novos tokens, entradas e resultados devem ser fixados por IMP apos aprovacao arquitetural. Resultados esperados devem distinguir sucesso, negativa, conflito, indisponibilidade e entrada invalida quando aplicavel.

## 5. Seguranca e observabilidade

Contexto operacional nao e prova de autorizacao. Tenant/workspace, principal e permissoes precisam de origem confiavel em operacoes protegidas. Nao registrar secrets, credenciais ou payloads sensiveis em diagnostics. Falhas esperadas produzem codigo seguro, resultado e correlacao. Auditoria duravel nao pode ser prometida pelo provider em memoria.

Revisoes de contratos e resultados devem permitir rastrear operacao, owner, requestId/correlationId e scope quando aplicavel. A RFC-0017 propoe portas de sinais; sua ausencia nao dispensa erros seguros no MVP.

## 6. Compatibilidade e alternativas

A proposta e aditiva; nao remove nem altera exports atuais. Consumo de nova capacidade depende de declaracao explicita, nunca de deteccao silenciosa. Contratos publicados preservam semantica e versionamento; incompatibilidade exige major, migracao e nova revisao conforme RFC-0099.

Forward compatibility nao permite ignorar campos de seguranca, capabilities obrigatorias ou versoes desconhecidas: estes casos falham de forma explicita. Migracao e rollout sao responsabilidade do IMP consumidor; nao ha migracao executada nesta alteracao documental.

Alternativas consideradas: acoplar a capacidade ao Admin simplifica o primeiro consumidor, mas impede reuso e viola as fronteiras; expandir implicitamente contratos existentes evita novos nomes, mas esconde mudanca de semantica. A proposta prefere portas pequenas e explicitas.

## 7. Criterios de aceite

- Exporter indisponivel nao muda resultado de dominio.
- Fixtures com tokens, senha e payload sensivel nao aparecem nos sinais.
- Limitar cardinalidade, tamanho e buffer sob carga.
- Readiness falha quando dependencia obrigatoria esta indisponivel.
- Correlacao atravessa adapter, Runtime e provider sem criar permissao.
- Logs publicos e canais restritos possuem projecoes diferentes.

## 8. Riscos e decisoes pendentes

Retencao, acesso aos logs, sampling, budgets e metas SLO sao decisoes operacionais pendentes antes de producao. Observability nao promete integridade probatoria de auditoria.

Escopo excessivo e aprovacao conjunta sem revisar dependencias podem criar falsa prontidao. Aprovar a RFC nao significa aprovar todos os adapters ou IMPs consumidores. A sequencia esta em [Implementation Roadmap](../docs/IMPLEMENTATION-ROADMAP.md).

## 9. Glossario e referencias

SLI: medida operacional. SLO: meta aprovada. Readiness: capacidade de atender. Liveness: processo responsivo.

Dependencias normativas: RFC-0001, RFC-0002, RFC-0004, RFC-0099. Relacoes de consumo e dependencias opcionais estao no [Dependency Graph](../docs/DEPENDENCY-GRAPH.md). A [revisao documental](../docs/DOCUMENTATION-REVIEW.md) registra compatibilidade preliminar e bloqueios. Decisoes desta RFC permanecem propostas ate aprovacao.

## 10. Revisao e aprovacao

- [x] Objetivo, escopo, contratos, alternativas e criterios de aceite documentados.
- [x] Riscos, seguranca, tenancy e compatibilidade avaliados preliminarmente.
- [ ] Owners/reviewers nominais designados.
- [ ] Dependencias Draft aprovadas para a entrega pretendida.
- [ ] Cross Review formal concluido pelos owners afetados.
- [ ] Pendencias do IMP correspondente resolvidas.
- [ ] Decisao de aprovacao registrada pelo Architecture Owner.

Historico: 2026-10-24 — proposta documental preparada por Codex; sem implementacao, aprovacao ou mudanca de status de contratos existentes.
