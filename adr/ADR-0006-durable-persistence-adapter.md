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

Use PostgreSQL as the initial relational candidate and keep the provider boundary in infrastructure. Treat Prisma as an implementation option, not an architectural contract; select it only after validating transaction control, migration ownership, query transparency, connection lifecycle, generated-client boundaries and operational tooling. A thin SQL/query adapter remains the fallback if ORM behavior obscures invariants.

## Consequences

Positive: mature transactions, constraints, indexing, backup tooling and future RLS support.  
Negative: operational database dependency, connection management, migration discipline and higher test setup.  
Neutral: Kernel and Contracts remain unchanged.

## Approval conditions

Approve only after RFC-0018 review, provider contract tests, security review, migration strategy and environment/secret plan are accepted. This Draft does not authorize installation or implementation.
