# UI Composition Persistence Integration

## Objective and authority

IMP-0031E integrates the UI Composition Runtime with the Data Layer under RFC-0005, RFC-0007, RFC-0015 and ADR-0004. The service persists controlled derived snapshots through `IPersistenceService`; it does not change the source-of-truth model.

```text
Metadata Registry + Component Registry
                 |
                 v
       UI Composition Runtime
                 |
                 v
 UI Composition Persistence Service
                 |
                 v
        IPersistenceService
                 |
                 v
  In-memory Persistence Provider
```

## Source versus derived snapshot

Metadata Registry remains the declarative resource source, Component Registry remains the declarative component catalog, and UI Composition Runtime remains the tree derivation mechanism. A persisted Composition Snapshot is only a controlled preview, cache, audit, diagnostic or test artifact. It never replaces those services, is not read automatically by `compose`, and is not a publishing or Delivery Plane artifact.

## Public service and storage

`kernel.uiCompositionPersistence()` exposes the public `IUICompositionPersistenceService`. The service uses only `IPersistenceService` and the collections:

- `ui-composition / composition.snapshots`: complete versioned snapshot entries;
- `ui-composition / composition.latest`: source-keyed pointers to the newest explicitly persisted snapshot.

Snapshot ids follow the Persistence Layer safe identifier grammar. The latest key is `latest:<sourceType>:<namespace>:<sourceId>`.

## Explicit operations

- `persistCompositionSnapshot` validates and stores an already-derived tree.
- `composeAndPersist` calls the existing runtime and then explicitly persists its result.
- `loadCompositionSnapshot` revalidates and returns an immutable tree.
- `loadLatestCompositionSnapshot` resolves the auxiliary latest pointer explicitly.
- `listCompositionSnapshots` returns aggregate summaries without trees or metadata.
- `deleteCompositionSnapshot` deletes only the selected snapshot.

The existing synchronous `compose` method remains unchanged and performs no writes.

## Validation

Before persist and after load, the service:

- runs the existing Composition Validator;
- resolves every root, child and slot `componentKey` and requested version against Component Registry;
- resolves non-custom source metadata by namespace/id and verifies source type compatibility;
- requires serializable plain data and rejects circular references;
- recursively rejects executable, framework, DOM, renderer, factory, implementation-location, raw-HTML-hook and platform-template fields.

Missing components, incompatible versions, missing required metadata sources and source-type mismatches are structured errors. Invalid stored snapshots are not returned as valid.

## Public snapshot and integrations

The aggregate snapshot contains status, provider id/kind, persisted/loaded/latest counters and sanitized warning/error/diagnostic arrays. It never includes trees, nodes, records, repositories, provider internals, implementation details, stacks, connections or secrets.

The singleton is registered as `kernel.uiCompositionPersistence` in Service Registry and DI. Runtime Context, Runtime Status and Kernel Status receive only the aggregate summary.

## Guardrails and limitations

Kernel and Contracts remain runtime/platform agnostic. No renderer, visual adapter, publishing flow, runtime adapter, framework component, database, ORM, driver, SQL, filesystem storage or migration is implemented. The in-memory provider is process-local, latest pointers are a simple index, and deleting a snapshot does not rewrite an existing latest pointer; loading that pointer safely returns no tree after the referenced snapshot is gone.

## Next steps

A future approved task may define retention and audit policy for derived snapshots. Database adapters, publishing and delivery/runtime adapters require their own approved governance and remain outside this integration.
