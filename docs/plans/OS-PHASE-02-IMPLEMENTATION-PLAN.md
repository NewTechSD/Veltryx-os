# OS Phase 02 — Implementation Plan

**Base:** `e34f582`  
**Predecessor:** Platform Foundation / OS-CORE-PHASE-01  
**Status:** Plano executável condicionado a decisões de governança  
**Resultado da readiness:** `APPROVED_WITH_NOTES`

## 1. Princípios de execução

- Manter Contracts e Kernel independentes de banco, ORM, transporte e framework de autenticação.
- Implementar adapters atrás dos contratos aprovados; não substituir o provider in-memory antes de testes de compatibilidade.
- Derivar o tenant efetivo de identidade e membership autorizados; nunca confiar em `tenantId` do cliente.
- Aplicar negação default, escopo explícito, auditoria e testes cross-tenant.
- Preservar snapshots públicos como read models sanitizados.
- Não reutilizar identificadores históricos `IMP-0010`–`IMP-0014`; as identificações OS-* abaixo são propostas de trabalho.

## 2. Sequência proposta

```text
Governance decision gate
  -> OS-DATA-0001 durable adapter
  -> OS-DATA-0002 transactions + migrations
  -> OS-SEC-0001 identity + sessions
  -> OS-SEC-0002 authorization/RBAC
  -> OS-SEC-0003 tenant isolation
  -> OS-SEC-0004 audit/backup/recovery
  -> OS-ADMIN-SEC-0001 secure Admin login
```

## 3. Tasks

### OS-DATA-0001 — Persistência durável

**Dependências:** RFC-0015, decisão de provider, schema ownership e observabilidade.  
**Arquivos previstos:** adapter em infraestrutura, composição do provider no host, testes de contrato; não alterar `packages/contracts/src/persistence.ts` sem nova RFC.  
**Testes:** contract suite contra in-memory e adapter durável; restart persistence; serialização; erros sanitizados; snapshots equivalentes.  
**Riscos:** escolha prematura de ORM, vazamento de conexão/secret, divergência de paginação e semântica entre providers.  
**Aceite:** dados sobrevivem a reinício; consumers continuam dependentes de `IPersistenceService`; provider é selecionável por composition root; nenhum detalhe físico aparece em snapshots.

### OS-DATA-0002 — Integração transacional e migrações

**Dependências:** OS-DATA-0001; decisão sobre Unit of Work, isolamento, locking e migration tool.  
**Arquivos previstos:** contrato/adaptador transacional somente após RFC se público; migration runner em infraestrutura; integração Kernel/host; testes de migrations.  
**Testes:** atomicidade commit/rollback, concorrência, idempotência, retry, migration up/down ou estratégia equivalente, schema drift e falha no bootstrap.  
**Riscos:** quebrar repositories atuais, transações longas, retries duplicando comandos, migrations incompatíveis com módulos.  
**Aceite:** falhas não deixam estado parcial; migrations reproduzem schema; operação e rollback são documentados; contratos existentes permanecem compatíveis.

### OS-SEC-0001 — Identidade e sessões

**Dependências:** RFC-0011; OS-DATA-0001/0002; decisão de IdP/credenciais e gestão de segredos.  
**Arquivos previstos:** serviços de identidade/sessão em infraestrutura/aplicação, adapters de transporte e testes; manter `AuthBridge` como boundary, sem lógica HTTP no Kernel.  
**Testes:** login/logout, expiração, rotação/revogação, recuperação de acesso, cookies Secure/HttpOnly/SameSite quando aplicável, enumeração uniforme, rate limit e CSRF.  
**Riscos:** armazenamento inadequado de credenciais, sessão fixa, tokens em logs, mistura de hint com identidade autenticada.  
**Aceite:** cada contexto autenticado tem principal verificável, sessão revogável e tenant memberships carregados de fonte autoritativa; falhas não revelam existência de conta.

### OS-SEC-0002 — Autorização e RBAC

