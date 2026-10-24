# Revisao da documentacao e continuidade

Data: 2026-10-24. Autor da analise: Codex. Baseline: `main` em `936ddd41f251f4374500561f7d269865d0cb760e`.

## Resultado

O repositorio possui base de plataforma implementada ate IMP-0033, mas sua navegacao e planejamento ainda descreviam bootstrap e misturavam etapas futuras com entregas presentes. Foram atualizados indice, README, roadmap, grafo, referencia de API e runbook. As sete RFCs numeradas e ausentes foram escritas como Draft; RFC-0008 Draft recebeu complemento de revisao. Duas propostas complementares tratam auth/tenancy operacional e dados duraveis.

Documentacao preparada para revisao nao significa arquitetura aprovada nem plataforma pronta para dados reais. Nenhuma RFC Approved/Frozen foi modificada e nenhum codigo de producao foi alterado.

## Achados e tratamento

| Achado                                               | Evidencia                                                                      | Tratamento nesta revisao                                           | Pendente                                                |
| ---------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------- |
| README em SPRINT-0002B e indice aguardando bootstrap | README/indice versus historico ate `936ddd4`                                   | Estado atualizado e baseline identificada                          | Aceite operacional de release nao foi inferido          |
| Sete RFCs previstas sem arquivo                      | 0009, 0010, 0012, 0014, 0016, 0017, 0018 ausentes na tree                      | Drafts com escopo, contratos, riscos e aceite                      | Cross Review e aprovacao                                |
| Numeros de IMP reutilizados                          | Antigo roadmap versus SPRINT-0002 e docs tecnicos                              | Registro explicito de colisoes; planos antigos marcados historicos | Interpretar legado por caminho/titulo/task              |
| Grafo nomeava RFC-0008 como Builder                  | Dependency Graph versus arquivo RFC-0008 e ADR-0004                            | Corrigido para Runtime Abstraction/Platform Adapters               | RFC-0008 segue Draft                                    |
| Auth estrutural confundivel com login/isolamento     | AuthBridge cria anonymous/system, sem membership                               | Estado e limites documentados; RFC-0019 proposta                   | Implementacao operacional futura                        |
| Hints e `meta.auth` nao sao autoridade               | HTTP requestContext + RuntimeApiBridge.meta                                    | Referencia de API explica origem dos campos                        | Enforcement por contrato confiavel                      |
| Persistencia em memoria confundivel com banco        | InMemoryPersistenceProvider e RFC-0015                                         | Limites explicitados; RFC-0020 proposta                            | Adapter externo, transacoes, restore e isolamento       |
| Instructions de deploy divergentes                   | Guia antigo: 3000/path diferente/bind presumido; PM2: 3100/path atual/sem host | Runbook alinhado e bind identificado como verificacao              | Conferir host, firewall, proxy e executavel no servidor |
| Paginacao descrita sem distinguir bridge/HTTP        | Rotas passam `{}`; bridge valida input                                         | Limite de query string documentado                                 | Adapter/testes HTTP futuros                             |
| Bootstrap fora do catch HTTP                         | GET aguarda getRuntimeApiBridge antes de handleApi                             | Lacuna registrada na referencia de API                             | Correcao de codigo por tarefa futura                    |
| Kernel novo por chamada API                          | getRuntimeApiBridge cria/bootstrappa Kernel                                    | Limite de estado/contadores documentado                            | Politica de lifecycle compartilhado se requerida        |
| Defaults de contexto diferentes                      | Factory legado usa system; AuthBridge usa default/default                      | Nota tecnica em Execution Context e estado                         | Nao tratar defaults como autorizacao                    |
| Artefatos literais de newline PowerShell             | Trechos `r`n em Markdown                                                       | Corrigidos em docs tecnicos afetados                               | Nenhum contrato alterado                                |
| Plano de proxima etapa ausente                       | IMP-0033 e ultima autorizacao                                                  | IMP-0034/TASK-0318 v0.2 detalhado e Blocked                        | Aprovar RFC-0010 e o plano antes de codigo              |
| Finance Core de outro contexto nao localizado        | Tree, contratos e historico deste repositorio                                  | Separacao de escopo no README/status                               | Nao importar arquitetura/estado sem analise propria     |

## Cross Review preliminar das propostas

Esta e uma comparacao documental preliminar com as decisoes registradas nas RFCs fundacionais, RFC-0011/0013/0015 e ADR-0004. Nao equivale ao Cross Review formal pelos owners exigido na RFC-0099.

