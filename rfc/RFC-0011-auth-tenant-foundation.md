# RFC-0011  Auth + Tenant Foundation

Status: Approved

This RFC defines transport-agnostic identity and scope contracts: Principal, Auth Session, Tenant Context, Workspace Context and Execution Context integration. Anonymous/default/default is the public fallback; System Principal is reserved for explicit internal operations.

The Auth Bridge does not implement login, passwords, JWT, OAuth, cookies, sessions, RBAC, Permission Engine, tenant enforcement or persistence. Kernel code remains independent of Next, React, HTTP frameworks and authentication libraries. API adapters may propagate only validated tenant/workspace hints.
