# OS-PHASE-02 — Registro de Revisões e Sign-off

**Estado:** `PENDING_SIGNOFF`  
**Escopo:** preparação das manifestações referentes à RFC-0020 e, posteriormente, ADR-0006/ADR-0007  
**Norma aplicável:** `rfc/RFC-0099-architecture-governance.md`  
**Matriz correspondente:** `docs/governance/OS-PHASE-02-OWNERSHIP-MATRIX.md`

> Este documento é um formulário de **registro**, não um parecer de aprovação. Todos os campos de decisão e identidade abaixo permanecem pendentes até manifestação efetiva e rastreável de cada autoridade. Não reproduzir assinaturas ou decisões de pessoas ausentes.

## 1. Situação de referência

- **RFC-0020:** `Draft`; autorização condicional do responsável pelo projeto em 2026-11-09, registrada em `docs/decisions/OS-GOV-PHASE-02-APPROVAL-RECORD.md`.
- **Efetividade normativa:** `PENDING_REQUIRED_REVIEWS`.
- **ADR-0006 / ADR-0007:** `Draft`; decisões próprias pendentes.
- **OS-DATA-0001:** `BLOCKED`; não há autorização para instalar PostgreSQL/Prisma, criar migrations nem iniciar implementação.
- **Produção multi-tenant:** bloqueada até RLS PostgreSQL implementado/testado E2E ou alternativa autorizada por RFC aprovada.

O relatório `docs/audits/OS-GOV-PHASE-02-REVIEW-EVIDENCE.md` avaliou as evidências existentes como `PARTIAL_EVIDENCE`. A documentação técnica existente não conta como manifestação humana.

## 2. Identificação e delegação dos responsáveis

| Responsabilidade | Nome/identificação do titular | Forma de designação e referência | Possível acumulação/conflito revisado? | Estado |
| --- | --- | --- | --- | --- |
| Architecture Owner | **PENDING** | **PENDING** | **PENDING** | **PENDING** |
| RFC Owner / Architecture Team | **PENDING** | **PENDING** | **PENDING** | **PENDING** |
| Architecture Review | **PENDING** | **PENDING** | **PENDING** | **PENDING** |
| Platform Owner | **PENDING** | **PENDING** | **PENDING** | **PENDING** |
| Security Owner | **PENDING** | **PENDING** | **PENDING** | **PENDING** |
| Operations Owner | **PENDING** | **PENDING** | **PENDING** | **PENDING** |

**Regra:** não preencher a partir da autoria de commits, titularidade do repositório ou relatórios automatizados. Caso uma mesma pessoa exerça múltiplos papéis, registrar a autorização desse arranjo e avaliar o conflito antes de considerar cada parecer válido.

## 3. Parecer — Architecture Review (RFC-0020)

| Campo | Registro |
| --- | --- |
| Revisor e papel verificado | **PENDING** |
| RFC e versão analisadas | `RFC-0020`, versão a confirmar |
| Escopo | Compatibilidade RFC-0015/RFC-0099, Dependency Rule, contratos públicos, riscos e Cross Review |
| Evidências-base | `docs/audits/OS-GOV-PHASE-02-NORMATIVE-REVIEW.md`; `docs/audits/OS-GOV-PHASE-02-REVIEW-EVIDENCE.md`; `packages/contracts/src/persistence.ts` |
| Decisão (`ACCEPT` / `ACCEPT_WITH_CONDITIONS` / `REQUEST_CHANGES`) | **PENDING** |
| Condições/riscos aceitos ou objeções | **PENDING** |
| Data da manifestação | **PENDING** |
| Referência verificável (PR review, registro ou link) | **PENDING** |
| Validação de independência/acumulação | **PENDING** |

## 4. Parecer — Platform Owner (RFC-0020 / ADR-0006)

| Campo | Registro |
| --- | --- |
| Revisor e papel verificado | **PENDING** |
| Escopo | Compatibilidade `IPersistenceProvider` / `IPersistenceService` / `IRepository`; composition root; reversibilidade; plano de testes |
| Evidências-base | `rfc/RFC-0015-data-layer.md`; `rfc/RFC-0020-durable-persistence-transactions-tenancy.md`; `adr/ADR-0006-durable-persistence-adapter.md`; especificação OS-DATA-0001 |
| Decisão (`ACCEPT` / `ACCEPT_WITH_CONDITIONS` / `REQUEST_CHANGES`) | **PENDING** |
| Condições e evidências futuras de implementação | **PENDING** |
| Data da manifestação | **PENDING** |
| Referência verificável | **PENDING** |
| Validação de independência/acumulação | **PENDING** |

