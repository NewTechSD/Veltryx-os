# OS-GOV-PHASE-02 — Persistence Architecture Governance Approval Review

**Branch:** `feature/os-gov-phase-02-approval`  
**Audited HEAD:** `fc49567`  
**Result:** `CHANGES_REQUIRED` for formal approval readiness  
**Scope:** normative review only; no implementation authorization is granted

## 1. Executive summary

The persistence proposal is technically coherent with RFC-0015 when treated as a Draft package. RFC-0020 defines the durable adapter boundary, migration ownership, Unit of Work, optimistic concurrency, tenant scope and the production RLS gate. ADR-0006 and ADR-0007 refine the PostgreSQL/Prisma and migration/transaction choices without placing infrastructure in Kernel or Contracts.

Formal approval was previously blocked by an identifier collision that is resolved by this reconciliation under RFC-0099. `docs/DEPENDENCY-GRAPH.md` and `docs/IMPLEMENTATION-ROADMAP.md` use `RFC-0018` for a planned “Deployment” capability, while the persistence proposal now has the unique identifier `RFC-0020`. The referenced Deployment RFC is absent from the checkout, but its historical identifier remains reserved and preserved.

Therefore, the persistence documentation is reviewable under RFC-0020. No status has been changed automatically.

## 2. Documents and statuses

| Identifier | Current status | Owner / required reviewer               | Recommendation              | Conditions                                                                                    |
| ---------- | -------------- | --------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------- |
| RFC-0020   | Draft          | Architecture Team / Architecture Review | **Ready for formal review** | Cross-review and explicit approve/reject decision required                                    |
| ADR-0006   | Draft          | Architecture Team / Architecture Review | **Conditional approval**    | Requires an approved, uniquely identified parent RFC and provider contract/operational review |
| ADR-0007   | Draft          | Architecture Team / Architecture Review | **Conditional approval**    | Requires an approved, uniquely identified parent RFC and migration/UoW test plan              |
| RFC-0019   | Draft          | Architecture Team / Architecture Review | Remain Draft                | Out of this gate; identity/security approval is a separate decision                           |
| ADR-0008   | Draft          | Architecture Team / Architecture Review | Remain Draft                | Out of this gate; must not be used as a RLS exception                                         |
| RFC-0015   | Approved       | Architecture Team / Architecture Review | Preserve                    | Existing contract boundary remains compatible                                                 |
| RFC-0099   | Approved       | Architecture Team / Architecture Review | Preserve                    | Governs lifecycle and collision reconciliation                                                |

`APPROVED` in this report would mean documentation ready for an authorized governance decision only. It would not approve any RFC or ADR automatically.

## 3. RFC-0020 normative review

### Conformance confirmed

- Durable provider remains behind `IPersistenceService`, `IPersistenceProvider` and `IRepository`.
- Kernel and Contracts remain free of PostgreSQL, Prisma, SQL, migration engine, connection strings and physical schema.
- Provider selection belongs to the host composition root.
- Protected data requires effective server-side tenant scope; client tenant hints are not authority.
- Unit of Work is application/infrastructure-owned, short-lived and atomic.
- Repositories in one Unit of Work share the same physical transaction.
- Optimistic locking uses explicit version conflicts; retries require idempotency.
- Migration ownership, checksums, drift detection, expand/contract and restore/redeploy rollback are defined.
- Credentials, clients, connections and secrets remain outside public snapshots and diagnostics.
- RLS may remain outside OS-DATA-0001 development, but real multi-tenant production data is blocked until RLS is implemented and end-to-end tested or an alternative is explicitly authorized by an approved RFC.
- In-memory remains the contract-test provider and public snapshots remain aggregate-only.

### Residual risks and gaps

1. The collision was resolved by reserving historical `RFC-0018 Deployment` and renumbering the persistence proposal to `RFC-0020`.
2. `RFC-0015` does not expose transactions, optimistic locking or tenant enforcement publicly. OS-DATA-0001 must keep those seams internal or create a new versioned contract RFC before exposing them.
3. RLS implementation details, database session identity and privileged-job policy remain future implementation decisions; production cannot be declared ready from application filters alone.
4. A physical schema, migration set, provider package and test database are intentionally absent and must not be inferred from this review.

## 4. ADR-0006 review