**Dependências:** OS-SEC-0001; decisão de Permission Engine/RFC-0010 ou atualização formal da referência; recursos e ações do domínio.  
**Arquivos previstos:** contratos de policy apenas mediante RFC se públicos; evaluator, role/permission repository e adapters; integração Runtime/API.  
**Testes:** allow/deny, negação default, least privilege, hierarquia/escopo de roles, recurso/ação, workspace e bypass por input alterado.  
**Riscos:** confiar em roles do cliente, authorization only in UI, policy cache sem escopo, permissões antigas após revogação.  
**Aceite:** toda operação protegida decide autorização no servidor dentro do Execution Context; Admin apenas representa o resultado.

### OS-SEC-0003 — Isolamento multi-tenant

**Dependências:** OS-SEC-0001, OS-SEC-0002, OS-DATA-0002; decisão de isolamento application-layer, database policy/RLS ou combinação.  
**Arquivos previstos:** tenant membership, scoped repository/unit of work, middleware/adapters de contexto e testes; sem espalhar filtros manuais por módulos.  
**Testes:** leitura/escrita cross-tenant, workspace de outro tenant, ids forjados, joins/relatórios, jobs assíncronos, cache e eventos preservando escopo.  
**Riscos:** consulta sem filtro, cache global, contexto perdido em tarefas assíncronas, tenant default usado em operação privilegiada.  
**Aceite:** tenant efetivo é validado server-side; ausência/ambiguidade nega acesso; todos os caminhos de leitura e escrita têm cobertura cross-tenant.

### OS-SEC-0004 — Auditoria, backups e recuperação

**Dependências:** OS-DATA-0002, OS-SEC-0001/0002/0003; política de classificação, retenção e incident response.  
**Arquivos previstos:** audit writer/repository, redaction, backup/restore tooling e runbooks; manter snapshots como observabilidade, não como backup.  
**Testes:** eventos sensíveis, integridade/correlação, redaction, retenção, backup verificável, restore em ambiente isolado, perda simulada e auditoria de falha.  
**Riscos:** dados sensíveis em logs, backup não restaurável, retenção incompatível, auditoria alterável.  
**Aceite:** ações de authz, membership e administração são rastreáveis por principal, tenant, recurso, ação, request/correlation e resultado; restore é demonstrado.

### OS-ADMIN-SEC-0001 — Login e administração segura

**Dependências:** OS-SEC-0001 a OS-SEC-0004; decisões de sessão, RBAC, CSRF e política administrativa.  
**Arquivos previstos:** rotas/adapters de login em `apps/admin`, read models e testes; não colocar autenticação no Kernel nem criar tela fora do escopo.  
**Testes:** login/logout/expiração, acesso anônimo, autorização por ação, CSRF, session fixation, tenant switching autorizado, diagnostics sem secrets e integração Runtime → Admin.  
**Riscos:** Admin virar fonte de autorização, exposição de diagnósticos, tenant switch sem membership, fallback system indevido.  
**Aceite:** nenhuma tela administrativa sensível é acessível sem sessão válida e policy server-side; UI reflete decisões públicas e não as inventa.

## 4. Decisões formais necessárias

Antes de iniciar OS-DATA-0001, preparar ADR Draft para provider durável, schema ownership, migrations e observabilidade. Se a decisão alterar contratos públicos ou introduzir um Permission Engine/tenant boundary público, preparar RFC Draft correspondente. Nenhuma proposta deve ser marcada como Approved automaticamente.

As RFCs/ADRs aprovadas existentes continuam normativas. O plano não altera `RFC-0011`, `RFC-0015`, `RFC-0099` ou documentos históricos.

## 5. Estratégia de validação e rollout

1. Executar cada task em branch própria, com contract tests e testes de segurança antes da integração.
2. Manter in-memory como adapter de teste e fallback explícito apenas em ambientes autorizados.
3. Introduzir o adapter durável por composition root/configuração, com observabilidade de provider e falha segura.
4. Testar migrações e restore em ambiente efêmero antes de qualquer dado real.
5. Liberar capacidades administrativas somente após autenticação, autorização e isolamento cross-tenant comprovados.
6. Registrar readiness técnica separadamente de produção: disponibilidade do código não equivale a operação segura.
