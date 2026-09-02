# Data Access Contracts

Status: Implemented  
Authorization: RFC-0015 + IMP-0031

## Contract surface

`packages/contracts/src/persistence.ts` exports universal types for values, keys, records, metadata, operations, pagination, results, repository, provider, service and snapshots.

`IRepository` is asynchronous even for memory, preserving compatibility with future remote or database adapters. `IPersistenceProvider` supplies repositories and a public snapshot. `IPersistenceService` is the Kernel facade.

## Keys and records

A key contains namespace, collection and id. Each segment is a required safe string and cannot contain control characters or traversal syntax. A record contains identity, scope, integer version, serializable data, optional declarative metadata, and ISO creation/update timestamps.

Optional tenant, workspace and actor metadata are passive declarations only. They do not implement Auth, tenant isolation or permissions.

## Result pattern

Expected operation outcomes return `PersistenceResult<T>` with `ok`, optional data/error, warnings and diagnostics. Duplicate create, missing update, invalid keys/data/scope and pagination errors do not expose exception internals.

## Serialization

Allowed values are strings, finite numbers, booleans, null, arrays and plain objects. Functions, undefined, symbols, bigint, class instances, Date, Map, Set, Promise, Error, RegExp, circular structures and framework objects are rejected. Dates inside record data must be ISO strings.

## Immutability

Inputs are cloned. Records, nested data, metadata, tag arrays, list results, issues and snapshots are frozen. Internal maps and mutable references never leave the provider.

## Guardrails

Contracts and Kernel have no Prisma, PostgreSQL, ORM, driver, SQL, migration, connection-string or `DATABASE_URL` dependency. A pure-Node filesystem test scans central source files without relying on external commands.
