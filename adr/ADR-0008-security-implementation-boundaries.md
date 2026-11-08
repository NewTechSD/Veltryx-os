# ADR-0008: Security Implementation Boundaries

Status: Draft  
Version: 0.1  
Type: ADR  
Owner: Architecture Team  
Reviewers: Architecture Review  
Depends On: RFC-0011, RFC-0019, RFC-0099  
Related To: RFC-0013, RFC-0018  
Supersedes: None

## Context

RFC-0011 deliberately leaves login, sessions, RBAC and tenant enforcement outside the AuthBridge. Phase 2 must add those capabilities while keeping Kernel transport-agnostic and preventing client-provided context from becoming authority.

## Decision proposal

Use a hybrid identity boundary: external IdP for ordinary human authentication, Veltryx-owned mapping/membership/session state, and a disabled-by-default local break-glass administrator path. Service principals use separate non-browser credentials. Place credential/session adapters at the Admin/API application boundary and keep Principal/AuthContext/Execution Context as the Kernel-facing representation. Place authorization evaluation in an application service/policy boundary invoked before protected operations. Place membership and scoped repository enforcement below that boundary, with default deny and explicit system-call handling.

Client-provided roles, permissions, user IDs, tenant IDs and workspace IDs are hints only and are never authority. Tenant switching creates a newly validated effective context. Cache keys include principal, tenant, workspace, policy version and revocation state. Cookie-authenticated writes require CSRF protection; login and recovery require rate limiting and enumeration-resistant responses.

RLS is deferred from the first slice but is a mandatory production gate: before production, implement and validate RLS with end-to-end isolation tests. If an alternative is required, it must be authorized by an approved RFC or RFC successor with security review, justification, compensating controls and measurable criteria. This ADR cannot create that exception. Shared-table application filtering alone is not sufficient evidence of production readiness, and release is blocked without approved RLS or a normatively authorized alternative.

The Admin is a consumer of authorization decisions and public snapshots, never the policy authority. Authentication, authorization, audit and persistence data use separate ownership and redaction rules.

## Consequences

This preserves Clean Architecture and allows external identity providers or local credentials without changing Kernel internals. It requires explicit adapters, policy tests, session revocation, CSRF controls and cross-tenant integration tests. It also makes unsafe direct repository access an architectural violation.

## Approval conditions

Approve only after RFC-0019 review, contract impact analysis, threat modeling and a first implementation specification are accepted. MFA remains a future extension point.
