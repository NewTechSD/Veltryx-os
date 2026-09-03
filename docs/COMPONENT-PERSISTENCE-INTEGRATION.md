# Component Persistence Integration

## Objective and authority

TASK-0315D is the third structural consumer of the Data Layer. Authorized by RFC-0007, RFC-0015, RFC-0099, ADR-0004 and IMP-0031D, it keeps the Component Registry as the synchronous operational catalog and adds an explicit asynchronous backing-store bridge through `IPersistenceService`.

```text
Component Registry
        |
Component Persistence Service
        |
IPersistenceService
        |
In-memory Persistence Provider
```

## Storage and public operations

Definitions use persistence namespace `components`, collection `component.definitions`, and persistence-safe ids `<component-key>:<component-version>`. `kernel.componentPersistence()` exposes `persistComponent`, `persistAllComponents`, `loadComponent`, `listComponents`, `hydrateRegistry`, and `snapshot`. Existing registry operations remain synchronous and unchanged.

## Declarative boundary

Persisted fields are limited to the existing `ComponentDefinition`: key, name, label, description, type, category, version, props schema, slots, capabilities, allowed children, tags, and source.

Executable or platform-specific values are rejected, including rendering callbacks, visual component implementations, factories, implementation objects/locations, templates, PHP/WordPress/Gutenberg details, framework objects, element shapes and DOM-like objects. Definitions must also pass the public Component Validator and recursive serialization validation.

## Hydration and conflicts

Hydration reads only through repository contracts, validates each record and registers valid declarations explicitly. Invalid entries are skipped with safe warnings. If the same key and version already exist, the operational registry wins and a conflict warning is returned. There is no implicit replacement.

## Snapshot and guardrails

The public snapshot contains only status, timestamp, provider id/kind, persisted/hydrated counters and sanitized diagnostics. It excludes definitions, persistence records, registries, repositories, provider internals, implementation details, paths, stacks and secrets.

Pure Node.js guardrails verify the persistence bridge contains no framework imports, JSX/TSX source, forbidden implementation fields, WordPress/Gutenberg/PHP coupling, database driver, ORM or SQL dependency.

## Limits and next steps

The in-memory provider remains non-durable. There is no renderer, visual adapter, Builder, Marketplace, package upload, transaction, migration, distributed synchronization or database. A future approved task may add durable infrastructure behind the same contracts without moving implementation details into Core.
## Relation to UI Composition Persistence

Persisted component declarations remain independent source data. IMP-0031E uses the operational Component Registry to validate derived snapshot component keys; it does not embed component implementations in composition records.

API v1 exposes declarative component summaries only; visual implementations remain outside the Core.
