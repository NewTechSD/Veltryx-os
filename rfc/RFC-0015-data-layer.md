# RFC-0015: Data Layer — Persistence & Data Access Contracts

Status: Approved  
Version: 1.0  
Type: Architectural RFC  
Owner: Architecture Team  
Reviewers: Architecture Review  
Created: 2026-09-02  
Last Updated: 2026-09-02  
Depends On: RFC-0001, RFC-0002, RFC-0004, RFC-0005, RFC-0006, RFC-0099  
Related To: RFC-0003, RFC-0007, ADR-0001, ADR-0002, ADR-0003, ADR-0004

## Summary

The Data Layer defines adapter-agnostic persistence and repository contracts. Persistence is a contract, not a database. The Kernel initially provides an in-memory adapter; database adapters remain future infrastructure.

## Principles and public contracts

- Contracts define data access; adapters implement storage.
- Repository is an asynchronous public contract, not an ORM implementation.
- Kernel and Contracts cannot depend on a database, driver, ORM, filesystem storage or physical schema.
- Persisted values must be universal, serializable data.
- Public results and snapshots are immutable and safe.
- Expected failures use structured results instead of exceptions.

The contract surface includes persistence values, keys, records, record metadata, create/update/list/count inputs, list results, result/error/warning/diagnostic types, repository, provider, service and snapshot. Operations are `create`, `get`, `update`, `delete`, `list`, `exists` and `count`. Complex queries, joins, search, sorting and transactions are not defined by this version.

## Provider and service

`IPersistenceProvider` owns adapter identity and creates repositories scoped by namespace and collection. `IPersistenceService` is the Kernel facade exposed to Runtime and future modules. Provider internals, maps, clients, factories and connections are never public snapshot data.

## Initial in-memory adapter

The Kernel implements a singleton in-memory provider for development, tests and contract proof. It isolates namespaces and collections, clones inputs, freezes outputs, versions records and generates ISO timestamps. It is not durable storage.

## Validation and immutability

Keys require non-empty safe strings and reject control characters and traversal. Data permits finite numbers, strings, booleans, null, arrays and plain objects. Functions, undefined, symbols, bigint, class instances, Date, Map, Set, Promise, Error, RegExp, framework elements and circular references are rejected.

Public records, nested data, metadata, arrays, results, warnings, errors, diagnostics and snapshots are cloned and deeply frozen.

## Results, diagnostics and snapshots

Expected conditions return `PersistenceResult`. Errors and warnings contain safe codes and context. Diagnostics contain severity and timestamps. They never expose stack traces, environment values, secrets, record payloads, connections, drivers, clients or ORM instances.

The snapshot exposes only status, generation time, provider identity/kind, namespace/collection/record counters, warnings, errors and diagnostics. Runtime and Kernel Status may copy only this lightweight summary.

## Future adapters

PostgreSQL and Prisma may be evaluated as future infrastructure adapters under a separate approved IMP. This RFC does not approve a driver, ORM, SQL, schema, connection, migration or database deployment.

## Guardrails

`packages/contracts` and `packages/kernel` must not import or instantiate Prisma, PostgreSQL, MySQL, SQLite, MongoDB, Redis, TypeORM, Sequelize, Knex or another driver/ORM. They must not contain raw SQL, connection strings, migration engines or direct `DATABASE_URL` reads.

## Non-goals

- real database, ORM, driver or migrations;
- filesystem as primary persistence;
- transactions, optimistic locking or complex queries;
- API, Auth, permissions, tenant behavior or business rules;
- Builder, publishing or delivery adapters;
- persistence of existing subsystems in this iteration.

## Decision

Contracts define Data Access. Kernel exposes Persistence Service. The in-memory adapter proves the contract. Real databases remain future adapters.
