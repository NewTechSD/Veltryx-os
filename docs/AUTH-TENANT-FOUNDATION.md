# Auth + Tenant Foundation

The foundation defines identity and scope without implementing login. `Principal`, `AuthSession`, `TenantContext`, `WorkspaceContext` and `AuthContext` are public contracts. Anonymous/default/default is used for public reads; system/default/default is reserved for explicit internal operations.

```text
Request / Internal Operation
        |
        v
Auth Bridge -> Auth Context -> Execution Context -> Runtime / API / Modules
```

Execution Context accepts AuthContext while retaining legacy tenant, workspace, user, roles and permissions fields. Permissions remain empty until a future Permission Engine.
