# IMP-0031E: UI Composition Persistence Integration

Status: Approved  
Version: 1.0  
Type: Implementation Plan  
Owner: Architecture Team  
Created: 2026-09-02  
Last Updated: 2026-09-02  
Depends On: RFC-0005, RFC-0007, RFC-0015, RFC-0099, ADR-0004, IMP-0031, TASK-0312, TASK-0315, TASK-0315D

## Objective

Connect the UI Composition Runtime to the Data Layer through an explicit `IUICompositionPersistenceService` using only `IPersistenceService`.

## Authorized design

- Metadata and Component Registry remain the declarative source of truth.
- UI Composition Runtime remains the operational derivation mechanism.
- Persisted Composition Snapshots are derived, controlled artifacts only.
- Persistence is explicit; existing synchronous composition APIs never persist automatically.
- Storage uses `ui-composition/composition.snapshots` and `ui-composition/composition.latest`.
- Latest entries are an explicit lookup index and are never consumed automatically by composition.

## Validation and loading

Every tree is structurally validated, all component keys are resolved through the public Component Registry, and metadata-backed sources are resolved through the public Metadata Registry. Missing required components or sources are errors. Loaded snapshots are revalidated and returned as immutable clones.

## Runtime-agnostic boundary

Only serializable declarative tree data may be persisted. Executable values, framework/platform objects, renderers, factories, implementation locations, raw HTML hooks and platform templates are rejected recursively.

## Public integration and snapshot

The implementation exposes `kernel.uiCompositionPersistence()`, registers `kernel.uiCompositionPersistence` in Service Registry and DI, and contributes aggregate-only Runtime and Kernel Status summaries. Public snapshots never contain trees, nodes, persistence records, provider internals, implementation details, stacks or secrets.

## Tests and non-goals

Tests cover persistence, compose-and-persist, load/latest/list/delete, source and component validation, serialization, immutability and public integrations. Guardrails use Node.js `fs` and `path` only.

Persisted snapshots are not source-of-truth UI definitions, publishing artifacts, Delivery Plane inputs or runtime adapters. Renderer, visual adapter, Builder, publishing, deployment, database, ORM, SQL, API and migrations remain outside scope. RFC-0008 remains Draft and RFC-0009 remains reserved.
