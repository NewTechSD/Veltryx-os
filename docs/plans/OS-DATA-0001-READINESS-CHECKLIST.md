# OS-DATA-0001 — Readiness Checklist

**Status:** Blocked pending normative approval  
**Owner:** Platform Team  
**Authorizing authority:** Architecture Owner / Architecture Review  
**Parent decisions:** RFC-0020, ADR-0006 and ADR-0007

## 1. Governance preconditions

- [x] RFC identifier collision reconciled; persistence proposal is RFC-0020.
- [ ] RFC-0020 completed `Draft → Review → Approved` under RFC-0099.
- [ ] ADR-0006 explicitly approved within RFC-0020’s boundary.
- [ ] ADR-0007 explicitly approved within RFC-0020’s boundary.
- [ ] Approval Record contains approver, date, reference and conditions for all three documents.

## 2. Contract and boundary checks

- [ ] Provider implements existing `IPersistenceProvider` without breaking `IPersistenceService` or `IRepository`.
- [ ] Existing in-memory provider remains available for tests and explicitly configured local use.
- [ ] No Prisma, PostgreSQL, SQL, migration engine, connection string or generated client is imported by `packages/contracts` or `packages/kernel`.
- [ ] Provider selection occurs at the host composition root.
- [ ] Any required Unit of Work, scope or conflict contract is either internal or covered by a separately approved versioned RFC.
- [ ] Public snapshots remain immutable, aggregate-only and free of records, connections, clients, secrets and stack traces.

## 3. Environment and operations

- [ ] Isolated database exists for automated durable-provider tests; it is not shared with development, staging or production data.
- [ ] Environment-specific secret injection is documented and verified without committing credentials.
- [ ] Pool bounds, connection acquisition timeout, statement timeout and transaction timeout are documented and tested.
- [ ] Health/readiness checks expose sanitized status only.
- [ ] Provider, driver and ORM failures map to structured, redacted diagnostics.
- [ ] Replacement of the provider is possible while consumers remain on public contracts.

## 4. Migration and transaction readiness

- [ ] Prisma Migrate migration history is versioned, reviewed and checksum-validated.
- [ ] Drift detection fails closed before deployment.
- [ ] Migration deployment is separate from ordinary Kernel startup.
- [ ] Expand/contract policy is documented for incompatible changes.
- [ ] Rollback is forward-fix or tested restore/redeploy; no untested down migration is assumed safe.
- [ ] Multiple repositories inside one Unit of Work share one physical transaction.
- [ ] Commit applies all writes; rollback applies none.
- [ ] Timeout, cancellation, deadlock and connection-loss paths roll back the complete unit.
- [ ] Optimistic version conflicts are explicit and leave current data unchanged.
- [ ] Retries are bounded and restricted to operations with an idempotency invariant.

## 5. Scope and security limits

- [ ] Protected repository paths reject missing effective tenant scope.
- [ ] Client-provided `tenantId`, roles, permissions and user IDs are not authority.
- [ ] Cross-tenant read/update/delete negative tests are implemented before scoped data is enabled.
- [ ] Jobs, caches and events preserve effective scope where included in the adapter boundary.
- [ ] OS-DATA-0001 does not implement authentication, sessions, RBAC or membership resolution.
- [ ] Real multi-tenant production data remains blocked until PostgreSQL RLS is implemented and end-to-end tested or an alternative is explicitly authorized by an approved RFC.
- [ ] RLS is not introduced as an unreviewed side effect of the first adapter.

## 6. Required evidence package

The Platform Team must attach:

1. Contract-test results for in-memory and durable providers.
2. Restart durability evidence.
3. Version-conflict and sanitized-error evidence.
4. Transaction commit/rollback/timeout/conflict/retry results.
5. Migration apply, checksum/drift and failure evidence.
6. Test database isolation and secret/pool/timeout configuration evidence.
7. Import-boundary scan proving Kernel/Contracts remain infrastructure-agnostic.

## 7. Release decision

OS-DATA-0001 is **NOT READY TO START** while any governance or contract-boundary checkbox remains unchecked. Completion of this checklist permits implementation review only; it does not authorize production deployment or multi-tenant release.