## 5. Parecer — Security Owner (RFC-0020)

| Campo | Registro |
| --- | --- |
| Revisor e papel verificado | **PENDING** |
| Escopo | Tenant scope server-side, default deny, cross-tenant, RLS pré-produção, redaction, credenciais e caminhos privilegiados |
| Evidências-base | `rfc/RFC-0020-durable-persistence-transactions-tenancy.md`; `docs/plans/OS-DATA-0001-EXECUTION-GATE.md`; relatório de revisão |
| Decisão (`ACCEPT` / `ACCEPT_WITH_CONDITIONS` / `REQUEST_CHANGES`) | **PENDING** |
| Condições para testes negativos e RLS E2E | **PENDING** |
| Data da manifestação | **PENDING** |
| Referência verificável | **PENDING** |
| Validação de independência/acumulação | **PENDING** |

## 6. Parecer — Operations Owner (ADRs 0006/0007)

| Campo | Registro |
| --- | --- |
| Revisor e papel verificado | **PENDING** |
| Escopo | Banco isolado, secret management, pool/timeouts, migrações separadas do startup, drift, expand/contract, rollback/restore |
| Evidências-base | `adr/ADR-0006-durable-persistence-adapter.md`; `adr/ADR-0007-migrations-and-transactions.md`; execution gate e readiness checklist |
| Decisão (`ACCEPT` / `ACCEPT_WITH_CONDITIONS` / `REQUEST_CHANGES`) | **PENDING** |
| Condições e provas futuras | **PENDING** |
| Data da manifestação | **PENDING** |
| Referência verificável | **PENDING** |
| Validação de independência/acumulação | **PENDING** |

## 7. Encerramento normativo da RFC-0020 — reservado à autoridade competente

| Campo | Registro |
| --- | --- |
| Architecture Owner identificado e competência comprovada | **PENDING** |
| Architecture Review formal concluída e referenciada | **PENDING** |
| Parecer Platform Owner concluído e referenciado | **PENDING** |
| Parecer Security Owner concluído e referenciado | **PENDING** |
| Condições ou divergências resolvidas/aceitas formalmente | **PENDING** |
| Decisão sobre `Draft → Review` | **PENDING** |
| Decisão sobre `Review → Approved` | **PENDING** |
| Aprovador | **PENDING** |
| Data e referência verificável | **PENDING** |

**Não alterar** o status da RFC-0020 por completar este modelo. Se a decisão for de aprovação, registrar primeiro as manifestações e a autorização conforme RFC-0099, atualizar o Approval Record e só então processar o lifecycle no PR apropriado.

## 8. Decisões posteriores e limites

| Item | Estado | Pré-requisito imediato |
| --- | --- | --- |
| ADR-0006 | `Draft` / **PENDING** | RFC-0020 normativamente `Approved` e aceites pertinentes |
| ADR-0007 | `Draft` / **PENDING** | RFC-0020 `Approved`, decisão ADR-0006 e revisão Operations |
| OS-DATA-0001 | `BLOCKED` | Aprovações normativas explícitas e condições do execution gate verificadas |
| Liberação de produção multi-tenant | **BLOCKED** | RLS E2E ou alternativa aprovada normativamente por RFC |

**Separação de evidências:** revisão e aceitação de um plano podem ocorrer antes do desenvolvimento; testes de durabilidade, transações, provider, drift e RLS são evidências a serem produzidas nas fases autorizadas. Esta distinção não modifica automaticamente os requisitos existentes do execution gate.

## 9. Procedimento para preenchimento

1. Confirmar a identidade e a competência da pessoa que revisará cada papel.
2. Entregar os documentos e riscos daquele papel.
3. Coletar decisão explícita, condições, data e referência verificável.
4. Registrar manifestação sem inferir aprovação de outros papéis.
5. Submeter divergências de papéis/acumulações à governança competente.
6. Atualizar o `OS-GOV-PHASE-02-APPROVAL-RECORD.md` apenas após evidência efetiva.
7. Reavaliar os gates; não iniciar implementação nem efetuar deploy por causa deste registro.

**Resultado deste arquivo:** `PENDING_SIGNOFF`; nenhum sign-off foi recebido ou presumido.
