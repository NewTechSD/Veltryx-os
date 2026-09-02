# IMP-0031B: Metadata Registry Persistence Integration

Status: Approved  
Version: 1.0  
Type: Implementation Plan  
Owner: Architecture Team  
Reviewers: Architecture Review  
Created: 2026-09-01  
Last Updated: 2026-09-01  
Depends On: RFC-0005, RFC-0015, RFC-0099, IMP-0031, TASK-0315  
Related To: RFC-0001, RFC-0002, RFC-0004, RFC-0006, RFC-0007, ADR-0004

## Objective

Prove the first structural use of the Persistence Layer by connecting the operational Metadata Registry to an abstract backing store through `IPersistenceService` only.

## Authorized design

- Metadata Registry remains the immediate synchronous operational index.
- Metadata Persistence Service is a separate asynchronous bridge.
- Persistence is explicit; existing registration APIs remain synchronous and compatible.
- `metadata.namespaces` and `metadata.resources` are dedicated collections under the `metadata` persistence namespace.
- Hydration validates stored metadata before registration.
- On conflict, an existing registry entry wins and hydration emits a warning.
- The in-memory provider proves the integration but is not accessed directly by the bridge.

## Public integration

- backward-compatible Metadata Persistence contracts and snapshot;
- `kernel.metadataPersistence()` public API;
- `kernel.metadataPersistence` Service Registry token;
- singleton DI provider depending on Metadata Registry and Persistence Service;
- lightweight summaries in Runtime Context, Runtime Status and Kernel Status.

## Guardrails and acceptance

Only serializable metadata is accepted. No functions, instances, framework objects, provider internals, records, maps, stacks, secrets or infrastructure details may enter global snapshots.

No Prisma, PostgreSQL, ORM, driver, SQL, migrations, filesystem storage, API, Auth, permissions, Builder or publishing is authorized. Tests must cover persistence, load/list, hydration, invalid records, conflicts, snapshots, integrations, compatibility and pure-Node scans. All gates and documentation are required.

## Governance

RFC-0008 remains Draft. RFC-0009 remains reserved for Builder/Application Model and is not modified or replaced.
