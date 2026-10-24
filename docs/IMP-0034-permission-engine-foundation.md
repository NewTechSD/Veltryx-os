# IMP-0034: Permission Engine Foundation

Status: Blocked (aguarda aprovacao da RFC-0010 e deste IMP)

Version: 0.2

Type: Implementation Plan

Owner: Maintainer de Core/Contracts (aceite nominal pendente)

Reviewer tecnico: Codex

Created: 2026-10-24

Last Updated: 2026-10-24

Task: TASK-0318

Depends On: RFC-0010 Review, RFC-0001, RFC-0002, RFC-0004, RFC-0006, RFC-0011, RFC-0099, IMP-0033

Supersedes: None

## Objetivo e gate

Implementar a proposta v0.2 da [RFC-0010](../rfc/RFC-0010-permission-engine.md), cuja revisao tecnica esta [registrada](RFC-0010-CROSS-REVIEW.md). O plano esta completo para decisao do owner; codigo so inicia apos aprovacao da RFC e do IMP. Nao e necessario aprovar outros Drafts do roadmap para este avaliador isolado.

## Escopo

Contratos, catalogo add-only, provider de politica em memoria, avaliador deterministico, DI e facade do Kernel, testes e documentacao tecnica. Negativa por padrao, grant exato por principal ou role vinculada pelo provider, scopes tenant/workspace sem heranca.

Ficam fora login, JWT/cookies, banco, memberships reais, enforcement HTTP, grants por metadata/header, roles administrativas, wildcard, ABAC, scope global, objectId/field, cache, override de provider ativo e novos eventos/telemetria.

## Contratos fixados

Todos os nomes e campos normativos constam nas secoes 3–6 da RFC-0010 v0.2; o IMP nao mantem uma segunda definicao divergente. A implementacao deve exportar os contratos ali listados em `packages/contracts/src/permissions.ts` e no barrel publico. Os metodos sao:

| Porta                      | Operacao e retorno                                                                                                                                                                             |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IPermissionResourceCatalog | register: PermissionResource para PermissionCatalogResult, sincrono; get: PermissionResourceReference para recurso ou null, sincrono; snapshot: lista readonly de PermissionResource, sincrono |
| IPermissionPolicyProvider  | resolve: PermissionPolicyLookup para Promise de snapshot ou null                                                                                                                               |
| IPermissionEvaluator       | evaluate: PermissionCheckInput para Promise de PermissionDecision                                                                                                                              |

PermissionCatalogResult e uma uniao: sucesso com `ok: true` e `resource`; falha com `ok: false` e `code` em `permission.catalog.invalidDefinition` ou `permission.catalog.duplicateResource`. Falhas esperadas do catalogo nao lancam nem alteram estado.

PermissionScope discrimina por `kind`; tenant possui tenantId, workspace possui tenantId e workspaceId. PermissionSubject discrimina por `kind`: `principal` possui principalId e principalKind (`user`, `service`, `system`); `role` possui roleId. As projecoes `principal` de lookup/snapshot possuem id/kind (kind de PrincipalKind, exceto anonymous). As rules usam `resource: PermissionResourceReference` e `action: PermissionAction`. Campo `effect` usa somente allow/deny.

A fachada deve copiar a projecao da entrada e obter `catalog.snapshot()` antes do await do provider. O snapshot publico do catalogo contem apenas definicoes declarativas, profundamente imutaveis, sem grants/roles ou estado por tenant. Validar todas as regras usa a mesma visao capturada, sem aceitar recurso adicionado no meio da avaliacao. Essa operacao faz parte do contrato normativo da RFC-0010 v0.2; nao exige acesso a campos privados da classe.

## Tokens, defaults e pontos de integracao

| Chave em KERNEL_SERVICE_TOKENS | Token                           | Contrato                   |
| ------------------------------ | ------------------------------- | -------------------------- |
| permissionCatalog              | kernel.permissionCatalog        | IPermissionResourceCatalog |
| permissionPolicyProvider       | kernel.permissionPolicyProvider | IPermissionPolicyProvider  |
| permissionEvaluator            | kernel.permissionEvaluator      | IPermissionEvaluator       |

Os tres tokens usam version `1.0.0`, owner `kernel`, category `kernel`, scope/lifecycle `singleton`, conforme os tipos ja existentes. Nenhum singleton guarda currentPrincipal/currentTenant/currentWorkspace ou a ultima politica/decisao de request.

