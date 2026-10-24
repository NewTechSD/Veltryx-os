# RFC-0019: Autenticacao operacional e tenancy

Status: Draft

Version: 0.1

Type: RFC arquitetural

Owner: Architecture Owner (designacao nominal pendente)

Reviewers: Maintainers dos contratos impactados (designacao pendente)

Created: 2026-10-24

Last Updated: 2026-10-24

Depends On: RFC-0001, RFC-0002, RFC-0004, RFC-0010, RFC-0011, RFC-0020, RFC-0099

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

A RFC-0011 aprova apenas estrutura de identidade e scope. Login, sessao verificavel, memberships e isolamento continuam ausentes. Esta proposta complementa a fundacao sem alterar seu fallback de leitura publica.

## 2. Objetivos e fronteiras

Login e isolamento operacional; sem MFA/SSO imediato, UI de administracao completa, bypass de plataforma ou alteracao da leitura publica existente nesta revisao.

A capacidade pertence ao owner descrito pelos contratos; transporte, UI e infraestrutura concreta ficam nas bordas. Modules e Plugins consomem apenas contratos publicos. Nenhuma regra de negocio passa a pertencer ao Kernel por esta proposta.

## 3. Arquitetura proposta

Identity Provider valida credencial por adapter e retorna identidade verificavel. Session Service cria sessao revogavel com validade, rotacao e logout. O adapter HTTP transporta credenciais e aplica protecoes de transporte; Kernel recebe contexto validado, nunca senha ou cookie bruto.

Para o Admin web, a proposta inicial e sessao opaca revogavel no servidor e cookie HttpOnly, Secure em HTTPS e SameSite adequado ao fluxo, com CSRF em mutacoes. Credenciais de senha, se adotadas, exigem hash especializado, rate limit e recuperacao segura; escolher algoritmo/biblioteca fica no IMP e ADR apropriados. Tokens nunca aparecem em snapshots.

Tenant Resolver verifica membership ativa do principal; Workspace Resolver verifica que o workspace pertence ao tenant e que o principal tem acesso. Headers/cookies de selecao sao hints e nao fonte de autoridade. Ausencia de tenant em operacao protegida nega acesso; nao cria PLATFORM_ADMIN nem system. Administracao da plataforma exige concessao explicita e auditada distinta da membership de tenant.

O contexto validado e a unica origem de scope nos recursos protegidos. Repositories scoped aplicam tenant em get/list/count/update/delete e nao dependem apenas de metadata tenantId opcional. Identidade de recurso nao pertencente ao scope retorna erro seguro sem confirmar sua existencia.

Rotas publicas de liveness podem usar anonymous/default/default. Rotas protegidas retornam 401 sem sessao valida e 403 sem concessao, ou 404 conforme politica de ocultacao. Falha do provider ou membership indisponivel nega acesso. Revogacao invalida contexto/cache antes da proxima operacao protegida.

Fluxo conceitual:

Credential Adapter -> Verified Session -> Active Membership -> Permission Decision -> Scoped Resource.

## 4. Contratos publicos

Nomes propostos, ainda nao exportados nem garantidos como API estavel:

| Contrato proposto                      | Responsabilidade                                               |
| -------------------------------------- | -------------------------------------------------------------- |
| IdentityProvider / SessionService      | Verificar identidade, validade, revogacao e rotacao            |
| TenantMembership / WorkspaceMembership | Vinculos ativos e verificaveis                                 |
| AuthorizedContextResolver              | Resolver scope e integrar Principal/AuthContext existentes     |
| ScopedDataAccessPort                   | Impedir acesso entre tenants em todas as operacoes             |
| SecurityAuditPort                      | Registrar eventos seguros de login, revogacao e troca de scope |

Novos tokens, entradas e resultados devem ser fixados por IMP apos aprovacao arquitetural. Resultados esperados devem distinguir sucesso, negativa, conflito, indisponibilidade e entrada invalida quando aplicavel.

