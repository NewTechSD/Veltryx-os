# RFC-0019: Identity, Sessions, Authorization & RBAC

Status: Draft  
Version: 0.1  
Type: Architectural RFC  
Owner: Architecture Team  
Reviewers: Architecture Review  
Depends On: RFC-0001, RFC-0002, RFC-0004, RFC-0006, RFC-0011, RFC-0013, RFC-0099  
Related To: RFC-0018, ADR-0008  
Supersedes: None

## 1. Summary

This proposal defines the security architecture that turns the existing transport-agnostic `Principal`, `AuthSession`, `AuthContext`, tenant/workspace context and Execution Context into authenticated and authorized server-side behavior.

It preserves RFC-0011’s boundary: the Kernel remains independent of HTTP frameworks, browsers, identity providers and credential libraries. Authentication adapters resolve an authenticated identity; application authorization evaluates policies; the Kernel consumes validated public context.

## 2. Problem and goals

The current AuthBridge deliberately supports anonymous/default and explicit system contexts only. It does not authenticate users, persist sessions, evaluate permissions or enforce tenant membership. Phase 2 requires these capabilities without treating client-provided identity or scope fields as authoritative.

Goals:

- model users, identities, memberships, roles, permissions, resources and actions;
- create revocable, expiring sessions;
- resolve authenticated identity into the existing Principal and Execution Context;
- enforce default-deny server-side authorization;
- make tenant/workspace scope part of authorization;
- audit authentication and authorization decisions without sensitive payloads;
- prepare MFA integration without implementing MFA in this proposal.

## 3. Initial identity strategy

The recommended initial strategy is hybrid: an external identity provider is authoritative for interactive human authentication, while Veltryx owns the local user mapping, tenant/workspace memberships, roles and session records. A tightly controlled local credential is reserved for a documented break-glass administrator path, disabled by default and subject to separate audit and rotation. Service principals use a non-browser credential path and are never represented as human browser sessions.

This preserves the option to change identity providers without making the IdP the owner of business tenancy. The external provider proves identity; Veltryx decides whether that identity exists, is active and has membership in the requested scope.

## 4. Identity model

The conceptual model is:

```text
User account
  -> Identity credential / external identity
  -> Session
  -> Principal
  -> Tenant membership
  -> Roles -> Permissions -> Resource/Action policy
```

User identity and organization membership are separate. A user may have multiple identities and belong to multiple tenants with different roles. Service principals and system principals are distinct from human users and require explicit non-browser authentication paths.

Credentials, when locally managed, are stored only as slow password hashes with a current algorithm/version and per-password salt. Plain passwords, reset tokens and session secrets are never logged or included in snapshots. The concrete algorithm and library remain an implementation ADR; the minimum policy is a current memory-hard password hashing scheme with a reviewed work factor and upgrade path.

## 5. Session model

Sessions are server-side records with opaque identifiers, principal, issue time, expiry, revocation state, credential/authentication strength, and audit correlation. Session lookup returns a safe AuthContext; it does not trust serialized roles or tenant values from the browser.

Browser sessions use cookies with `HttpOnly`, `Secure` in protected environments and an explicit `SameSite` policy. Session identifiers rotate after login and privilege changes. Logout and administrative revocation invalidate the server-side session. Idle and absolute expiry are separate policies.

Recovery flows use single-use, short-lived, hashed tokens and uniform responses that do not reveal account existence. MFA is a future authentication factor and must be represented as authentication strength, not implemented by this RFC.

CSRF protection is required for cookie-authenticated state-changing requests. Login and recovery endpoints require rate limiting, abuse telemetry, generic failure responses and bounded work.

## 6. Principal and Execution Context resolution

```text
Transport adapter
  -> validate session / credential proof
  -> resolve user and active membership
  -> create Principal + AuthSession + AuthContext
  -> create Execution Context with effective tenant/workspace
  -> authorize application operation
```

The adapter may accept a tenant/workspace request, but the server verifies that the authenticated principal has an active membership. Client-supplied `userId`, roles, permissions and tenant IDs are ignored as authority. Anonymous context remains valid only for explicitly public operations. System context is available only to explicit internal calls with a separate trust boundary.

