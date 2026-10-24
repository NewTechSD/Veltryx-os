# RFC-0009: Builder e Application Model

Status: Draft

Version: 0.1

Type: RFC arquitetural

Owner: Architecture Owner (designacao nominal pendente)

Reviewers: Maintainers dos contratos impactados (designacao pendente)

Created: 2026-10-24

Last Updated: 2026-10-24

Depends On: RFC-0001, RFC-0003, RFC-0005, RFC-0006, RFC-0007, RFC-0099

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

O Admin ja renderiza Composition Trees, mas nao existe contrato operacional de aplicacao nem editor. Esta proposta define o modelo declarativo que o Builder edita e o Runtime consome. Publicacao para delivery continua exclusivamente sob RFC-0008.

## 2. Objetivos e fronteiras

Editor de metadata e ativacao interna; sem renderer concreto, plugin WordPress, deploy ou execucao de scripts.

A capacidade pertence ao owner descrito pelos contratos; transporte, UI e infraestrutura concreta ficam nas bordas. Modules e Plugins consomem apenas contratos publicos. Nenhuma regra de negocio passa a pertencer ao Kernel por esta proposta.

## 3. Arquitetura proposta

Application Definition identifica aplicacao, namespace, owner, versao, dependencias de modulos, entradas de navegacao e referencias versionadas a metadata, componentes e acoes. Site Schema especializa a representacao declarativa de paginas; nao constitui um formato executavel.

Builder edita uma revisao Draft. Validacao verifica estrutura, referencias, permissoes declaradas, compatibilidade de versoes e capabilities. Uma revisao validada pode ser ativada no Control Plane por uma operacao autorizada. Ativacao interna nao equivale a publicar um site.

Revisoes ativas sao imutaveis. Uma edicao cria revisao sucessora com identificacao da revisao base. Edicoes concorrentes nao sobrescrevem silenciosamente a revisao base: retornam conflito. O Runtime resolve uma revisao explicita e mantem os scopes do contexto; habilitar um modulo nao concede acesso aos seus recursos.

O MVP documental cobre paginas, formularios, listas e menus que ja possuem contratos de metadata. Canvas visual, undo/redo e colaboracao simultanea sao consumidores futuros, sem alterar a fonte declarativa.

Fluxo conceitual:

Builder -> Application Revision -> Validation -> Metadata Registry -> Runtime.

## 4. Contratos publicos

Nomes propostos, ainda nao exportados nem garantidos como API estavel:

| Contrato proposto                           | Responsabilidade                                                       |
| ------------------------------------------- | ---------------------------------------------------------------------- |
| ApplicationDefinition / ApplicationRevision | Identidade, revisao base, versao de schema, referencias e lifecycle    |
| ApplicationValidationResult                 | Erros de referencia, capabilities e compatibilidade sem executar acoes |
| ApplicationResolver                         | Resolver revisao ativa no contexto autorizado por contratos publicos   |
| ApplicationActivationResult                 | Revisao ativada ou conflito; nenhum deploy implicito                   |

Novos tokens, entradas e resultados devem ser fixados por IMP apos aprovacao arquitetural. Resultados esperados devem distinguir sucesso, negativa, conflito, indisponibilidade e entrada invalida quando aplicavel.

## 5. Seguranca e observabilidade

Contexto operacional nao e prova de autorizacao. Tenant/workspace, principal e permissoes precisam de origem confiavel em operacoes protegidas. Nao registrar secrets, credenciais ou payloads sensiveis em diagnostics. Falhas esperadas produzem codigo seguro, resultado e correlacao. Auditoria duravel nao pode ser prometida pelo provider em memoria.

Revisoes de contratos e resultados devem permitir rastrear operacao, owner, requestId/correlationId e scope quando aplicavel. A RFC-0017 propoe portas de sinais; sua ausencia nao dispensa erros seguros no MVP.

## 6. Compatibilidade e alternativas

A proposta e aditiva; nao remove nem altera exports atuais. Consumo de nova capacidade depende de declaracao explicita, nunca de deteccao silenciosa. Contratos publicados preservam semantica e versionamento; incompatibilidade exige major, migracao e nova revisao conforme RFC-0099.

Forward compatibility nao permite ignorar campos de seguranca, capabilities obrigatorias ou versoes desconhecidas: estes casos falham de forma explicita. Migracao e rollout sao responsabilidade do IMP consumidor; nao ha migracao executada nesta alteracao documental.

Alternativas consideradas: acoplar a capacidade ao Admin simplifica o primeiro consumidor, mas impede reuso e viola as fronteiras; expandir implicitamente contratos existentes evita novos nomes, mas esconde mudanca de semantica. A proposta prefere portas pequenas e explicitas.

## 7. Criterios de aceite

- Rejeitar callback, import de framework e referencia interna de modulo em definicoes.
- Demonstrar que rascunho nao altera revisao ativa nem a Composition Tree existente.
- Duas edicoes da mesma base produzem conflito, sem perda silenciosa.
- Resolver aplicacao sem permissao falha sem expor conteudo restrito.
- Ativar revisao nao chama publish/deploy de Runtime Adapter.

## 8. Riscos e decisoes pendentes

Limites quantitativos de revisoes e formato serializado inicial devem constar no IMP; persistencia concorrente depende da RFC-0020. Publicacao externa depende da RFC-0008.

Escopo excessivo e aprovacao conjunta sem revisar dependencias podem criar falsa prontidao. Aprovar a RFC nao significa aprovar todos os adapters ou IMPs consumidores. A sequencia esta em [Implementation Roadmap](../docs/IMPLEMENTATION-ROADMAP.md).

## 9. Glossario e referencias

Application Definition: contrato declarativo de uma aplicacao. Revision: snapshot imutavel de uma edicao. Activation: selecao de revisao no Control Plane.

Dependencias normativas: RFC-0001, RFC-0003, RFC-0005, RFC-0006, RFC-0007, RFC-0099. Relacoes de consumo e dependencias opcionais estao no [Dependency Graph](../docs/DEPENDENCY-GRAPH.md). A [revisao documental](../docs/DOCUMENTATION-REVIEW.md) registra compatibilidade preliminar e bloqueios. Decisoes desta RFC permanecem propostas ate aprovacao.

## 10. Revisao e aprovacao

- [x] Objetivo, escopo, contratos, alternativas e criterios de aceite documentados.
- [x] Riscos, seguranca, tenancy e compatibilidade avaliados preliminarmente.
- [ ] Owners/reviewers nominais designados.
- [ ] Dependencias Draft aprovadas para a entrega pretendida.
- [ ] Cross Review formal concluido pelos owners afetados.
- [ ] Pendencias do IMP correspondente resolvidas.
- [ ] Decisao de aprovacao registrada pelo Architecture Owner.

Historico: 2026-10-24 — proposta documental preparada por Codex; sem implementacao, aprovacao ou mudanca de status de contratos existentes.
