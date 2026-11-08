# OS-DATA-0001 — Durable Persistence Implementation Specification

**Status:** Draft; executable only after RFC-0018 and ADR-0006 approval  
**Scope:** first durable provider slice  
**Out of scope:** authentication, RBAC, physical schema committed by this review, Admin UI, production deployment

## 1. Objective

Implement a PostgreSQL-backed provider behind the existing persistence boundary, using Prisma Client only inside infrastructure. Preserve the existing in-memory provider for contract tests and local fallback environments where explicitly configured.

## 2. Required package boundary

```text
packages/contracts       public persistence contracts only
packages/kernel          IPersistenceService consumer only
packages/persistence-*   infrastructure adapter, Prisma client and migrations
apps/admin / host         provider composition and environment configuration
```

The exact package name is a follow-up implementation choice. It must not place Prisma, generated clients, SQL or migration code in `packages/contracts` or `packages/kernel`.

## 3. Adapter behavior

The adapter must implement:

- `IPersistenceProvider` and repository operations without changing their public shapes;
- stable namespace/collection mapping owned by the adapter;
- deterministic ordering for `list`;
- bounded `limit`/`offset` behavior compatible with in-memory tests;
- version column and compare-and-update behavior;
- duplicate/not-found/invalid-scope/conflict errors mapped to safe `PersistenceResult` codes;
- provider snapshot with id, name, kind, counts, health status and sanitized diagnostics only.

The host composition root injects the provider. Configuration selects `memory` or `database` without Kernel reading environment variables or constructing clients.

## 4. Connection and failure policy

- Separate credentials and databases for development, test, staging and production.
- Use bounded pool size, acquisition timeout, statement timeout and transaction timeout.
- Health check verifies connectivity and migration compatibility without exposing connection details.
- Connection loss, timeout, deadlock and serialization failures are mapped to safe diagnostics.
- Reads may retry only when the operation is safe and bounded; writes require an idempotency invariant before retry.
- Secrets never enter snapshots, logs, thrown messages or test fixtures.

## 5. Scope and tenancy guard

This slice may expose the provider for platform-owned data only until OS-SEC-0003 supplies the authoritative effective tenant. Any protected repository path must reject missing scope and must not use a client-supplied `tenantId` as authority. The adapter must include tests proving that an explicit record ID from another tenant cannot be read, updated or deleted.

The first shared-table implementation requires centralized scoped repository construction and a negative test suite. PostgreSQL RLS may remain outside this development slice, but production multi-tenant data is blocked until RLS is implemented and validated with end-to-end isolation tests. A different control is valid only if an approved RFC or RFC successor explicitly authorizes it after security review, with measurable compensating controls; an ADR or informal security exception is insufficient.

## 6. Transaction and concurrency seam

OS-DATA-0001 must not invent a public Unit of Work contract. It may implement an internal infrastructure seam required by OS-DATA-0002. All repository instances resolved inside one internal transaction must use the same physical transaction. Independent repository calls outside a Unit of Work retain current behavior.

Mutable updates use an expected version. A mismatch returns a structured conflict and leaves the current record unchanged. No automatic retry occurs for a conflict.

## 7. Migration gate

Prisma Migrate is the recommended tool. Migration files are reviewed and committed, applied by a deployment operation using `prisma migrate deploy`, checked for history/checksum drift and never implicitly applied by Kernel startup. Physical schema details are produced in the implementation task after ADR approval, not by this specification.

Use expand/contract for incompatible changes. Rollback is forward-fix or tested restore/redeploy; a down migration is not presumed safe.

## 8. Required tests

1. Existing in-memory contract suite remains green.
2. Durable adapter passes create/get/update/delete/list/exists/count cases.
3. Restart preserves committed data.
4. Duplicate, not-found, invalid data, invalid scope and timeout errors are sanitized.
5. Version conflict leaves data unchanged.
6. Transaction commit and rollback tests cover multiple repositories.
7. Connection loss/deadlock/timeout behavior is bounded and observable.
8. Migration apply, drift detection and failed deployment are tested.
9. Cross-tenant read/update/delete negative tests are mandatory when scoped data is enabled.
10. Snapshot remains immutable, aggregate-only and compatible with Runtime/Admin consumers.

## 9. Acceptance gate

OS-DATA-0001 is not accepted until the provider passes the public contract suite, has a verified test database, demonstrates restart durability, proves sanitized failures and version conflicts, and confirms no import path from Kernel or Contracts reaches Prisma or PostgreSQL.
