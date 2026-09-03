# IMP-0031D: Component Registry Persistence Integration

Status: Approved  
Version: 1.0  
Type: Implementation Plan  
Owner: Architecture Team  
Created: 2026-09-02  
Last Updated: 2026-09-02  
Depends On: RFC-0007, RFC-0015, RFC-0099, ADR-0004, IMP-0031, TASK-0312, TASK-0315

## Objective

Connect the operational Component Registry to the Data Layer through an explicit `IComponentPersistenceService` using only `IPersistenceService`.

## Authorized design

- Component Registry remains the synchronous operational catalog.
- Component persistence and hydration are explicit asynchronous operations.
- Storage uses persistence namespace `components` and collection `component.definitions`.
- Record ids use the persistence-safe deterministic form `<component-key>:<component-version>`.
- Hydration validates every declaration; existing registry definitions win conflicts.
- Existing Component Registry APIs remain compatible.

## Runtime-agnostic boundary

Only declarative definitions may be persisted: key, version, type, category, name, label, description, prop schema, slots, capabilities, child constraints, tags and source. Executable values, framework/platform objects, renderers, factories, adapters, templates and implementation locations are rejected.

## Public integration and snapshot

The implementation exposes `kernel.componentPersistence()`, registers `kernel.componentPersistence` in Service Registry and DI, and contributes aggregate-only Runtime and Kernel Status summaries. Snapshots never contain component definitions, persistence records, implementation details, repositories, provider internals, stacks or secrets.

## Tests and non-goals

Tests cover persistence, load/list, explicit hydration, deterministic conflicts, unsafe fields, serialization, immutability, UI Composition compatibility and public integrations. Guardrails use Node.js `fs` and `path` only.

Renderer, visual adapter, Builder, Marketplace, component upload, WordPress/Gutenberg/PHP, database, ORM, SQL, API and publishing are outside scope. RFC-0008 remains Draft and RFC-0009 remains reserved.
