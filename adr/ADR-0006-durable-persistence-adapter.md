# ADR-0006: Durable Persistence Adapter Candidate

Status: Draft  
Version: 0.1  
Type: ADR  
Owner: Architecture Team  
Reviewers: Architecture Review  
Depends On: RFC-0015, RFC-0018, RFC-0099  
Related To: RFC-0011, ADR-0007  
Supersedes: None

## Context

RFC-0015 defines an adapter-agnostic persistence boundary and explicitly leaves database, ORM, schema and migration choices open. Phase 2 requires a durable implementation without importing infrastructure into Contracts or Kernel.

## Options

1. PostgreSQL with a thin SQL/query adapter.
2. PostgreSQL with Prisma in infrastructure.
3. Another relational database and adapter.
4. Document/NoSQL storage.

## Recommendation

Select PostgreSQL as the initial durable database and Prisma Client as the first infrastructure adapter, with Prisma Migrate for versioned schema changes. Keep the provider boundary in infrastructure and keep generated clients, migration files and transaction handles out of Contracts and Kernel. A thin SQL/query adapter is the fallback if Prisma fails the required query transparency, RLS/session-variable control, migration review or operational tests.

The host composition root selects the provider. Environment-specific secret injection, pool bounds, connection/statement/transaction timeouts, health checks and redacted diagnostics are mandatory. No database dependency is introduced into Kernel or Contracts.

## Consequences

Positive: mature transactions, constraints, indexing, backup tooling and future RLS support.  
Negative: operational database dependency, connection management, migration discipline and higher test setup.  
Neutral: Kernel and Contracts remain unchanged.

## Reversibility

The decision is reversible while consumers depend only on `IPersistenceService` and contract tests. Reversal requires stopping new writes, validating the replacement adapter against the same suite, migrating or exporting data, and switching the composition root through a controlled deployment. Prisma-specific models must not escape the adapter boundary.

## Approval conditions

Approve only after RFC-0018 review, provider contract tests, security review, migration strategy and environment/secret plan are accepted. This Draft does not authorize installation or implementation.