| Proposta      | Base comparada                             | Compatibilidade pretendida                                               | Bloqueio para aprovacao                                                                           |
| ------------- | ------------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| RFC-0008 v0.2 | RFC-0005/0006/0007 + ADR-0004              | Schema e Composition Tree universais; mapping na borda                   | Artifact manifest, capabilities, primeiro target e secrets                                        |
| RFC-0009      | RFC-0003/0005/0006/0007 + ADR-0004         | Builder edita declaracoes e nao instancia componentes                    | Persistencia de revisoes, ativacao, concorrencia e formato do MVP                                 |
| RFC-0010      | RFC-0001/0002/0004/0006 + RFC-0011         | Negacao por padrao; identidade estrutural nao concede grant              | Contratos/tokens/codigos fixados na v0.2; revisao tecnica registrada; aprovacao do owner pendente |
| RFC-0012      | RFC-0004/0006 e propostas 0010/0016/0020   | Workflow coordena services publicos, sem regra de dominio no Core        | Atomicidade, idempotencia e recuperacao duravel                                                   |
| RFC-0014      | RFC-0005/0006/0015 e proposta 0010         | Query e porta adicional; nao altera IRepository implicitamente           | Capabilities e scope; API de dados futura nao coberta pela 0013                                   |
| RFC-0016      | RFC-0002/0003/0004 e Event Bus atual       | Preserva dispatch local; entrega duravel e capacidade distinta           | Outbox/relay/transport, dedupe e limites de retry                                                 |
| RFC-0017      | RFC-0001/0002/0004 e snapshots atuais      | Portas sem SDK concreto no Kernel; no-op e falhas isoladas               | Sampling, retencao, acesso aos sinais e metas operacionais                                        |
| RFC-0018      | RFC-0001 e proposta 0017; runbook PM2      | Release do Control Plane separada de delivery                            | SLO, RPO/RTO, backup/restore, artefato e rollout                                                  |
| RFC-0019      | RFC-0001/0011 e propostas 0010/0020        | Complementa identity foundation; nao altera leitura publica por surpresa | Provider, sessoes, memberships, primeiro admin, CSRF e scoped data                                |
| RFC-0020      | RFC-0001/0015 e guardrails de persistencia | Portas aditivas externas para durabilidade/consistencia                  | Adapter, tenancy fisica, isolation level, migrations e conexoes                                   |

Nao foram identificadas contradicoes intencionais com as regras citadas na revisao preliminar. Isso nao certifica completude arquitetural. As dependencias Draft e escolhas de IMP continuam explicitas. As propostas nao introduzem tecnologia nova na stack; materializar PostgreSQL/Prisma fora do Kernel exige plano proprio, mesmo com a stack prevista na Foundation.

## O que esta pronto para o proximo passo

- Navegacao e estado correspondentes ao codigo observado.
- Lacunas de implementacao distinguidas de falhas documentais.
- Propostas arquiteturais para todas as RFCs numeradas no roadmap inicial.
- Complementos operacionais identificados, sem editar RFC aprovada.
- Plano limitado e testavel para o Permission Engine Foundation.
- Criterios para avaliar sucesso, conflitos, seguranca, tenancy e falhas.

## Decisoes que ainda pertencem aos owners

1. Designar Architecture Owner e reviewers nominais; nomes de equipe em documentos antigos nao comprovam participacao na revisao atual.
2. Revisar e aprovar somente a RFC-0010 e IMP-0034 para iniciar o proximo incremento isolado.
3. Fechar tenancy fisica, durabilidade/consistencia e lifecycle do provider antes de dados reais (RFC-0020).
4. Escolher estrategia de identidade/sessao e onboarding de administrador/memberships antes do login operacional (RFC-0019).
5. Aprovar gradualmente Builder, Query, Event/Workflow, Observability, Release e Runtime Adapters conforme prioridade de produto.

Essas decisoes nao impedem a entrega desta revisao documental; impedem apenas codigo fora do escopo ja aprovado, conforme AGENTS e RFC-0099. As escolhas pendentes sao declaradas, nao substituidas por suposicoes.

## Requisitos para futuras propostas ainda fora do roadmap numerado

SDK/CLI, marketplace, confianca em plugins, API generica de escrita e modulos de negocio devem receber escopo/RFC/IMP proprio quando priorizados. Nao existem requisitos de produto suficientes neste repositorio para declarar esses blocos completamente especificados. Esta revisao fecha a navegacao e prepara propostas dos blocos ja identificados; nao promete especificar todos os produtos empresariais futuros.

## Evidencias e validacao

Ver [Development Status](DEVELOPMENT-STATUS.md) para caminhos de codigo e limitacoes, [Roadmap](IMPLEMENTATION-ROADMAP.md) para commits/identificadores e [Documentation Validation](DOCUMENTATION-VALIDATION.md) para checks desta alteracao. Nenhum deploy, merge ou acesso ao servidor foi executado como parte da analise.

## Registro de mudanca

2026-10-24 — Codex: revisao documental; baseline `936ddd4`; documentos novos com status Draft/Blocked; sem promocao de status aprovado, breaking change de contrato ou migracao. A aprovacao arquitetural formal continua pendente.

## Continuidade: RFC-0010 e IMP-0034 v0.2

A [revisao cruzada de permissions](RFC-0010-CROSS-REVIEW.md) fechou as ambiguidades de roles escopadas, tenant/workspace sem heranca, system sem bypass, precedencia de deny, schema e versao de politica, concorrencia de chamadas e lifecycle de DI. A RFC foi promovida somente de Draft para Review. O IMP permanece Blocked para codigo ate aprovacao nominal do owner. Os 26 cenarios documentados sao testes planejados.
