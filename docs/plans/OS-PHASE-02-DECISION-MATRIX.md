# OS Phase 02 — Decision Matrix

**Status:** Review package  
**Normative status:** No decision below is Approved by this document. RFCs/ADRs remain Draft until Architecture Review accepts them.  
**Owner:** Architecture Team  
**Reviewers:** Architecture Review

## 1. Decision register

| ID   | Decision             | Recommendation                                                                     | Current state | Owner / approver         | Blocking condition                          |
| ---- | -------------------- | ---------------------------------------------------------------------------------- | ------------- | ------------------------ | ------------------------------------------- |
| D-01 | Durable database     | PostgreSQL                                                                         | Proposed      | Architecture Team        | Approve ADR-0006                            |
| D-02 | Data access          | Prisma Client in infrastructure; SQL adapter fallback                              | Proposed      | Architecture + Platform  | Contract/transaction tests                  |
| D-03 | Provider composition | Host composition root selects provider                                             | Proposed      | Platform owner           | No Kernel/Contracts import                  |
| D-04 | Migrations           | Prisma Migrate, reviewed deploy step                                               | Proposed      | Platform + Operations    | Drift/checksum/rollback runbook             |
| D-05 | Transactions         | Application-owned short Unit of Work                                               | Proposed      | Architecture Team        | Atomicity and conflict tests                |
| D-06 | Concurrency          | Optimistic version locking by default                                              | Proposed      | Platform owner           | Conflict result semantics                   |
| D-07 | Identity             | Hybrid: external IdP primary, local break-glass disabled by default                | Proposed      | Security owner           | Threat model and recovery controls          |
| D-08 | Sessions             | Server-side opaque, expiring and revocable                                         | Proposed      | Security owner           | Cookie/CSRF/rate-limit tests                |
| D-09 | Authorization        | Server-side default-deny RBAC                                                      | Proposed      | Security + Domain owners | Policy and membership contracts             |
| D-10 | Tenant baseline      | Shared PostgreSQL schema/tables with mandatory scoped repositories and `tenant_id` | Proposed      | Architecture Team        | Cross-tenant negative suite                 |
| D-11 | RLS                  | Defer first slice; mandatory production gate or approved exception                 | Proposed      | Security owner           | RLS proof or compensating-control exception |
| D-12 | Audit                | Separate redacted audit trail from logs and backups                                | Proposed      | Security/Operations      | Retention and restore test                  |

## 2. Alternatives and consequences

| Area         | Selected path                       | Rejected/deferred alternatives             | Consequence                                                                 |
| ------------ | ----------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------- |
| Database     | PostgreSQL                          | Document DB, database-per-tenant initially | Lower initial operational complexity; requires disciplined tenant filtering |
| Access       | Prisma Client adapter               | Direct SQL as first path                   | Faster schema/client development; Prisma cannot leak past infrastructure    |
| Migrations   | Prisma Migrate deploy               | Startup mutation, ad hoc SQL               | Reproducible history; deployment must handle drift and failed changes       |
| Identity     | External IdP + local break-glass    | Local-only, IdP-only                       | Lower ordinary credential burden with controlled recovery path              |
| Isolation    | Shared tables + scoped repositories | Schema/database per tenant initially       | Cost-effective baseline; RLS or exception required before production        |
| Transactions | Unit of Work                        | Independent repository commits             | Atomic multi-write operations; requires transaction propagation             |

## 3. Dependencies

```text
RFC-0018 -> ADR-0006 -> OS-DATA-0001
RFC-0018 -> ADR-0007 -> OS-DATA-0002
RFC-0019 -> ADR-0008 -> OS-SEC-0001
OS-SEC-0001 -> OS-SEC-0002 -> OS-SEC-0003
OS-DATA-0002 + OS-SEC-0003 -> OS-SEC-0004
OS-SEC-0001..0004 -> OS-ADMIN-SEC-0001
```

No implementation task may consume an unapproved public contract. If `IUnitOfWork`, scoped repository, identity provider, session store, membership repository, policy evaluator or audit event becomes public, create a versioned contract proposal before coding.

## 4. Approval checklist

- [ ] RFC-0018 reviewed for persistence and tenancy.
- [ ] RFC-0019 reviewed for identity and authorization.
- [ ] ADR-0006 accepts or rejects PostgreSQL + Prisma.
- [ ] ADR-0007 accepts migration and Unit of Work semantics.
- [ ] ADR-0008 accepts security boundaries and RLS gate.
- [ ] Threat model has owners for all high/critical risks.
- [ ] OS-DATA-0001 test environment and rollback plan exist.
- [ ] Security owner accepts the pre-production RLS decision gate.