Classes publicas de composicao propostas: `KernelPermissionResourceCatalog`, `InMemoryPermissionPolicyProvider`, `KernelPermissionEvaluator`. Construtor de catalogo sem argumentos cria catalogo vazio. Provider recebe array de snapshots (default vazio), copia e valida os dados; rejeita configuracao duplicada para a mesma tupla principal/scope ou malformada por erro de inicializacao seguro, sem payload. Nao consulta catalogo no construtor: validade das referencias e verificada pelo evaluator.

Evaluator recebe catalogo e provider. O Kernel cria defaults vazios e expoe `permissions(): IPermissionEvaluator`; callers existentes de `new VeltryxKernel()` e das factories continuam funcionando. Dependencias injetaveis novas sao opcionais nos inputs publicos existentes: adicionar campos obrigatorios quebraria consumidores. Uma composition root de teste pode fornecer catalogo e provider explicitamente; se fornecer um evaluator, deve usar instancia coerente com essas dependencias.

Provider e catalogo sao registrados como valores singleton. Evaluator recebe ambos por factory com dependencias declaradas. Registro no Service Registry deve usar descriptors seguros; snapshots de service/DI nao incluem policy payload, roleIds ou grants. Resolver os tres tokens deve devolver as mesmas instancias usadas pela facade e pelo evaluator; nao construir duas copias isoladas por caminhos de bootstrap diferentes.

Bootstrap padrao nao instala recurso/grant de demonstracao nem liga avaliacao a rota, Runtime pipeline ou menu. Isso permite regressao dos consumidores existentes sem alterar sua semantica.

## Arquivos e responsabilidades previstos

| Area                                                     | Trabalho autorizado apos aprovacao                                  |
| -------------------------------------------------------- | ------------------------------------------------------------------- |
| `packages/contracts/src/permissions.ts` e `src/index.ts` | Tipos e exports aditivos; nenhuma classe de infraestrutura          |
| `packages/kernel/src/core/permissions/`                  | Catalogo, provider em memoria, validacao, avaliador e index publico |
| `packages/kernel/src/core/services/service-token.ts`     | Tres chaves/tokens novos                                            |
| `packages/kernel/src/kernel.ts`                          | Dependencias opcionais, composition root, DI e facade               |
| `packages/kernel/src/index.ts`                           | Exports publicos do novo subsistema                                 |
| `packages/kernel/tests/permission-*.test.ts`             | Matriz abaixo, contratos e integracao                               |
| Documentacao de permissions/status/roadmap/indice        | Estado real e resultados apos implementacao                         |

Nao alterar categorias/lifecycles de services, tipos atuais de auth/contexto, APIs do Admin, UI, persistencia ou formato de metadata. Novos imports devem apontar para contratos/barrels publicos. Ajustes em testes de contagem de services precisam afirmar o conjunto correto de registros; nao remover as verificacoes.

## Sequencia de implementacao

1. Materializar contratos e validadores de formato/limites/discriminantes.
2. Implementar catalogo add-only e provider imutavel com lookup exato.
3. Implementar avaliacao na precedencia da RFC, copiando dados antes de await e normalizando falhas.
4. Integrar tokens, DI e facade com defaults vazios e dependencias opcionais.
5. Executar matriz de teste, regressao e checks oficiais.
6. Atualizar documentacao e registrar review/aceite. Implementacao nao promove automaticamente IMP para Done.

## Matriz de testes rastreavel

