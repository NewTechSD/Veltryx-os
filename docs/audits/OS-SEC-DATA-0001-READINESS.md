# OS-SEC-DATA-0001 — Persistence & Security Architecture Readiness

**Base auditada:** `main` / `e34f582`  
**Branch de trabalho:** `feature/os-sec-data-0001-readiness`  
**Escopo:** auditoria técnica, gap analysis e plano de implementação; nenhuma alteração de comportamento.  
**Resultado:** `APPROVED_WITH_NOTES`

## 1. Resumo executivo

A Platform Foundation possui contratos públicos suficientes para preservar uma fronteira limpa entre Kernel, Runtime, Admin e futuros adapters de infraestrutura. O estado implementado é adequado como fundação e prova de contrato, mas não está pronto para persistência durável nem para autenticação/autorização de produção.

As principais evidências são:

- `packages/contracts/src/persistence.ts` define provider, repository, service, records e snapshots, sem contrato de transação, migration ou query avançada.
- `packages/kernel/src/core/persistence/in-memory-persistence-provider.ts` é o único provider efetivo e mantém estado em `Map` no processo.
- `docs/PERSISTENCE-LAYER.md` e `rfc/RFC-0015-data-layer.md` explicitamente excluem banco, ORM, driver, SQL, schema físico, migrations, transações e enforcement de tenant nesta etapa.
- `packages/contracts/src/auth.ts`, `tenant.ts` e `context.ts` já representam Principal, sessão, tenant, workspace e Execution Context, mas `packages/kernel/src/core/auth/auth-bridge.ts` cria apenas contextos anônimos ou system explícitos.
- `rfc/RFC-0011-auth-tenant-foundation.md` e `docs/AUTH-BRIDGE.md` excluem login, credenciais, cookies, JWT/OAuth, sessões reais, RBAC, Permission Engine, enforcement de tenant e persistência.
- `apps/admin` consome snapshots e adapters públicos; não há gate de autenticação administrativa nem autorização real.

Conclusão: a readiness é suficiente para iniciar uma Fase 2 controlada, condicionada a decisões de governança sobre adapter durável, transações/migrations e modelo de segurança. PostgreSQL é um candidato plausível, não uma decisão adotada neste documento.

## 2. Método e arquivos analisados

Foram confrontados os documentos de governança e implementação com os símbolos efetivamente presentes no checkout:

| Área                 | Evidência principal                                                                                                                                                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Governança           | `AGENTS.md`, `docs/IMPLEMENTATION-GUIDE.md`, `rfc/RFC-0099-architecture-governance.md`, `docs/DEPENDENCY-GRAPH.md`                                                                                                                                                             |
| Roadmap e foundation | `docs/IMPLEMENTATION-ROADMAP.md`, `docs/PLATFORM-FOUNDATION.md`                                                                                                                                                                                                                |
| Persistência         | `packages/contracts/src/persistence.ts`, `packages/kernel/src/core/persistence/*`, `docs/PERSISTENCE-LAYER.md`, `docs/DATA-ACCESS-CONTRACTS.md`, `rfc/RFC-0015-data-layer.md`                                                                                                  |
| Segurança e contexto | `packages/contracts/src/auth.ts`, `tenant.ts`, `context.ts`, `packages/kernel/src/core/auth/*`, `packages/kernel/src/core/execution-context/*`, `docs/AUTH-TENANT-FOUNDATION.md`, `docs/AUTH-BRIDGE.md`, `docs/EXECUTION-CONTEXT.md`, `rfc/RFC-0011-auth-tenant-foundation.md` |
| Runtime/Admin        | `packages/contracts/src/api.ts`, `packages/kernel/src/core/api/runtime-api-bridge.ts`, adapters em `apps/admin`, `docs/RUNTIME-API-BRIDGE.md`                                                                                                                                  |
| Testes               | `packages/kernel/tests/persistence*.test.ts`, `*persistence.test.ts`, `auth-foundation.test.ts`, `execution-context.test.ts`, `runtime-api-bridge.test.ts`, testes de Runtime e Admin existentes                                                                               |

## 3. Estado atual e conformidade

| Capacidade                | Estado comprovado                                                                        | Conformidade                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Fronteira de persistência | `IPersistenceService` → `IPersistenceProvider` → `IRepository`; Kernel injeta o provider | Conforme RFC-0015                                               |
| Adapter atual             | In-memory, process-local, com validação, cópia, versionamento e snapshots agregados      | Conforme, não durável                                           |
| Integrações               | Metadata, Configuration, Components e UI Composition usam o contrato público             | Conforme; não substitui fonte de verdade de domínio             |
| Snapshots                 | Resumos públicos excluem records, mapas, conexões, secrets e stack traces                | Conforme; compatibilidade deve ser preservada                   |
| Auth foundation           | Principal/AuthSession/AuthContext e hints validados                                      | Conforme RFC-0011; não autentica                                |
| Execution Context         | Preserva tenant, workspace, user, roles, permissions e correlação                        | Estrutural; não prova autorização                               |
| Runtime API               | Respostas versionadas e contexto transport-agnostic                                      | Read-only e sem enforcement de tenant implementado              |
| Admin                     | Usa adapters/snapshots públicos                                                          | Sem login/RBAC; adequado apenas para o estado atual de fundação |
| Multi-tenant              | Campos e contexto existem; isolamento de armazenamento e autorização não                 | Lacuna crítica para dados reais                                 |

