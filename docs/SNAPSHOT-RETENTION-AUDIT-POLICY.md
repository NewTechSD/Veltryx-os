# Snapshot Retention + Audit Policy

IMP-0031F defines an explicit policy for derived UI Composition Snapshots. Metadata Registry, Component Registry and UI Composition Runtime remain authoritative; snapshots never become source of truth.

```text
UI Composition Persistence Service
              |
              v
Snapshot Retention + Audit Policy
              |
              v
IPersistenceService
              |
              v
In-memory Persistence Provider
```

## Scope and default policy

The policy covers only `ui-composition` snapshots. The frozen default is:

```text
maxSnapshotsPerSource: 20
preview: 10, cache: 5, diagnostic: 20, test: 10, audit: 50
protectLatest: true
dryRunDefault: false
```

Policy values are serializable and deeply frozen. Retention is never run during bootstrap, `compose` or ordinary `composeAndPersist`.

## Explicit pruning and latest consistency

`enforceRetentionForSource` evaluates a source deterministically by `persistedAt` and snapshot id, honors source/purpose/age limits, protects latest and supports dry-run. `enforceRetention` discovers known sources and aggregates source runs. Runs are stored in `composition.retention-runs`; audit metadata is stored in `composition.audit`.

Delete and prune repair `composition.latest`: the newest remaining snapshot becomes latest, or the pointer is removed when none remains. Missing or dangling latest pointers return `null` safely.

## Audit and checksum

Audit entries contain operation, result status, source identifiers, snapshot id, purpose, checksum, message, timestamp and warning/error/diagnostic counts. They never contain trees, nodes, props, records, providers, repositories, secrets, environment values or stacks.

SHA-256 is computed over canonical recursively sorted tree data. Persistence timestamps and record metadata are excluded. The checksum detects structural changes; it is not a signature or HMAC and uses no secret or environment variable. Loads verify the checksum and return a controlled integrity error on mismatch.

## Public status and limits

`kernel.snapshotRetentionAudit()` exposes aggregate counters only: audit entries, retention runs, checksums generated/verified and latest pointers repaired. Runtime and Kernel Status expose the same summary without entries or trees.

There is no durable audit store, scheduler, cron, worker, queue, background cleanup, publishing or Runtime Adapter. Audit and retention records use the in-memory provider and are process-local.
