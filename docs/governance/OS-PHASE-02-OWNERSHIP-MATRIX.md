# OS-PHASE-02 — Matriz de Responsabilidades e Revisões

**Status:** Draft — proposta de atribuição, sem nomeações ou aceites efetivos  
**Escopo:** RFC-0020, ADR-0006, ADR-0007 e gate OS-DATA-0001  
**Fundamento:** `rfc/RFC-0099-architecture-governance.md` e `AGENTS.md`  
**Registro de decisão existente:** `docs/decisions/OS-GOV-PHASE-02-APPROVAL-RECORD.md`

## 1. Objetivo e limites

Identificar quem deve analisar e decidir sobre a proposta de persistência durável, sem presumir a identidade de titulares ou aprovações. Esta matriz **não nomeia pessoas**, não converte pareceres automatizados em aceite humano e não altera o lifecycle dos documentos.

A autorização do responsável pelo projeto, registrada em 2026-11-09 como `CONDITIONAL_APPROVAL_AUTHORIZED`, continua com `PENDING_REQUIRED_REVIEWS`. A RFC-0020, a ADR-0006 e a ADR-0007 permanecem `Draft`; OS-DATA-0001 permanece `BLOCKED`.

## 2. Papéis e responsabilidade de decisão

| Papel | Responsabilidade aplicável | Evidência e manifestação necessária | Titular designado | Situação |
| --- | --- | --- | --- | --- |
| Architecture Owner | Coerência global e aprovação final de decisões estruturantes, conforme RFC-0099 §10 | Identificação/competência do titular, parecer de encerramento do Cross Review, decisão explícita e referência verificável | **PENDING** | **PENDING** |
| RFC Owner / Architecture Team | Manter escopo, impactos, dependências e histórico da RFC-0020 | Confirmação de que a RFC resolve as revisões, com registro de versão e riscos residuais | **PENDING** | **PENDING** |
| Architecture Review | Cross Review da RFC-0020 contra RFC-0015, RFC-0099, contratos públicos e ADRs relacionados | Parecer humano de compatibilidade, contradições, impacto e condições; referência no repositório/PR | **PENDING** | **PENDING** |
| Platform Owner | Contratos `IPersistenceProvider`, `IPersistenceService`, `IRepository`, composition root, reversibilidade e testes planejados | Aceite ou objeção do desenho, das fronteiras e do plano de compatibilidade; evidências verificáveis | **PENDING** | **PENDING** |
| Security Owner | Contexto de tenant no servidor, acesso cross-tenant, RLS pré-produção, segredos, redaction e operações privilegiadas | Aceite ou objeção do modelo de ameaças e do gate RLS, com condições e referência verificável | **PENDING** | **PENDING** |
| Operations Owner | Revisão operacional das ADRs: isolamento de ambientes, secrets, pool/timeout, migrações, drift, restauração e rollback | Parecer sobre o plano operacional da ADR-0006/ADR-0007 e evidências requeridas antes da execução | **PENDING** | **PENDING** |
| Maintainer documental | Integridade editorial de índices, links, registros e histórico; não substitui aprovadores | Conferência de consistência e rastreabilidade, sem efeito normativo próprio | **PENDING** | **PENDING** |

**Origem das exigências:** os papéis Architecture Owner, RFC Owner, Reviewer e Maintainer são definidos na RFC-0099 §10. As revisões de Platform e Security são explicitadas no `OS-GOV-PHASE-02-APPROVAL-RECORD.md` e no `OS-GOV-PHASE-02-REVIEW-EVIDENCE.md`; Operations decorre das condições dos ADRs e não é tratado aqui como assinatura já exigida para a RFC-0020 sem decisão do Architecture Owner.

## 3. Evidências documentais disponíveis

| Área | Evidência existente | Classificação atual | Lacuna para sign-off |
| --- | --- | --- | --- |
| Compatibilidade arquitetural | `rfc/RFC-0015-data-layer.md`, `rfc/RFC-0020-durable-persistence-transactions-tenancy.md`, `docs/audits/OS-GOV-PHASE-02-NORMATIVE-REVIEW.md` | `EVIDENCED` como análise documental | Manifestação formal da Architecture Review |
| Fronteira de contratos | `packages/contracts/src/persistence.ts`; `docs/audits/OS-GOV-PHASE-02-REVIEW-EVIDENCE.md` | `EVIDENCED` para contratos existentes | Aceite do Platform Owner e prova futura do adapter |
| Provider e reversibilidade | `adr/ADR-0006-durable-persistence-adapter.md`; especificação OS-DATA-0001 | `PARTIALLY_EVIDENCED` | Aceite do desenho, plano de testes e execução futura |
| Migrações, transações e concorrência | `adr/ADR-0007-migrations-and-transactions.md`; especificação e checklist OS-DATA-0001 | Especificado, ainda não implementado | Aceite do plano de verificação e testes futuros |
| Tenancy e RLS | RFC-0020, RFC-0019 (Draft), ADR-0008 (Draft), execution gate | `EVIDENCED` como política; testes ausentes | Parecer do Security Owner; RLS E2E antes da produção |
| Autorização do responsável pelo projeto | `docs/decisions/OS-GOV-PHASE-02-APPROVAL-RECORD.md` | `CONDITIONAL_APPROVAL_AUTHORIZED` | Evidências de revisores; não equivale a aprovação final |

