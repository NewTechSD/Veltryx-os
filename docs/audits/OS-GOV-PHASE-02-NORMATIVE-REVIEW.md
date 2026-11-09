# OS-GOV-PHASE-02 — Formal Normative Review

**Branch:** `feature/os-gov-phase-02-normative`  
**Audited HEAD:** `add544b`  
**Overall result:** `READY_WITH_CONDITIONS`  
**Normative status:** no RFC or ADR was promoted to `Approved`

## 1. Executive conclusion

RFC-0020, ADR-0006 and ADR-0007 are sufficiently specified for an explicit Architecture Owner decision. RFC-0020 is compatible with RFC-0015 and preserves the Kernel/Contracts boundary. ADR-0006 and ADR-0007 are compatible implementation decisions within that proposed boundary.

The package is not an automatic approval and OS-DATA-0001 remains blocked. The responsible owner must record an explicit decision in the Approval Record after the conditions below are accepted. The technical review does not substitute for the `Draft → Review → Approved` lifecycle required by RFC-0099.

## 2. Formal classification

| Document | Classification          | Rationale                                                                                                                                                      |
| -------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RFC-0020 | `READY_FOR_APPROVAL`    | Scope, alternatives, compatibility, RLS production gate, reversibility and contract impact are defined; only the authorized normative decision remains pending |
| ADR-0006 | `READY_WITH_CONDITIONS` | PostgreSQL + Prisma is compatible, but provider contract tests, isolated database plan, secret/pool/timeout policy and reversibility evidence must be accepted |
| ADR-0007 | `READY_WITH_CONDITIONS` | Migration/UoW semantics are defined, but migration test plan, drift/rollback evidence and transaction failure tests must be accepted                           |

## 3. RFC-0020 review

### Compatibility with RFC-0015

RFC-0015 defines `IPersistenceService`, `IPersistenceProvider`, `IRepository`, structured `PersistenceResult` values and aggregate-only snapshots. RFC-0020 preserves those contracts and places PostgreSQL, Prisma, SQL, migrations and transaction handles in infrastructure.

The current contract does not expose transactions, optimistic locking or tenant enforcement. RFC-0020 correctly requires those capabilities to remain internal or to receive a separate versioned contract RFC before crossing package boundaries. No implementation may silently extend `packages/contracts/src/persistence.ts`.

### Architecture and operations

The proposal adequately defines:

- durable provider behind the existing service/provider/repository boundary;
- composition-root provider selection;
- environment-separated credentials and bounded pools/timeouts;
- health/readiness checks and redacted diagnostics;
- short application-owned Unit of Work;
- atomic propagation across repositories in one Unit of Work;
- optimistic version conflicts and constrained retries;
- migration ownership, checksums, drift detection and expand/contract;
- forward-fix or tested restore/redeploy rollback;
- mandatory effective server-side tenant scope;
- negative cross-tenant tests;
- RLS implementation and end-to-end validation before production multi-tenant data;
- normative RFC approval requirement for any alternative to RLS;
- reversible adapter selection while consumers depend only on public contracts.

### RFC-0020 residual risks

- No durable provider, test database or migration set exists yet; these are implementation evidence, not missing RFC scope.
- A public Unit of Work or scoped repository contract would require a new/versioned RFC.
- RLS session identity and privileged-job behavior require implementation design and end-to-end tests.
- Production multi-tenant release remains blocked until the RLS gate or a separately approved RFC alternative is satisfied.

**Recommendation:** `READY_FOR_APPROVAL`.

## 4. ADR-0006 review

The proposed decision is PostgreSQL as the initial durable store and Prisma Client exclusively inside infrastructure. It is compatible with RFC-0015 and RFC-0020 if:

- the host composition root selects the provider;
- Kernel and Contracts never import ORM/driver/client types;
- credentials are injected per environment through approved secret handling;
- pool size, connection acquisition, statement and transaction timeouts are bounded;
- health checks and diagnostics redact URLs, credentials and driver details;
- the SQL/query adapter remains a fallback if Prisma cannot satisfy transaction, migration, RLS/session or operational requirements;
- the provider can be replaced while consumers remain on public interfaces.

**Recommendation:** `READY_WITH_CONDITIONS`.

Conditions are implementation-readiness evidence, not permission to install Prisma or PostgreSQL in this task.

## 5. ADR-0007 review

The proposed decision is Prisma Migrate with reviewed versioned migrations, history/checksum validation, drift detection, controlled deployment, expand/contract changes, forward-fix or tested restore/redeploy rollback, short atomic Unit of Work, shared transaction scope, optimistic version checks and bounded idempotent retries.

