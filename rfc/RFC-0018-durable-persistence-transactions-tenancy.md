# RFC-0018: Durable Persistence, Transactions & Tenant Isolation

Status: Draft  
Version: 0.1  
Type: Architectural RFC  
Owner: Architecture Team  
Reviewers: Architecture Review  
Depends On: RFC-0001, RFC-0002, RFC-0004, RFC-0005, RFC-0006, RFC-0015, RFC-0099  
Related To: RFC-0011, RFC-0013, ADR-0006, ADR-0007  
Supersedes: None

## 1. Summary

This proposal defines the architecture for a durable persistence adapter, transaction boundaries, migrations and tenant isolation. It preserves `IPersistenceService`, `IPersistenceProvider` and `IRepository` as the Kernel-facing boundary and places PostgreSQL, drivers, ORM/query tooling and migrations in infrastructure.

This RFC is a proposal only. It does not approve a database deployment, ORM, physical schema or production implementation.

## 2. Problem

RFC-0015 intentionally provides an adapter-agnostic, in-memory contract. The platform now requires durable state, atomic multi-repository operations, version conflict detection and server-side tenant isolation without coupling Contracts or Kernel to storage technology.

The current `PersistenceRecordMetadata.tenantId` and `workspaceId` are descriptive metadata. They are not an authorization boundary. A future adapter must make scope an invariant of the operation, not an optional property supplied by a caller.

## 3. Goals and non-goals

### Goals

- Provide a durable provider behind the existing persistence boundary.
- Define transaction/Unit of Work semantics without leaking a database client into Kernel.
- Define migration ownership and compatibility rules.
- Define tenant and workspace scope propagation and default-deny behavior.
- Preserve safe, aggregate-only snapshots.
- Support a first implementation with PostgreSQL as the recommended candidate, subject to ADR approval.

### Non-goals

- Selecting a final vendor by this RFC.
- Defining physical tables or migrations.
- Building an ORM abstraction in Contracts.
- Implementing authentication, RBAC, backups or business repositories.
- Making tenant metadata alone a security control.

## 4. Proposed architecture

```text
Application / Runtime service
        |
        v
Scoped repository or Unit of Work contract
        |
        v
IPersistenceService / provider boundary
        |
        v
Infrastructure durable adapter
        |
        v
PostgreSQL candidate (driver/query/ORM remains infrastructure)
```

The Kernel may compose a provider through dependency injection, but must not import a driver, ORM, connection string, SQL, migration engine or physical schema. Contracts remain serializable and technology-neutral.

## 5. Durable provider requirements

The durable adapter must implement the existing repository behavior and document any capability differences. It must provide:

- durable create/read/update/delete/list/exists/count;
- bounded pagination with explicit ordering;
- stable record versioning;
- optimistic concurrency using an expected version or equivalent conflict result;
- structured errors without driver messages or secrets;
- connection lifecycle, health and timeout policy in infrastructure;
- safe retry rules distinguishing idempotent reads from writes;
- provider snapshots containing identity and aggregate health only.

If transaction or scope capabilities require new public interfaces, they must be introduced by a later contract RFC or a backward-compatible extension reviewed under RFC-0099. An implementation may initially expose them through an application-side internal port, provided no consumer depends on a physical client.

## 6. Transactions and Unit of Work

A Unit of Work groups writes that must commit atomically. The boundary belongs to an application service or infrastructure port, not to a UI, controller or individual repository call.

Required semantics:

1. A successful unit commits all writes.
2. A failure rolls back all writes in the unit.
3. A conflict is explicit and retryable only when the operation is safe to retry.
4. External side effects do not execute inside an uncommitted database transaction; an outbox decision is required before event-driven behavior is added.
5. Nested units must either join the outer unit or be rejected; implicit independent commits are forbidden.
6. Timeouts and cancellation must produce a safe, observable failure.

The first implementation should prefer short application-owned transactions and avoid exposing a general transaction callback in the public Kernel contract until its lifecycle and error semantics are approved.

## 7. Migrations and ownership

Migrations are versioned infrastructure artifacts. Each owned schema area has one owner, an ordered migration history, checksum validation and a documented forward/rollback policy. A module may own its data model only through a governed module migration contract; it may not mutate another owner’s tables directly.

Deployment must separate migration execution from application startup unless an approved operational policy explicitly couples them. Incomplete or incompatible migrations must fail closed and report a sanitized diagnostic.

## 8. Tenant isolation policy

The effective tenant is derived from an authenticated session and an authorized membership. A client-provided tenant hint is a requested target only.

Rules:

- A principal may belong to multiple tenants.
- Tenant switching requires membership validation and creates a new effective context.
- Workspace membership must be inside the effective tenant.
- Protected repositories require an effective tenant scope; missing scope is denied.
- Cross-tenant reads and writes are denied by default.
- Platform-global permissions are distinct from tenant-local permissions.
- Personal accounts and organization/tenant accounts have explicit ownership boundaries.
- Background jobs, caches, events and snapshots preserve the effective scope.

## 9. Isolation alternatives

| Strategy                         | Security                         |  Complexity | Operations                                                            | Recommendation                                                          |
| -------------------------------- | -------------------------------- | ----------: | --------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Shared tables + `tenant_id`      | Depends on every query and tests |  Low/medium | Lowest cost, simplest migrations                                      | Baseline only with centralized scoped repositories and defense in depth |
| Shared database + PostgreSQL RLS | Strong database backstop         | Medium/high | Requires session variables, policy testing and operational discipline | Recommended evolution for sensitive shared data                         |
| Schema per tenant                | Stronger boundary                |        High | Migration fan-out and backup complexity                               | Reserved for selected isolation tiers                                   |
| Database per tenant              | Strongest physical separation    |   Very high | Provisioning, pooling, migrations and restore are expensive           | Reserved for regulated/high-value tenants                               |
| Hybrid                           | Fits differentiated requirements |        High | Multiple operational paths                                            | Future tiering after baseline evidence                                  |

Recommended initial strategy: shared PostgreSQL database/schema with mandatory application-scoped repositories and `tenant_id`, plus an ADR evaluating RLS as a defense-in-depth control before production. Schema/database isolation remains an evolution path for specific tiers.

## 10. Security and operational requirements

Credentials are supplied to infrastructure through a secret manager or deployment environment. They must not appear in Contracts, Kernel, snapshots, logs or repository errors. Development, staging and production use separate credentials and data boundaries.

The adapter must support health checks, bounded connection pools, statement timeouts, redacted diagnostics and tested restore procedures. Backups and audit trail are separate concerns and must not be represented as ordinary runtime snapshots.

## 11. Compatibility and impact

The existing in-memory provider remains the contract test adapter. Existing public repository operations and snapshots remain compatible. A future public Unit of Work, scoped repository or concurrency error contract requires explicit versioning and review; this RFC does not silently add those interfaces.

## 12. Acceptance criteria for approval

- Provider, transaction and tenant boundaries are reviewed by Architecture Team.
- Contract impact and compatibility are explicitly accepted.
- Provider/migration ADRs are approved.
- Cross-tenant and conflict tests are specified before implementation.
- PostgreSQL/RLS decision is recorded separately from this RFC.
