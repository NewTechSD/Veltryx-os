# RFC-0014: Query Engine

Status: Draft

Version: 0.1

Type: RFC arquitetural

Owner: Architecture Owner (designacao nominal pendente)

Reviewers: Maintainers dos contratos impactados (designacao pendente)

Created: 2026-10-24

Last Updated: 2026-10-24

Depends On: RFC-0004, RFC-0005, RFC-0006, RFC-0010, RFC-0015, RFC-0099

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

IRepository oferece leitura basica sem joins, ordenacao ou filtros de negocio. Esta proposta define consulta declarativa controlada; ela nao estende implicitamente o contrato aprovado pela RFC-0015.

## 2. Objetivos e fronteiras

Leitura declarativa; sem SQL publico, joins, escrita, relatorios financeiros ou acesso a storage interno de modulo.

A capacidade pertence ao owner descrito pelos contratos; transporte, UI e infraestrutura concreta ficam nas bordas. Modules e Plugins consomem apenas contratos publicos. Nenhuma regra de negocio passa a pertencer ao Kernel por esta proposta.

## 3. Arquitetura proposta

Query Definition referencia entidade/recurso publico, campos projetados, filtros tipados, ordenacao e paginacao. Apenas fields e operadores explicitamente suportados pelo owner podem ser usados. SQL, expressoes executaveis e nomes fisicos de tabelas sao rejeitados.

O pipeline valida contexto e permission, resolve metadata, aplica filtros obrigatorios de tenant/workspace, valida fields, aplica limite e delega para um Query Provider. Filtros de cliente so restringem o resultado; nunca removem o scope obrigatorio. Contagem usa os mesmos filtros de autorizacao.

A primeira versao propoe operadores eq, in, gt, gte, lt e lte em campos escalares compativeis, ordenacao estavel com desempate por id, limit de 1 a 100 e offset nao negativo. Provider declara capabilities; operador nao suportado retorna erro, nunca filtro ignorado. Sem joins e sem agregacoes nesta versao.

O retorno contem itens autorizados, limit/offset e total somente quando o provider conseguir calcular com os mesmos filtros. Total indisponivel deve ser explicito. Field negado nao aparece em itens, ordenacao ou mensagem de erro; diagnosticos nao incluem valores de filtro sensiveis.

Fluxo conceitual:

Query + Trusted Context -> Authorization -> Scoped Plan -> Query Provider -> Projection.

## 4. Contratos publicos

Nomes propostos, ainda nao exportados nem garantidos como API estavel:

| Contrato proposto             | Responsabilidade                              |
| ----------------------------- | --------------------------------------------- |
| QueryDefinition / QueryInput  | Projecao, filtros tipados, ordenacao e pagina |
| QueryCapabilities             | Operadores e limites realmente suportados     |
| IQueryProvider                | Executar somente plano validado e escopado    |
| QueryResult / QueryDiagnostic | Itens sanitizados ou falha segura, sem SQL    |

Novos tokens, entradas e resultados devem ser fixados por IMP apos aprovacao arquitetural. Resultados esperados devem distinguir sucesso, negativa, conflito, indisponibilidade e entrada invalida quando aplicavel.

## 5. Seguranca e observabilidade

Contexto operacional nao e prova de autorizacao. Tenant/workspace, principal e permissoes precisam de origem confiavel em operacoes protegidas. Nao registrar secrets, credenciais ou payloads sensiveis em diagnostics. Falhas esperadas produzem codigo seguro, resultado e correlacao. Auditoria duravel nao pode ser prometida pelo provider em memoria.

Revisoes de contratos e resultados devem permitir rastrear operacao, owner, requestId/correlationId e scope quando aplicavel. A RFC-0017 propoe portas de sinais; sua ausencia nao dispensa erros seguros no MVP.

## 6. Compatibilidade e alternativas

A proposta e aditiva; nao remove nem altera exports atuais. Consumo de nova capacidade depende de declaracao explicita, nunca de deteccao silenciosa. Contratos publicados preservam semantica e versionamento; incompatibilidade exige major, migracao e nova revisao conforme RFC-0099.

Forward compatibility nao permite ignorar campos de seguranca, capabilities obrigatorias ou versoes desconhecidas: estes casos falham de forma explicita. Migracao e rollout sao responsabilidade do IMP consumidor; nao ha migracao executada nesta alteracao documental.

Alternativas consideradas: acoplar a capacidade ao Admin simplifica o primeiro consumidor, mas impede reuso e viola as fronteiras; expandir implicitamente contratos existentes evita novos nomes, mas esconde mudanca de semantica. A proposta prefere portas pequenas e explicitas.

## 7. Criterios de aceite

- Cliente nao remove nem substitui scope de tenant/workspace.
- Field negado nao pode filtrar, ordenar ou aparecer no retorno.
- Operador/tipo nao suportado falha explicitamente.
- Paginacao respeita limites e ordenacao deterministica em dados estaveis.
- Contagem nao revela objetos de outro tenant.
- Falha de provider gera erro sanitizado sem SQL, payload ou credenciais.

## 8. Riscos e decisoes pendentes

Cursor e consistencia entre paginas mutaveis ficam para evolucao. Adaptacao HTTP futura depende de extensao aprovada da RFC-0013, que hoje so cobre leituras estruturais.

Escopo excessivo e aprovacao conjunta sem revisar dependencias podem criar falsa prontidao. Aprovar a RFC nao significa aprovar todos os adapters ou IMPs consumidores. A sequencia esta em [Implementation Roadmap](../docs/IMPLEMENTATION-ROADMAP.md).

## 9. Glossario e referencias

Projection: campos autorizados do retorno. Scoped plan: plano com filtros obrigatorios. Capability: operacao suportada pelo provider.

Dependencias normativas: RFC-0004, RFC-0005, RFC-0006, RFC-0010, RFC-0015, RFC-0099. Relacoes de consumo e dependencias opcionais estao no [Dependency Graph](../docs/DEPENDENCY-GRAPH.md). A [revisao documental](../docs/DOCUMENTATION-REVIEW.md) registra compatibilidade preliminar e bloqueios. Decisoes desta RFC permanecem propostas ate aprovacao.

## 10. Revisao e aprovacao

- [x] Objetivo, escopo, contratos, alternativas e criterios de aceite documentados.
- [x] Riscos, seguranca, tenancy e compatibilidade avaliados preliminarmente.
- [ ] Owners/reviewers nominais designados.
- [ ] Dependencias Draft aprovadas para a entrega pretendida.
- [ ] Cross Review formal concluido pelos owners afetados.
- [ ] Pendencias do IMP correspondente resolvidas.
- [ ] Decisao de aprovacao registrada pelo Architecture Owner.

Historico: 2026-10-24 — proposta documental preparada por Codex; sem implementacao, aprovacao ou mudanca de status de contratos existentes.