| ID  | Cenario                                                                                             | Aceite                                                                             |
| --- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| P01 | Estrutura/ID/version/action invalida; expectedPolicyVersion vazio/null                              | permission.input.invalid; provider nao chamado                                     |
| P02 | Anonymous mesmo com status active                                                                   | permission.principal.anonymous                                                     |
| P03 | User/service/system inactive ou unknown                                                             | permission.principal.inactive                                                      |
| P04 | Tenant/workspace nao active ou workspace.tenantId divergente                                        | permission.scope.invalid                                                           |
| P05 | Recurso nao registrado / scopeKind divergente / acao desconhecida                                   | notFound, scopeMismatch e action.notFound, respectivamente; provider nao chamado   |
| P06 | Provider lanca/rejeita / retorna null                                                               | policy.unavailable / policy.notFound                                               |
| P07 | Snapshot schema desconhecido, rules/roles acima do limite, duplicata de ruleId ou regra invalida    | policy.invalid, sem allow parcial                                                  |
| P08 | Principal.id ou kind diferente / scope diferente no snapshot                                        | policy.subjectMismatch / policy.scopeMismatch                                      |
| P09 | Regra para recurso/action desconhecido, mesmo nao correspondente ao principal                       | policy.invalid para todo o snapshot                                                |
| P10 | expectedPolicyVersion diferente de politica valida                                                  | policy.versionConflict; revisao validada no resultado                              |
| P11 | Politica valida vazia ou sem correspondencia                                                        | denied.noGrant                                                                     |
| P12 | Allow direto exato / allow por role vinculada no provider                                           | allowed.explicit                                                                   |
| P13 | Principal.roles/claims/ExecutionContext.permissions sugerem acesso, provider nao concede            | denied.noGrant                                                                     |
| P14 | Allow direto + deny por role; allow por role + deny direto; inverter ordem das regras               | denied.explicit, invariavel pela ordem                                             |
| P15 | Mesmo roleId em tenants diferentes; scope tenant versus workspace; workspaces distintos             | Nenhuma concessao cruzada ou heranca                                               |
| P16 | System ou role admin sem grant / system com grant exato confiavel                                   | denied.noGrant / allowed.explicit                                                  |
| P17 | Alterar entrada enquanto provider aguarda; alterar snapshots originais depois de construir provider | Decisao usa entrada/snapshots capturados                                           |
| P18 | Adicionar recurso ao catalogo durante await                                                         | Nao altera visao da avaliacao em andamento; proxima avaliacao pode usar nova visao |
| P19 | Intercalar promises de A/B e resolve-las em ordem inversa                                           | Cada resultado usa apenas principal/scope/politica da sua chamada                  |
| P20 | Registro invalido/duplicado e mutacao de definicao retornada                                        | Catalogo preservado; resultado/definicao profundamente imutaveis                   |
| P21 | Congelar/alterar resultado; repetir entrada/catalogo/politica                                       | Decisao imutavel e deterministica                                                  |
| P22 | Falha inesperada de processamento                                                                   | permission.internal.error, deny sem stack/payload                                  |
| P23 | Mais de uma falha simultanea                                                                        | Primeiro reasonCode da ordem normativa da RFC                                      |
| P24 | Bootstrap default, DI e facade                                                                      | Defaults vazios, instancias coerentes, tokens resolviveis e ausencia de ciclo      |
| P25 | Snapshots publicos e mensagens de falha com fixtures sensiveis                                      | Sem rules, roleIds, claims, passwords, tokens ou payloads                          |
| P26 | Construtores antigos/factories e suites atuais                                                      | Nenhum novo argumento obrigatorio; regressao passa                                 |

Nos casos P05–P16, prefixes completos dos codigos sao os da secao 6 da RFC. Cobrir limites de 1/128 caracteres, 1/100 actions, 100 roles e 1.000 rules, incluindo valor imediatamente acima. Roles repetidas no snapshot sao invalidas; IDs de regras devem ser unicos. Regras validas para subject diferente nao correspondem.

Nenhum teste deve usar HTTP hints como origem confiavel de grants. Teste positivo em memoria prova apenas contrato/avaliacao, sem anunciar autenticacao real ou isolamento de dados no storage.

## Validacao e documentacao apos codigo

Executar `pnpm build`, `pnpm lint`, `pnpm typecheck` e `pnpm test` com pnpm 9.15.0, respeitando scripts por workspace. Verificar guardrails de imports e API publica, documentar resultados/falhas existentes separadamente. E2E web nao e exigido para esta entrega sem fluxo web novo; login/tenant operacional tera E2E proprio.

Criar `docs/PERMISSION-ENGINE.md` quando a implementacao existir, com contratos efetivos, uso por facade/token, default deny e limites. Atualizar Development Status, Roadmap, Architecture Index e checklist de aceite com evidencias. Nao anunciar enforcement ou marcar auth operacional como concluida.

## Riscos e aceite

As decisoes estruturais estao na RFC-0010 v0.2. Nao ha tecnologia nova selecionada que exija ADR local. Biblioteca/framework/driver adicional ou snapshot publico nao previsto exige revisao de escopo, nao improvisacao no codigo.

- [x] Contratos, nomes, tokens, reasonCodes, scopes e precedencia fixados na proposta.
- [x] Plano, arquivos, default provider, DI e estrategia de compatibilidade definidos.
- [x] Matriz de testes e documentacao de conclusao definidas.
- [x] Cross Review tecnico registrado.
- [ ] Owner aprova RFC-0010 v0.2 e IMP-0034 v0.2.
- [ ] Implementacao e testes executados.
- [ ] Code review e aceite registrados antes de Done.

Historico: v0.1 em 2026-10-24, plano inicial. v0.2 em 2026-10-24, Codex: contrato detalhado e ambiguidades encerradas; permanece Blocked apenas para codigo enquanto aguarda aprovacao.
