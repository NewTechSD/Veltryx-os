# Tenant / Workspace Context

The temporary fallback tenant is `default` and the temporary workspace is `default` with `tenantId: default`. Workspace resolution always links to the resolved tenant. HTTP hints are bounded identifiers only; invalid values fall back safely.

There is no tenant/workspace persistence or enforcement in this phase. Real isolation, persistence and authorization are future tasks.
