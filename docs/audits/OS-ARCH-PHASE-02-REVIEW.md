# OS-ARCH-PHASE-02 — Architecture Review

**Branch:** `feature/os-arch-phase-02`  
**Audited HEAD:** `47e407c`  
**Result:** `APPROVED_WITH_NOTES`

## 1. Executive summary

The proposed Phase 2 architecture is internally consistent with RFC-0011, RFC-0015 and RFC-0099 when treated as Draft material. It keeps infrastructure outside Kernel/Contracts, treats tenant isolation as a security invariant, and separates authentication, authorization, persistence, audit and backup responsibilities.

The documentation is ready for architectural review. It is not approval of PostgreSQL, Prisma, any physical schema, a public contract extension or production functionality.

## 2. Documents produced

| Document                                                   | Status and purpose                                               |
| ---------------------------------------------------------- | ---------------------------------------------------------------- |
| `rfc/RFC-0018-durable-persistence-transactions-tenancy.md` | Draft; durable provider, transactions, migrations and tenancy    |
| `rfc/RFC-0019-identity-sessions-authorization-rbac.md`     | Draft; identity, sessions, authorization and RBAC                |
| `adr/ADR-0006-durable-persistence-adapter.md`              | Draft; PostgreSQL candidate and adapter choice                   |
| `adr/ADR-0007-migrations-and-transactions.md`              | Draft; migration and transaction implementation boundary         |
| `adr/ADR-0008-security-implementation-boundaries.md`       | Draft; security placement across API, application and Kernel     |
| `docs/plans/OS-PHASE-02-TECHNICAL-SPEC.md`                 | Draft technical specification and first-task acceptance criteria |

## 3. Inventory and compatibility review

The existing contracts and implementation were checked against `packages/contracts/src/persistence.ts`, `auth.ts`, `tenant.ts`, `context.ts`, `api.ts`, Kernel persistence/auth/execution-context code, Admin adapters, current tests, `docs/PLATFORM-FOUNDATION.md`, `OS-SEC-DATA-0001` readiness/gap documents, RFC-0011, RFC-0015 and RFC-0099.

The proposals preserve the current boundary:

- `IPersistenceService`, `IPersistenceProvider` and `IRepository` remain the foundation.
- `AuthBridge`, `AuthContext`, `Principal` and Execution Context remain transport-agnostic.
- PostgreSQL, Prisma, SQL, sessions, credentials and migrations remain outside Kernel/Contracts.
- Admin consumes public decisions and snapshots; it is not an authorization authority.

## 4. Decision matrix

| Decision        | Recommendation                                       | Alternatives considered                                       | Gate                            |
| --------------- | ---------------------------------------------------- | ------------------------------------------------------------- | ------------------------------- |
| Durable store   | PostgreSQL candidate                                 | Other relational, document, per-tenant DB                     | ADR-0006 approval               |
| Data access     | Infrastructure adapter; Prisma optional              | Thin SQL/query adapter                                        | Contract and operational review |
| Tenant baseline | Shared relational data with mandatory scoped access  | RLS, schema/database per tenant, hybrid                       | RFC-0018 + RLS ADR review       |
| Transactions    | Application-owned short Unit of Work                 | Startup/implicit transactions, independent repository commits | ADR-0007 approval               |
| Identity        | Adapter-neutral authenticated Principal              | External IdP, local credentials, hybrid                       | RFC-0019 security review        |
| Sessions        | Server-side, opaque, expiring, revocable             | Stateless-only tokens                                         | Security threat model           |
| Authorization   | Server-side default-deny RBAC with scoped membership | UI-only or client claims                                      | RFC-0019 approval               |

## 5. Contract impact

No public contract was changed. The proposed RFCs identify likely future contracts for Unit of Work, concurrency outcomes, identities, sessions, memberships, policy decisions and audit events. Those additions require separate versioned review before implementation.

The existing persistence snapshot must remain sanitized and aggregate-only. No database client, ORM object, SQL, secret, record payload or stack trace may appear in public snapshots.

## 6. Risks and blockers

- Selecting Prisma before validating migration, transaction and query semantics could create accidental infrastructure coupling.
- Shared-table tenancy is unsafe without centralized scope enforcement, negative tests and possibly RLS defense in depth.
- Client-provided context can be mistaken for identity unless adapters discard it as authority.
- Session recovery, CSRF, rate limiting and enumeration controls are security-critical and cannot be deferred until after Admin UI work.
- Migration rollback may not be symmetric; expand/contract and backup restore must be tested.
- New public security contracts may require an additional RFC rather than an ADR.
- Historical IMP identifiers remain ambiguous; the proposed OS-* IDs must not be silently converted into legacy IMP IDs.

## 7. Sequence and first implementation gate

The first implementation should be the durable provider only after RFC-0018 and ADR-0006/0007 review. Its acceptance criteria are recorded in `docs/plans/OS-PHASE-02-TECHNICAL-SPEC.md`: contract compatibility, restart durability, sanitized errors, version conflicts, transaction coverage, scoped access and unchanged public snapshots.

Identity and Admin work must not be scheduled as a substitute for server-side authorization. Tenant membership and policy evaluation must precede sensitive Admin integration.

## 8. Governance conclusion

`APPROVED_WITH_NOTES`: the architecture package is ready for review under RFC-0099. All new RFCs and ADRs remain `Draft`; no existing normative document was modified or reclassified. Implementation is blocked until the required reviews and approvals are complete.
