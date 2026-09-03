# Metadata Persistence Integration

## Objective

This is the first structural use of the Data Layer in the Core. The Metadata Registry remains the synchronous operational index; `MetadataPersistenceService` is an explicit asynchronous backing-store bridge through `IPersistenceService`.

Authorized by RFC-0005, RFC-0015, RFC-0099 and IMP-0031B, it neither depends on RFC-0008 nor changes the RFC-0009 reservation.

```text
Metadata Registry
        |
Metadata Persistence Service
        |
IPersistenceService
        |
In-memory Persistence Provider
```

## Public operations and collections

`kernel.metadataPersistence()` exposes `persistNamespace`, `persistResource`, `loadResource`, `listResources`, `hydrateRegistry` and `snapshot`. Existing synchronous Metadata Engine APIs are unchanged.

The logical persistence namespace is `metadata`; definitions use `metadata.namespaces` and `metadata.resources`. Keys are logical identifiers, never file paths, URLs or implementation locations.

## Hydration and conflict policy

Hydration reads through repository contracts, validates each record and registers only valid declarative metadata. Invalid records are skipped with warnings. Existing operational registry entries win conflicts and are never replaced implicitly.

## Public snapshot and guardrails

The snapshot contains only status, timestamp, provider id/kind, persisted/hydrated counters and sanitized diagnostic arrays. It excludes resources, records, repositories, maps, providers, connection data, secrets and stacks.

Only serializable primitives, arrays and plain objects are accepted. Functions, undefined, symbols, bigint, class instances, Date, Map, Set, Promise, Error, RegExp, cycles and platform element shapes are rejected.

## Limits and next step

The provider remains process-local and non-durable. There is no automatic write-through, transaction, migration, distributed synchronization, tenant enforcement or database adapter. A future approved task may supply durable infrastructure behind the unchanged contracts.
## Relation to UI Composition Persistence

Metadata persistence remains a backing store for declarative resources. UI Composition Persistence validates against the operational Registry and stores only derived snapshots; it does not use those snapshots to replace metadata.

The API Layer exposes metadata summaries through the Runtime API Bridge without returning executable definitions.
