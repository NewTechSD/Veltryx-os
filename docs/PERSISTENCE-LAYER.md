# Persistence Layer

> TASK-0315B validates the layer with a Metadata bridge that depends only on `IPersistenceService`, never on the in-memory implementation.

> TASK-0315C adds Configuration as the second structural consumer, limited to public allowlisted values.

> TASK-0315D adds declarative Component Registry definitions as the third structural consumer.

Status: Implemented  
Authorization: RFC-0015 + IMP-0031

## Objective

The Persistence Layer gives Kernel, Runtime and future modules an adapter-agnostic data-access boundary. It separates consumers from storage technology.

```text
Kernel / Runtime / Modules
          |
          v
  Persistence Service
          |
          v
 Persistence Provider
          |
          v
      Repository
          |
          v
  Specific adapter
```

Persistence is a contract, not a database. The only current adapter is memory-backed. It proves repository behavior but is not durable and is not a substitute for a production database.

## In-memory provider

`InMemoryPersistenceProvider` isolates namespace and collection maps internally. It returns scoped asynchronous repositories, validates keys and serializable values, clones input, deeply freezes output, generates timestamps and increments versions.

Supported operations are create, get, update, delete, list, exists and count. List supports only bounded offset/limit pagination.

## Kernel integration

`kernel.persistence()` exposes `IPersistenceService`. The singleton is registered as `kernel.persistence` in Service Registry and Dependency Injection. Runtime bootstrap consumes its public snapshot and copies a lightweight summary to Runtime Context and Runtime Status. Kernel Status exposes the same aggregate summary.

## Public snapshot

The snapshot contains provider id/name/kind, status, generation time and namespace/collection/record counters plus safe issues. It never includes stored records, maps, connections, clients, environment values, secrets or stack traces.

## Future infrastructure

A future PostgreSQL/Prisma adapter may implement the approved contracts in infrastructure under a separate IMP. No ORM, driver, SQL, physical schema or migration is approved or present now.

## Current limitations

- process-local and non-durable;
- no transactions or optimistic locking;
- no filters, sorting, joins, search or query language;
- no persistence migration of Metadata, Configuration, modules or UI;
- no Auth, permission or tenant enforcement.
## UI Composition consumer

IMP-0031E is the fourth structural consumer. It stores explicitly generated, derived Composition Snapshots and an auxiliary latest index through `IPersistenceService`; no snapshot becomes source of truth or publishing artifact.

IMP-0031F adds explicit audit and retention records for UI Composition Snapshots. No scheduler or durable audit implementation is introduced.
