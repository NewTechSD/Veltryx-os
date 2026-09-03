# Configuration Persistence Integration

## Objective and authority

TASK-0315C is the second structural consumer of the Data Layer. It is authorized by RFC-0002, RFC-0015, RFC-0099 and IMP-0031C. The Configuration Provider remains the synchronous operational source; `ConfigurationPersistenceService` is an explicit asynchronous backing-store bridge using only `IPersistenceService`.

```text
Configuration Provider
        |
Configuration Persistence Service
        |
IPersistenceService
        |
In-memory Persistence Provider
```

## Storage and public API

Records use persistence namespace `configuration`, collection `configuration.entries`, and the configuration key as record id. `kernel.configurationPersistence()` exposes `persistConfiguration`, `persistKey`, `loadKey`, `listKeys`, `hydrateConfiguration`, and `snapshot`. Existing Configuration Provider methods remain compatible and synchronous.

## Allowlist and blocklist

The allowlist is derived from official keys: `app.name`, `app.version`, `environment`, `runtime.mode`, `debug.enabled`, `kernel.status.enabled`, `events.structural.enabled`, and `modules.snapshot.enabled`.

A case-insensitive blocklist rejects key names associated with secrets, tokens, passwords, credentials, private keys, API keys, connection data, databases, authentication secrets, JWTs, sessions, and cookie secrets. The blocklist always wins, even if an unsafe key is accidentally added to the allowlist.

## Explicit persistence, hydration and precedence

Persistence is never hidden inside a synchronous getter or provider operation. Hydration validates stored records, skips invalid or blocked entries with safe warnings, and never mutates the process environment.

Default precedence is:

```text
defaults < persistence < environment < in-memory
```

Therefore environment and in-memory values win conflicts. Passing `allowOverride: true` explicitly places persisted public overrides last. Sensitive keys remain blocked regardless of that flag.

## Snapshot and guardrails

The public snapshot contains only status, timestamp, provider id/kind, aggregate key counters, the public allowlist, blocked-attempt count, and sanitized diagnostics. It excludes configuration values, persistence records, environment objects, repositories, provider internals, maps, stacks and sensitive data.

Only serializable values are accepted. Functions, undefined, symbols, bigint, non-finite numbers, class instances, Date, Map, Set, Promise, Error, RegExp, circular references and platform element shapes are rejected.

## Limits and next steps

The in-memory backing store is not durable. There is no automatic write-through, secrets management, encryption, database, transaction, migration, distributed synchronization, API or configuration editor. A future approved task may introduce durable public configuration infrastructure behind the same contracts.

API v1 exposes only the public configuration allowlist; environment contents and secrets remain excluded.
