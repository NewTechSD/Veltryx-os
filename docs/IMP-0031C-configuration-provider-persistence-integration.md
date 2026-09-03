# IMP-0031C: Configuration Provider Persistence Integration

Status: Approved  
Version: 1.0  
Type: Implementation Plan  
Owner: Architecture Team  
Created: 2026-09-02  
Last Updated: 2026-09-02  
Depends On: RFC-0002, RFC-0015, RFC-0099, IMP-0031, IMP-0031B, TASK-0307, TASK-0315, TASK-0315B

## Objective

Connect the operational Configuration Provider to the abstract Data Layer through an explicit `IConfigurationPersistenceService` without persisting secrets or raw environment data.

## Authorized design

- Configuration Provider remains the synchronous operational source.
- Persistence is explicit and asynchronous; existing APIs remain compatible.
- The bridge depends only on `IPersistenceService` and public Configuration Provider capabilities.
- Hydrated values use precedence `defaults < persistence < environment < in-memory`.
- Current environment and in-memory values win unless `allowOverride` is explicitly requested; sensitive keys are never eligible.
- Storage uses namespace `configuration` and collection `configuration.entries`.

## Public allowlist

`app.name`, `app.version`, `environment`, `runtime.mode`, `debug.enabled`, `kernel.status.enabled`, `events.structural.enabled`, and `modules.snapshot.enabled`.

## Mandatory blocklist

Keys containing secret, token, password, credential, private, api key, connection string, database, database URL, db URL, auth secret, JWT, session, or cookie-secret terminology are rejected case-insensitively. The blocklist always overrides the allowlist.

## Public integration and snapshot

The implementation exposes `kernel.configurationPersistence()`, registers `kernel.configurationPersistence` in Service Registry and DI, and publishes aggregate-only Runtime and Kernel Status summaries. Snapshots contain no configuration values, persistence records, environment objects, secrets, stacks, repositories or provider internals.

## Tests, guardrails and non-goals

Tests cover persistence, load/list, explicit hydration, precedence, allowlist/blocklist, serialization, immutable snapshots and public integrations. Pure Node.js scans enforce infrastructure and platform guardrails.

Database adapters, ORM, SQL, migrations, filesystem storage, secrets management, API, Auth, permissions, Builder and publishing are outside scope. RFC-0008 remains Draft and RFC-0009 remains reserved.
