# Estado do desenvolvimento

Data da inspecao: 2026-10-24. Baseline: `936ddd41f251f4374500561f7d269865d0cb760e`, branch `main`.

## Como interpretar

"Presente" significa codigo e testes localizados, com as limitacoes abaixo. Nao implica aceite formal, release, homologacao em servidor ou implementacao integral de uma RFC fundacional. Resultados de verificacao desta revisao ficam em [Documentation Validation](DOCUMENTATION-VALIDATION.md).

## Capacidades observadas

| Capacidade                                 | Estado observado      | Evidencia principal                                                       | Limite atual                                                                           |
| ------------------------------------------ | --------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Kernel bootstrap/lifecycle                 | Presente              | `packages/kernel/src/kernel.ts`, `packages/kernel/tests/kernel.test.ts`   | Nao comprova operacao distribuida                                                      |
| Manifest, discovery, dependencias e loader | Presente              | `packages/kernel/src/module-system/`, testes `module-*.test.ts`           | Discovery recebe candidatos em memoria; nao instala packages de filesystem/marketplace |
| Service Registry e DI                      | Presente              | `packages/kernel/src/core/services/`, `core/di/`, testes de registry/DI   | Nao substitui ownership nem permission enforcement                                     |
| Execution/Runtime Context                  | Presente              | `packages/kernel/src/core/execution-context/`, `core/runtime/`            | Contexto estrutural nao valida identidade real                                         |
| Event Bus e eventos estruturais            | Presente              | `packages/kernel/src/core/events/`, testes de events                      | Local ao processo, sem entrega duravel/retry/DLQ                                       |
| Metadata Engine                            | Presente              | `packages/kernel/src/core/metadata/`, `metadata-engine.test.ts`           | Declaracoes nao sao CRUD operacional nem autorizacao                                   |
| Component Registry e UI Composition        | Presente              | `packages/kernel/src/core/components/`, `core/ui-composition/`            | Arvore universal; sem adapter de publicacao                                            |
| Admin dinamico                             | Presente              | `apps/admin/components/`, `apps/admin/lib/runtime/`, `lib/navigation/`    | Mapping React somente no Admin; sem Builder visual                                     |
| Data Layer                                 | Presente em memoria   | `packages/contracts/src/persistence.ts`, `core/persistence/`              | Nao duravel, sem transacoes, expectedVersion ou filtro obrigatorio de tenant           |
| Bridges de persistencia                    | Presentes             | `core/*/persistence/`, testes de persistence                              | Persist/hydrate explicitos; nao escrevem banco                                         |
| Retencao e audit de snapshots              | Presente em memoria   | `core/ui-composition/persistence/policy/`                                 | Sem scheduler; audit nao e trilha duravel de negocio                                   |
| API v1 estrutural                          | Presente              | `core/api/runtime-api-bridge.ts`, `apps/admin/app/api/v1/`                | GET publico; sem CRUD, query generica ou enforcement                                   |
| Auth/Tenant Foundation                     | Presente              | `packages/contracts/src/auth.ts`, `tenant.ts`, `core/auth/auth-bridge.ts` | Apenas anonymous/system e hints; sem login ou memberships                              |
| Preview PM2                                | Configuracao presente | `apps/admin/ecosystem.config.cjs`                                         | PORT=3100; host nao fixado; servidor nao verificado nesta revisao                      |

## O que falta para dados reais e multi-tenant

1. Permission Engine, com negacao por padrao e grants de origem confiavel.
2. Sessao verificavel/revogavel e identidade real.
3. Memberships de tenant/workspace, selecao autorizada e data access scoped.
4. Provider duravel externo ao Kernel, transacoes, conflitos de escrita e idempotencia.
5. APIs de escrita e query por contrato proprio; RFC-0013 atual e read-only.
6. Auditoria operacional duravel, observabilidade, backup/restore e release verificavel.

Os contratos de `Principal` incluem `user` e `service`, mas o AuthBridge atual cria apenas `anonymous` e `system`. Tipos disponiveis nao equivalem a fluxos implementados.

## Diferencas que o proximo desenvolvedor precisa conhecer

- `AuthBridge` usa tenant/workspace `default`; `createExecutionContext()` legado sem AuthContext usa tenant `system`, e nao cria workspace por padrao. Nenhum fallback autoriza acesso protegido.
- `requestContext()` valida formato de headers `x-tenant-id` e `x-workspace-id`, mas nao verifica membership. Esses valores sao hints e podem aparecer em `meta.auth`; nao comprovam scope autorizado.
- `ApiRequestContext.auth` existe no contrato, mas `RuntimeApiBridge` atual monta `meta.auth` a partir dos defaults do snapshot e hints, em vez de resolver uma sessao de usuario. Nao anunciar auth end-to-end.
- O adapter HTTP cria novo Kernel por chamada de `getRuntimeApiBridge()`. As respostas nao representam necessariamente um estado compartilhado e persistente entre requisicoes.
- O bridge valida limit/offset; as rotas HTTP atuais passam `{}` e nao leem query string. Nao anunciar paginacao HTTP funcional.
- `health()` retorna status `ok` de liveness; nao executa verificacao de banco, sessao ou prontidao de modulos de negocio.
- `PersistenceRecordMetadata.tenantId` e opcional e nao aplica isolamento. Versionar registro nao equivale a optimistic locking.
- CorrelationId entra no contexto HTTP, mas o envelope de resposta atual expoe requestId; propagacao completa requer verificacao posterior.

## Fora deste repositorio

Nao foram encontrados modulo financeiro, ledger, Payable/Receivable ou RFC de Finance Core. O estado de outros projetos nao e evidencia de implementacao neste repositorio. Qualquer importacao futura exige inventario, contratos, testes e analise de compatibilidade propria.

## Limite desta revisao

Inspecao de arquivos e historico do repositorio; nenhum acesso ao servidor, deploy, banco, credenciais ou dados de clientes foi executado. Nao ha declaracao de conformidade operacional ou conclusao das RFCs completas.