The proposed PostgreSQL + Prisma Client decision is compatible with RFC-0015 if all generated clients, migrations, SQL and transaction handles stay in infrastructure. The composition root selects the provider, environments use isolated credentials and databases, pools/timeouts/health checks are bounded, and diagnostics are redacted. The adapter is reversible while consumers depend only on the public provider contract.

Recommendation: approve only after the parent RFC identifier is uniquely reconciled, provider contract tests and an isolated database plan are accepted, and the platform owner confirms the secret, pool, timeout, health and rollback policy.

## 5. ADR-0007 review

The proposed Prisma Migrate + Unit of Work + optimistic locking decision specifies reviewed migration directories, controlled `prisma migrate deploy`, checksum/history validation, drift blocking, expand/contract, forward-fix or tested restore/redeploy rollback, atomic short transactions, shared physical transaction propagation, explicit version conflicts and bounded idempotent retries.

Recommendation: approve only after the parent RFC identifier is uniquely reconciled and the migration/UoW test plan demonstrates commit, rollback, timeout, deadlock/connection failure, conflict and retry behavior. No Prisma client may enter Contracts or Kernel.

## 6. Evidence from contracts and implementation

- `packages/contracts/src/persistence.ts` exposes repository operations and provider/service snapshots, but no public Unit of Work, transaction, locking or migration API.
- `packages/kernel/src/core/persistence/persistence-service.ts` is a thin facade over `IPersistenceProvider`.
- `packages/kernel/src/core/persistence/in-memory-persistence-provider.ts` is process-local and is appropriate as a contract/test provider, not as durable storage.
- `packages/kernel/src/core/persistence/in-memory-repository.ts` provides current duplicate, not-found, validation, version increment and immutable record behavior; it does not provide durable transaction semantics.
- `rfc/RFC-0015-data-layer.md` explicitly keeps database, ORM, migrations, transactions and tenant behavior outside its current contract version.

These facts support the proposed adapter boundary but also prove that OS-DATA-0001 must not silently extend public Contracts.

## 7. Dependency and identifier review

The requested persistence package depends on RFC-0015 and RFC-0099 and should precede durable provider implementation. However:

- `docs/DEPENDENCY-GRAPH.md` contains `RFC-0018 Deployment` under RFC-0017 Observability.
- `docs/IMPLEMENTATION-ROADMAP.md` references `RFC-0018` as a dependency of the historical `IMP-0018 Queue`/Deployment path.
- No `rfc/RFC-0018-deployment.md` exists in the checkout.
- The persistence RFC now uses `RFC-0020`.

The historical Deployment identifier is preserved and the persistence proposal now has the unique identifier RFC-0020. Silent reuse is no longer present.

## 8. Conditions to release OS-DATA-0001

OS-DATA-0001 may start only after all of the following are true:

1. The RFC identifier collision is resolved and RFC-0020 is uniquely referenced.
2. The parent RFC has completed `Draft → Review → Approved` under RFC-0099, or an explicit authorized governance decision permits the implementation stage.
3. ADR-0006 is approved for PostgreSQL + Prisma Client in infrastructure.
4. ADR-0007 is approved for Prisma Migrate, Unit of Work and optimistic locking.
5. The existing in-memory contract suite and a compatible durable-provider test plan are accepted.
6. An isolated database for tests is available by approved infrastructure means; no production database is introduced by this task.
7. Restart durability, sanitized snapshots/errors, version conflicts and provider compatibility are acceptance tests.
8. No real multi-tenant production data is enabled; authentication/RBAC remain outside OS-DATA-0001.
9. Any new public transaction, scope or conflict contract is proposed in a separate versioned RFC before implementation.

## 9. Decision awaiting authorized owner

The responsible authorized Architecture Team owner must explicitly choose one of:

- **Approve:** approve RFC-0020, then approve ADR-0006 and ADR-0007, subject to their conditions.
- **Reject:** reject one or more decisions and return the affected document to Draft with rationale.
- **Request changes:** keep all documents in Draft and require a revised package.

No technical report, Prettier result or test result substitutes for that decision.

## 10. Final result

`APPROVED_WITH_NOTES`: the identifier collision is reconciled and the persistence package is ready for formal approval. OS-DATA-0001 remains blocked until RFC-0020, ADR-0006 and ADR-0007 receive explicit authorized approval.
