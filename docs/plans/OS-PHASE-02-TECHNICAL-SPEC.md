# OS Phase 02 — Technical Specification

**Status:** Draft / implementation-ready after RFC and ADR approval  
**Basis:** RFC-0011, RFC-0015, proposed RFC-0018, proposed RFC-0019, ADR-0006–0008  
**Scope:** durable persistence, identity, sessions, authorization, tenancy and audit; no production implementation in this task.

## 1. Target flow

```text
Browser / Client
    ↓
Admin / API adapter
    ↓
Session authentication
    ↓
Principal resolution
    ↓
Tenant membership validation
    ↓
Authorization / RBAC
    ↓
Execution Context
    ↓
Application service
    ↓
Scoped repository / Unit of Work
    ↓
Durable persistence adapter
    ↓
PostgreSQL candidate
```

No arrow permits a caller to promote a client-provided user, role, permission, tenant or workspace value into authority.

## 2. Layer responsibilities

| Layer                | Responsibility                                                 | Must not do                                                     |
| -------------------- | -------------------------------------------------------------- | --------------------------------------------------------------- |
| Contracts            | Stable public types and structured outcomes                    | Import database/auth libraries or encode physical schema        |
| Kernel               | Context, registries, orchestration and safe snapshots          | Read credentials, open DB connections or decide browser policy  |
| Infrastructure       | Durable provider, session store, identity adapters, migrations | Leak clients, secrets or driver errors through public snapshots |
| Application services | Use cases, authorization invocation and Unit of Work ownership | Trust client scope or bypass policy                             |
| Admin/API            | Transport, cookie/CSRF handling and public read models         | Decide authorization or access Kernel internals                 |
| Business modules     | Own domain data and declared resources                         | Query another owner’s storage directly                          |

## 3. Persistence technical rules

- The in-memory provider remains the contract-test adapter.
- The durable provider implements current repository semantics before adding extensions.
- Protected repositories receive an effective scope from authenticated context or are rejected.
- Every mutable record has a version; update conflicts are explicit.
- List operations require stable ordering and bounded pagination.
- Multi-write use cases run in one Unit of Work.
- Migrations are versioned, checksummed and owned; destructive changes require an expand/contract plan.
- Connection strings, secrets, SQL and ORM clients are infrastructure-only.
- Snapshots expose provider health and counts only.

## 4. Identity and session rules

- Authentication produces a server-resolved Principal and AuthSession.
- Session records are opaque, expiring and revocable; identifiers rotate after authentication and privilege changes.
- Browser cookies are HttpOnly, Secure where applicable and use an explicit SameSite policy.
- State-changing cookie requests require CSRF protection.
- Recovery tokens are single-use, short-lived and stored hashed.
- Login/recovery responses are enumeration-resistant and rate-limited.
- Password hashing and identity-provider adapters are selected through security review.
- MFA is represented as a future authentication-strength extension, not implemented here.

## 5. Authorization and tenant rules

The decision input is `principal + effective tenant + workspace + resource + action + attributes`. The result is default deny unless an explicit policy grants access. Roles aggregate permissions; memberships scope roles to tenants and workspaces.

Tenant selection is a validated server operation. The effective tenant comes from active membership, not a request field. All protected reads, writes, caches, jobs and events preserve that scope. Platform-global permissions are separately named and audited.

Application-scoped repositories are mandatory for development and homologation, with negative cross-tenant tests. They are not sufficient for production multi-tenant data: PostgreSQL RLS must be implemented and validated end-to-end before production. A different production control requires explicit authorization in an approved RFC or RFC successor with security review, compensating controls and measurable acceptance criteria; an ADR or operational exception cannot replace that approval.

## 6. Audit, backup and recovery

Audit trail records authentication, session, membership, authorization and administrative events with actor, scope, resource/action, request/correlation IDs, result, policy version and timestamp. Sensitive values are redacted. Operational logs, audit records and backups are separate.

Backups require encryption, retention, access control, restore verification and a recovery runbook. Migration rollback is defined per migration strategy; application rollback must not assume schema rollback is always safe.

## 7. Implementation sequence

1. Approve RFC-0018/RFC-0019 and ADR-0006–0008.
2. Define/version any required public contracts and contract tests.
3. Implement durable provider behind the existing boundary.
4. Implement migration and Unit of Work infrastructure.
5. Implement identity/session adapter and Principal resolution.
6. Implement policy evaluator and membership checks.
7. Enforce scoped repositories and cross-tenant denial.
8. Add audit, backups and restore verification.
9. Integrate Admin login only after server-side authorization is available.

## 8. First implementation acceptance criteria

The first persistence task is accepted only when:

- a durable adapter passes the existing repository contract suite;
- data survives process restart in an isolated test database;
- provider selection remains outside Kernel/Contracts;
- records have stable versions and conflict behavior;
- failures are sanitized and observable;
- transaction behavior is covered for commit, rollback, timeout and conflict;
- tenant-scoped access denies absent, invalid and cross-tenant scope;
- snapshots remain immutable, aggregate-only and compatible;
- no production credentials or physical schema are committed to the repository.