## 4. Persistence Architecture

### Contratos e implementação existentes

`persistence.ts` define operações básicas assíncronas (`create`, `get`, `update`, `delete`, `list`, `exists`, `count`), metadata opcional de tenant/workspace/actor e snapshots do provider. Não define atomicidade, isolamento transacional, concorrência, locking, migrations, query composition ou Unit of Work.

`PersistenceService` é uma fachada fina. `InMemoryPersistenceProvider` cria repositórios escopados por namespace/collection, e `InMemoryRepository` mantém registros em mapas process-local. O provider não possui recuperação após reinício, replicação, durabilidade, concorrência entre processos ou backup.

### Integração com Kernel e snapshots

O Kernel expõe `kernel.persistence()` e registra o serviço no container. Consumers de Metadata, Configuration, Components e UI Composition dependem de `IPersistenceService`. Runtime e status recebem apenas resumos públicos. Um adapter durável deve manter essa fronteira e não colocar cliente, conexão, SQL ou segredo em Contracts/Kernel.

### Necessidades ainda não decididas

Antes da implementação durável, devem ser decididos: adapter e driver, ownership de schema, ferramenta de migrations, política de transação, concorrência/locking, idempotência, limites de retry, observabilidade, gestão de segredos, retenção, backup/restore e estratégia de isolamento por tenant.

PostgreSQL deve ser avaliado como candidato inicial por consistência transacional e maturidade operacional, mas a escolha exige decisão formal. A RFC-0015 não aprova PostgreSQL nem Prisma.

## 5. Security Architecture

Há uma base de tipos útil, mas não um sistema de segurança operacional:

- `AuthBridge` resolve `anonymous` ou `system` e sanitiza hints; não verifica credenciais, sessão ou identidade externa.
- `ExecutionContextInput` aceita tenant/user/roles/permissions e hints de AuthContext. Esses valores são contexto estrutural; não constituem prova de autorização.
- `ApiRequestContext` pode transportar tenant/workspace/auth, mas o contrato não autoriza o tenant informado pelo cliente.
- Não foram encontrados login, recuperação de acesso, armazenamento/rotação de sessão, cookies seguros, CSRF protection, RBAC evaluator, permission store, resource policy, anti-enumeração ou rate limiting de autenticação.
- A persistência não exige tenant scope nem aplica filtro centralizado por tenant/workspace.

O princípio obrigatório para a Fase 2 é: o tenant efetivo deve ser derivado de uma identidade autenticada e de uma associação autorizada; um `tenantId` enviado pelo cliente pode ser apenas uma solicitação a ser validada, nunca a fonte da autorização.

## 6. Decisões e governança

Não houve alteração de RFC, ADR, contrato público ou estado histórico. RFC-0011 e RFC-0015 permanecem os limites normativos atuais.

As tasks OS-* propostas neste pacote são planejamento, não autorização automática. A escolha de provider, migrations, transação e estratégia de isolamento deve passar por ADR/RFC conforme o impacto. Se houver mudança de contrato público, a proposta deve ser uma nova RFC; se for uma decisão local de implementação mantendo contratos, um ADR é suficiente.

Há colisões históricas documentadas para `IMP-0010` a `IMP-0014` e, especialmente, `IMP-0011`. Por isso, nenhuma nova task deve reutilizar esses IDs. A reconciliação formal dos aliases históricos permanece pendência de governança e não foi alterada.

## 7. Readiness gates para a Fase 2

1. Aprovar a decisão de adapter durável e schema/migration ownership.
2. Definir invariantes de transação, concorrência, idempotência e falha.
3. Definir modelo de identidade, sessão e associação usuário–tenant–workspace.
4. Definir autorização server-side por recurso, ação e escopo.
5. Definir enforcement de tenant no repository/unit of work e testes cross-tenant.
6. Definir auditoria de segurança, retenção, backup, restore e resposta a incidentes.
7. Somente então implementar adapters e integrações graduais, mantendo snapshots públicos compatíveis.

## 8. Resultado

`APPROVED_WITH_NOTES`: a auditoria e o plano são consistentes com a base arquitetural e não introduzem comportamento. A implementação da Fase 2 fica condicionada às decisões listadas e aos critérios do plano em `docs/plans/OS-PHASE-02-IMPLEMENTATION-PLAN.md`.
