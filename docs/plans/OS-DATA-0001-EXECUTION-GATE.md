# OS-DATA-0001 — Execution Gate

**Status:** Blocked pending formal governance approval  
**Owner:** Platform Team  
**Authorizing reviewers:** Architecture Team / Architecture Review  
**Parent decisions:** RFC-0020 (renamed from the persistence proposal formerly labeled RFC-0018), ADR-0006 and ADR-0007

## 1. Authorization boundary

This gate authorizes implementation only after the parent RFC and ADRs are explicitly approved by the responsible governance owner. It does not authorize PostgreSQL installation, Prisma installation, migrations or production deployment by itself.

## 2. Preconditions

- [x] Historical `RFC-0018 Deployment` identifier is preserved; persistence RFC is uniquely identified as RFC-0020.
- [ ] RFC-0020 completed `Draft → Review → Approved` under RFC-0099.
- [ ] ADR-0006 approved: PostgreSQL + Prisma Client only in infrastructure.
- [ ] ADR-0007 approved: Prisma Migrate, Unit of Work, optimistic locking and rollback policy.
- [ ] Repository contract compatibility plan is reviewed against `packages/contracts/src/persistence.ts`.
- [ ] Dependency graph and roadmap references use the reconciled identifier.
- [ ] Test database/environment is isolated from development, staging and production data.
- [ ] Secret, pool, timeout, health and redaction policies are documented.

If any precondition is unchecked, OS-DATA-0001 remains blocked.

## 3. Authorized implementation scope

OS-DATA-0001 may implement:

1. A PostgreSQL-backed provider behind `IPersistenceProvider`.
2. Prisma Client and generated artifacts only in the infrastructure adapter.
3. Composition-root provider selection.
4. Compatibility behavior for `IPersistenceService` and `IRepository`.
5. Isolated contract/integration tests against in-memory and durable providers.
6. Restart durability, sanitized errors/snapshots, versioning and conflict behavior.
7. Internal transaction seams required by OS-DATA-0002, without exposing a new public contract.

## 4. Explicit exclusions

The task must not:

- import Prisma/PostgreSQL from `packages/contracts` or `packages/kernel`;
- change public persistence contracts;
- create production migrations or physical schemas before the approved implementation plan;
- implement authentication, sessions, RBAC, memberships or authorization;
- enable real multi-tenant production data;
- treat `tenantId` metadata or client input as authorization;
- implement RLS as an unreviewed side effect;
- expose client/connection/SQL/ORM objects through snapshots or diagnostics;
- replace the in-memory provider for tests;
- modify Runtime/Admin authorization behavior.

## 5. Required acceptance tests

### Provider compatibility

- Existing in-memory persistence tests remain green.
- Durable provider passes create/get/update/delete/list/exists/count contract cases.
- Duplicate, not-found, invalid data, invalid scope and unavailable-provider results remain structured and sanitized.
- Public records and snapshots retain immutable, aggregate-only behavior.

### Durability and operations

- A committed record survives process/provider restart.
- Test database is isolated and can be recreated deterministically.
- Connection acquisition, statement and transaction timeouts are bounded.
- Health/readiness reports do not leak connection strings or secrets.
- Drift or incompatible migration state fails closed in the deployment operation, not by implicit Kernel startup mutation.

### Concurrency and atomicity

- Updates use explicit expected-version checks.
- Version conflict leaves the current record unchanged.
- Multiple repositories in one internal Unit of Work share one physical transaction.
- Commit applies all writes; rollback applies none.
- Timeout, cancellation, deadlock and connection loss roll back the complete unit.
- Retries occur only for explicitly idempotent operations with bounded attempts.

### Security boundary

- Secrets, credentials, SQL, ORM clients and stack traces are absent from logs, errors and snapshots.
- Protected data paths reject missing effective scope.
- Cross-tenant read/update/delete negative tests exist before any scoped data path is enabled.
- No authentication or RBAC behavior is implemented ahead of OS-SEC tasks.
- RLS production policy is not weakened by this task: real multi-tenant production data remains blocked until RLS is implemented and end-to-end tested or an alternative is authorized by an approved RFC.

## 6. Stop conditions

Stop and return to governance if:

- a public transaction, scope or concurrency contract is required;
- Prisma behavior requires leaking generated types or clients across the adapter boundary;
- migrations require startup mutation or an unreviewed destructive operation;
- tenant isolation cannot be enforced without trusting client input;
- tests require production data or an unapproved shared environment;
- a proposed RLS alternative is raised without an approved RFC.

## 7. Handoff decision

After implementation and tests, the Platform Team must provide evidence to Architecture Review. Passing this execution gate permits code review of OS-DATA-0001; it does not approve production release or the later identity/RBAC/multi-tenant tasks.
