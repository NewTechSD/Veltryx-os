# ADR-0007: Migration and Transaction Boundaries

Status: Draft  
Version: 0.1  
Type: ADR  
Owner: Architecture Team  
Reviewers: Architecture Review  
Depends On: RFC-0015, RFC-0020, RFC-0099
Related To: ADR-0006  
Supersedes: None

## Context

The current public repository contract has no transactions, optimistic locking or migration API. Durable storage requires atomic application operations and reproducible schema evolution.

## Decision proposal

Use Prisma Migrate as the initial migration tool, with reviewed and committed migration directories, `prisma migrate deploy` as a dedicated deployment step, migration-history/checksum validation and drift detection. Migration ownership belongs to the platform for platform-owned tables and to a governed module for module-owned tables. No owner may mutate another owner’s schema directly. Use expand/contract for destructive or incompatible changes.

Do not make ordinary application startup implicitly mutate schema. A failed or drifted migration blocks the deployment and produces a sanitized operational diagnostic. Rollback is forward-fix or tested restore/redeploy by default; down migrations are not assumed safe.

Represent transaction ownership in an application/infrastructure port first. A Unit of Work is short-lived, application-owned and atomic. Repositories participate in the current unit rather than opening independent commits. Conflicts produce a structured retryable result; external effects wait for commit or use a future outbox design.

Optimistic locking is the default for mutable records, using a version predicate and explicit conflict outcome. Pessimistic locking is reserved for narrowly justified workflows.

The transaction contract must ensure that all repositories resolved inside one Unit of Work share the same physical transaction. A repository cannot commit independently while the Unit of Work is open. Timeout, cancellation, deadlock and connection loss roll back the complete unit. Retries are permitted only for explicitly idempotent operations and bounded by an idempotency key or equivalent application invariant.

## Alternatives

- Startup migrations: simple deployment, but couples availability to schema mutation and complicates rollback.
- Manual SQL only: transparent but harder to standardize and audit.
- ORM-generated migrations: productive, but must be reviewed and checked for ownership and destructive operations.

## Consequences and approval conditions

The proposal improves atomicity and reproducibility but requires deployment tooling, migration tests, conflict handling and operational runbooks. Approval requires a selected tool, rollback policy, compatibility window and proof that no transaction client leaks into Kernel or Contracts.
