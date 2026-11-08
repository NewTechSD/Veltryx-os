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

Place credential/session adapters at the Admin/API application boundary and keep Principal/AuthContext/Execution Context as the Kernel-facing representation. Place authorization evaluation in an application service/policy boundary invoked before protected operations. Place membership and scoped repository enforcement below that boundary, with default deny and explicit system-call handling.

The Admin is a consumer of authorization decisions and public snapshots, never the policy authority. Authentication, authorization, audit and persistence data use separate ownership and redaction rules.

## Consequences

This preserves Clean Architecture and allows external identity providers or local credentials without changing Kernel internals. It requires explicit adapters, policy tests, session revocation, CSRF controls and cross-tenant integration tests. It also makes unsafe direct repository access an architectural violation.

## Approval conditions

Approve only after RFC-0019 review, contract impact analysis, threat modeling and a first implementation specification are accepted. MFA remains a future extension point.