## 5. Seguranca e observabilidade

Contexto operacional nao e prova de autorizacao. Tenant/workspace, principal e permissoes precisam de origem confiavel em operacoes protegidas. Nao registrar secrets, credenciais ou payloads sensiveis em diagnostics. Falhas esperadas produzem codigo seguro, resultado e correlacao. Auditoria duravel nao pode ser prometida pelo provider em memoria.

Revisoes de contratos e resultados devem permitir rastrear operacao, owner, requestId/correlationId e scope quando aplicavel. A RFC-0017 propoe portas de sinais; sua ausencia nao dispensa erros seguros no MVP.

## 6. Compatibilidade e alternativas

A proposta e aditiva; nao remove nem altera exports atuais. Consumo de nova capacidade depende de declaracao explicita, nunca de deteccao silenciosa. Contratos publicados preservam semantica e versionamento; incompatibilidade exige major, migracao e nova revisao conforme RFC-0099.

Forward compatibility nao permite ignorar campos de seguranca, capabilities obrigatorias ou versoes desconhecidas: estes casos falham de forma explicita. Migracao e rollout sao responsabilidade do IMP consumidor; nao ha migracao executada nesta alteracao documental.

Alternativas consideradas: acoplar a capacidade ao Admin simplifica o primeiro consumidor, mas impede reuso e viola as fronteiras; expandir implicitamente contratos existentes evita novos nomes, mas esconde mudanca de semantica. A proposta prefere portas pequenas e explicitas.

## 7. Criterios de aceite

- Login invalido nao revela se usuario existe; limitar tentativas.
- Sessao expirada ou revogada nao executa operacao protegida.
- Alterar header, cookie de selecao ou id de objeto nao cruza tenants.
- Principal autenticado sem membership nao recebe administracao de plataforma.
- Workspace de outro tenant e rejeitado, inclusive em list/count e mutacoes.
- Logout revoga sessao; CSRF em mutacao e rejeitado.
- Secrets nao aparecem em logs, snapshots, resposta ou bundle cliente.

## 8. Riscos e decisoes pendentes

Provider de identidade, TTL, recuperacao de conta, primeiro administrador e politica de convites precisam de decisao explicita no IMP operacional. Nenhuma tecnologia escolhida por esta proposta foi implementada.

Escopo excessivo e aprovacao conjunta sem revisar dependencias podem criar falsa prontidao. Aprovar a RFC nao significa aprovar todos os adapters ou IMPs consumidores. A sequencia esta em [Implementation Roadmap](../docs/IMPLEMENTATION-ROADMAP.md).

## 9. Glossario e referencias

Membership: vinculo verificavel. Scope: limite de acesso. Opaque session: identificador sem claims de autoridade no cliente.

Dependencias normativas: RFC-0001, RFC-0002, RFC-0004, RFC-0010, RFC-0011, RFC-0020, RFC-0099. Relacoes de consumo e dependencias opcionais estao no [Dependency Graph](../docs/DEPENDENCY-GRAPH.md). A [revisao documental](../docs/DOCUMENTATION-REVIEW.md) registra compatibilidade preliminar e bloqueios. Decisoes desta RFC permanecem propostas ate aprovacao.

## 10. Revisao e aprovacao

- [x] Objetivo, escopo, contratos, alternativas e criterios de aceite documentados.
- [x] Riscos, seguranca, tenancy e compatibilidade avaliados preliminarmente.
- [ ] Owners/reviewers nominais designados.
- [ ] Dependencias Draft aprovadas para a entrega pretendida.
- [ ] Cross Review formal concluido pelos owners afetados.
- [ ] Pendencias do IMP correspondente resolvidas.
- [ ] Decisao de aprovacao registrada pelo Architecture Owner.

Historico: 2026-10-24 — proposta documental preparada por Codex; sem implementacao, aprovacao ou mudanca de status de contratos existentes.