## 4. Critérios de aceite por revisão

### Architecture Review
- Verificar o Cross Review exigido na RFC-0099 §12, incluindo compatibilidade com RFC-0015 e contratos existentes.
- Registrar se alterações propostas exigem RFC adicional, em especial contratos públicos de Unit of Work, scope ou conflito.
- Registrar conclusão `ACCEPT`, `ACCEPT_WITH_CONDITIONS` ou `REQUEST_CHANGES`, com identificação do responsável e referência.

### Platform Owner
- Validar que PostgreSQL, Prisma e migrations permanecem na infraestrutura e que o host seleciona o provider.
- Aceitar ou rejeitar o plano de compatibilidade do provider e o plano de reversibilidade.
- Distinguir aceite **do plano arquitetural** de testes e durabilidade ainda não demonstrados.

### Security Owner
- Validar que `tenantId` enviado pelo cliente não confere autoridade e que escopo ausente é negado.
- Examinar critérios de testes negativos cross-tenant, acessos privilegiados e sanitização de secrets/diagnósticos.
- Aceitar explicitamente que **produção multi-tenant permanece bloqueada** até PostgreSQL RLS implementado e validado E2E, salvo alternativa autorizada por RFC aprovada.

### Operations Owner
- Examinar a viabilidade do plano de ambiente isolado, controle de acesso, pool/timeouts, migrações controladas, drift e restore/forward-fix.
- Registrar condições operacionais que serão comprovadas antes da execução e durante os testes da OS-DATA-0001.

## 5. Acumulação de papéis

A RFC-0099 descreve papéis, ownership, Cross Review e aprovação final, mas a leitura utilizada **não estabelece autorização genérica explícita para uma pessoa aprovar sua própria revisão em todos os papéis**. Não presumir acumulação nem independência obrigatória universal. Qualquer acumulação deverá ser declarada, justificada, analisada quanto a conflito de interesses e aceita pelo processo de governança competente antes de contar como múltiplos sign-offs.

A ausência de nomes no repositório **não** pode ser preenchida por suposição sobre a identidade do usuário, mantenedores ou autores de commits.

## 6. Sequência de decisões e separação de gates

1. Identificar os titulares e registrar os pareceres exigidos para a RFC-0020.
2. Arquitetura decide explicitamente a transição `Draft → Review → Approved`, quando todos os requisitos normativos forem cumpridos.
3. Avaliar e decidir separadamente ADR-0006 e ADR-0007, na ordem de suas dependências.
4. Reavaliar o **gate de entrada** da OS-DATA-0001 com planos, ambiente de testes e políticas operacionais comprovados na medida exigida pelos documentos vigentes.
5. Produzir **evidências de implementação/aceite** somente quando uma tarefa de implementação estiver legitimamente autorizada.
6. Manter **produção multi-tenant bloqueada** até o gate RLS E2E ou exceção normativamente autorizada.

A distinção entre gate de entrada e aceite é uma **proposta de clarificação**: não altera sozinha os checklists ou a RFC-0099 e depende de deliberação quando houver conflito entre condições.

## 7. Referências de rastreabilidade

- `rfc/RFC-0099-architecture-governance.md` (§§4–6, 10–12 e 16)
- `rfc/RFC-0020-durable-persistence-transactions-tenancy.md`
- `rfc/RFC-0015-data-layer.md`
- `adr/ADR-0006-durable-persistence-adapter.md`
- `adr/ADR-0007-migrations-and-transactions.md`
- `docs/decisions/OS-GOV-PHASE-02-APPROVAL-RECORD.md`
- `docs/audits/OS-GOV-PHASE-02-REVIEW-EVIDENCE.md`
- `docs/plans/OS-DATA-0001-EXECUTION-GATE.md`
- `docs/plans/OS-DATA-0001-READINESS-CHECKLIST.md`

**Resultado documental:** `READY_FOR_SIGNOFF_PREPARATION` — não é aprovação normativa.
