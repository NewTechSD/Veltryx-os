# ADR-0007: Migration and Transaction Boundaries

Status: Draft  
Version: 0.1  
Type: ADR  
Owner: Architecture Team  
Reviewers: Architecture Review  
Depends On: RFC-0015, RFC-0018, RFC-0099  
Related To: ADR-0006  
Supersedes: None

## Context

The current public repository contract has no transactions, optimistic locking or migration API. Durable storage requires atomic application operations and reproducible schema evolution.

## Decision proposal

Keep migrations as versioned infrastructure artifacts owned by the platform or an explicitly governed module. Execute them through a dedicated deployment operation with checksum and compatibility checks; do not make ordinary application startup implicitly mutate schema.

Represent transaction ownership in an application/infrastructure port first. A Unit of Work is short-lived, application-owned and atomic. Repositories participate in the current unit rather than opening independent commits. Conflicts produce a structured retryable result; external effects wait for commit or use a future outbox design.

Optimistic locking is the default for mutable records, using a version predicate and explicit conflict outcome. Pessimistic locking is reserved for narrowly justified workflows.

## Alternatives

- Startup migrations: simple deployment, but couples availability to schema mutation and complicates rollback.
- Manual SQL only: transparent but harder to standardize and audit.
- ORM-generated migrations: productive, but must be reviewed and checked for ownership and destructive operations.

## Consequences and approval conditions

The proposal improves atomicity and reproducibility but requires deployment tooling, migration tests, conflict handling and operational runbooks. Approval requires a selected tool, rollback policy, compatibility window and proof that no transaction client leaks into Kernel or Contracts.
