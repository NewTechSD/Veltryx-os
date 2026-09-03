# IMP-0031F: Snapshot Retention + Audit Policy

Status: Approved  
Version: 1.0  
Type: Implementation Plan  
Owner: Architecture Team  
Created: 2026-09-02  
Last Updated: 2026-09-02  
Depends On: RFC-0005, RFC-0007, RFC-0015, RFC-0099, ADR-0004, IMP-0031E, TASK-0315E

## Objective

Add explicit retention, deterministic integrity checks and structural audit to derived UI Composition Snapshots through `IPersistenceService`.

## Authorized policy

- Retention applies only through explicit source or global enforcement calls.
- No bootstrap, compose, background or scheduled cleanup is authorized.
- Audit entries contain operation metadata and counters, never trees, nodes, props or persistence records.
- SHA-256 uses canonical safe snapshot content without `persistedAt`, secrets or signatures.
- Latest pointers are repaired after explicit delete and prune operations.
- Metadata and Component Registry remain the source of truth; snapshots remain derived.

## Storage and public boundary

The policy uses the existing `composition.snapshots` and `composition.latest` collections plus `composition.audit` and `composition.retention-runs`. It depends only on public repository contracts. Aggregate Runtime and Kernel Status summaries do not expose audit entries.

## Tests and non-goals

Tests cover default policy, dry-run, per-source/per-purpose/global retention, latest protection and repair, deterministic checksums, integrity verification, structural audit, immutability and guardrails.

Database, durable audit, scheduler, worker, queue, automatic cleanup, publishing, Delivery Plane, runtime adapter, secret signing and HMAC remain outside scope. RFC-0008 remains Draft and RFC-0009 remains reserved.