The existing public shapes remain the compatibility target. If session assurance, membership claims or authorization decisions require new public fields, a versioned contract extension must be proposed separately.

## 7. Authorization and RBAC

The policy tuple is:

```text
principal + tenant + workspace + resource + action + subject/resource attributes
```

Roles aggregate permissions. Permissions identify a resource and action and may be constrained by platform, tenant or workspace scope. Membership connects a principal to a tenant and grants scoped roles. Platform-global roles are not equivalent to tenant-local roles.

Rules:

- default deny;
- server-side evaluation before the application operation;
- least privilege and explicit administrative scopes;
- no authorization based solely on UI visibility or metadata;
- revocation takes effect within a defined cache/session bound;
- policy decisions are auditable with decision, policy version, actor and scope;
- policy caches include principal, tenant, workspace, policy version and revocation state.

Resource owners define their protected resources and actions through approved contracts. A module cannot bypass the authorization boundary by accessing another module’s repository or internal service.

## 8. Tenant and workspace authorization

Tenant switching is an authorization operation. The server resolves a membership, verifies tenant status, establishes the effective tenant, then verifies workspace membership and status. A missing, suspended or ambiguous membership denies the operation.

Personal accounts and organization accounts must be represented by different ownership relationships. Platform operators may have a global role, but that role must be explicit, audited and unavailable to ordinary tenant roles.

## 9. Audit and privacy

Audit events cover login success/failure, logout, session revocation, recovery, membership change, role/permission change, tenant switch, authorization allow/deny for sensitive resources and administrative actions. Each event includes actor/principal, effective tenant/workspace, request/correlation IDs, resource/action, result, policy/version and timestamp where applicable.

Audit records exclude passwords, raw tokens, cookies, secrets and unnecessary personal data. Operational logs, audit trail and backups are separate stores with separate retention and access policies. Integrity protection and retention are specified with the recovery architecture, not inferred from application logs.

Database-level tenant defense is governed by RFC-0018. Application authorization and scoped repositories are mandatory in every environment, but they do not authorize production multi-tenant data by themselves. Production requires implemented and end-to-end-tested PostgreSQL RLS, or an alternative explicitly authorized by an approved RFC with security review and verifiable compensating controls. No ADR or operational exception may override that requirement.

## 10. Integration boundaries

```text
Browser / client
  -> Admin/API adapter
  -> session authentication
  -> Principal resolution
  -> membership validation
  -> RBAC decision
  -> Execution Context
  -> application service
  -> scoped repository
  -> durable adapter
```

The Kernel exposes contracts and safe snapshots only. Admin renders public read models and never decides authorization. Runtime/application services are responsible for invoking authorization before protected reads or writes.

## 11. Contract impact

Existing `Principal`, `AuthSession`, `AuthContext`, tenant/workspace and Execution Context contracts remain the foundation. New public contracts likely required for identity repositories, sessions, memberships, policy decisions and audit events must be versioned through a separate review before implementation. This RFC does not edit `packages/contracts`.

## 12. Alternatives

- External identity provider only: lowers password responsibility but requires membership synchronization and a stable federation boundary; it does not provide a local break-glass path.
- Local credentials only: simpler deployment control but higher credential, recovery and abuse-prevention responsibility.
- Hybrid federation plus local break-glass identity: selected for the first architecture slice; it provides operational recovery while keeping ordinary authentication external, at the cost of strict privileged-path controls.

MFA remains a future factor. The session model must retain authentication strength so MFA can be added without changing authorization semantics.

## 13. Candidate contract extensions

If implementation crosses package boundaries, prepare versioned proposals for `IIdentityProvider`, `ISessionStore`, `IMembershipRepository`, `IAuthorizationPolicyEvaluator`, `AuthorizationDecision` and security audit event contracts. These are candidate names, not approved interfaces. Existing `Principal`, `AuthSession`, `AuthContext` and Execution Context remain the compatibility foundation.

## 14. Acceptance criteria for approval

- Identity, session and membership authority is explicitly owned.
- Server-side default-deny authorization is testable.
- Tenant switching and cross-tenant denial are specified.
- Cookie, CSRF, abuse and recovery controls are reviewed.
- Public contract extensions, if any, are versioned and separately approved.