This is compatible with the current repository contract because transaction behavior remains an internal infrastructure/application seam. All repositories resolved inside one Unit of Work must share one physical transaction; partial independent commits are prohibited.

**Recommendation:** `READY_WITH_CONDITIONS`.

Conditions include an accepted migration/UoW test plan covering commit, rollback, timeout, cancellation, deadlock/connection loss, version conflict, safe retry and drift failure.

## 6. Coordinated approval sequence

RFC-0099 requires RFC review before implementation and requires ADRs to remain within the approved RFC boundary. The coordinated sequence is:

1. Architecture Owner records RFC-0020 as `Review` after cross-review and explicitly approves or rejects it.
2. Once RFC-0020 is `Approved`, Architecture Owner/Architecture Review decide ADR-0006.
3. After the provider decision is accepted, Architecture Owner/Platform and Operations decide ADR-0007.
4. The responsible owner records the three decisions in `docs/decisions/OS-GOV-PHASE-02-APPROVAL-RECORD.md` with date, approver and reference.
5. Platform Team re-evaluates `OS-DATA-0001-READINESS-CHECKLIST.md` and the execution gate.
6. Only when every required execution condition is evidenced may OS-DATA-0001 be released for implementation.

Technical review completion is distinct from acceptance of the decision, normative status transition and execution-gate release.

## 7. Decision of the project responsible

On 2026-11-09, the responsible project authority explicitly recorded:

> Autorizo a aprovação arquitetural da RFC-0020, condicionada à comprovação das revisões obrigatórias previstas na RFC-0099. Esta decisão não autoriza automaticamente a aprovação dos ADRs 0006 e 0007 nem a implementação OS-DATA-0001.

This is recorded as `CONDITIONAL_APPROVAL_AUTHORIZED`. It is not represented as an approval by any other owner and has `PENDING_REQUIRED_REVIEWS` normative effectiveness.

The required reviews remain:

1. **Architecture Review:** cross-review of RFC-0020 against RFC-0015, RFC-0099, contracts and related ADRs; confirm the decision is structurally compatible.
2. **Platform Owner:** compatibility review of `IPersistenceProvider`, `IPersistenceService` and `IRepository`, composition-root selection, provider boundary, operational readiness and reversibility.
3. **Security Owner:** tenancy, isolation, RLS-before-production, cross-tenant negative tests, secret handling and non-authority of client-provided scope.

Evidence still required:

- explicit review records or references from each required owner;
- confirmation that RFC-0020 may transition through `Review` under RFC-0099;
- acceptance of ADR-0006 and ADR-0007 as separate decisions, not implied by RFC-0020 authorization;
- completion evidence for the OS-DATA-0001 readiness checklist and execution gate after implementation planning;
- no approval of PostgreSQL/Prisma installation, migrations, production deployment or OS-DATA-0001 implementation before those conditions are satisfied.

The conditional authorization produces normative effect only when the required reviews are evidenced and the authorized Architecture Owner records the resulting decision and reference in the Approval Record.

## 8. Execution gate review

| Condition                                         | State                                  | Evidence / responsible owner                                |
| ------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------- |
| Unique parent RFC                                 | Satisfied                              | RFC-0020 reconciliation report; Architecture Team           |
| RFC-0020 formally Approved                        | Pending                                | Approval Record; Architecture Owner                         |
| ADR-0006 Approved                                 | Pending                                | Approval Record; Architecture Owner / Platform owner        |
| ADR-0007 Approved                                 | Pending                                | Approval Record; Architecture Owner / Platform + Operations |
| Provider compatibility suite                      | Pending implementation evidence        | OS-DATA-0001; Platform Team                                 |
| Isolated test database                            | Pending implementation evidence        | OS-DATA-0001 environment plan; Platform/Operations          |
| Secrets, pool, timeout and health policy          | Specified, not operationally evidenced | RFC-0020, OS-DATA-0001 spec; Platform/Operations            |
| Migration/drift/rollback rules                    | Specified, tests pending               | ADR-0007 and implementation evidence; Platform/Operations   |
| Scoped repository and negative cross-tenant tests | Required, not implemented              | OS-SEC-0003 dependency; Security/Platform                   |
| Production multi-tenant authorization             | Explicitly prohibited for OS-DATA-0001 | Execution Gate; Security owner                              |

## 9. Final recommendation

`READY_WITH_CONDITIONS`: the package is ready for explicit formal decision. RFC-0020 may enter `Review`; ADR-0006 and ADR-0007 may be decided only within the approved RFC boundary. No document is approved by this report, and OS-DATA-0001 remains blocked until the Approval Record and execution checklist are completed by authorized owners.
