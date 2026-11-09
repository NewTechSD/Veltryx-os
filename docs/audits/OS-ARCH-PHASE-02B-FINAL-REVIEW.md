# OS-ARCH-PHASE-02B — Final Architecture Review & Decision Gate

**Branch:** `feature/os-arch-phase-02b`  
**Audited HEAD:** `28ac3bf`  
**Result:** `APPROVED_WITH_NOTES`

## 1. Executive result

The Phase 2 architecture package is specific enough to enter formal Architecture Review and to prepare OS-DATA-0001. It is not normative approval: RFC-0019, RFC-0020 and ADR-0006–0008 remain `Draft`, and implementation remains blocked until the responsible owner accepts the approval conditions.

The final recommendations are:

- PostgreSQL + Prisma Client in infrastructure, selected by the composition root.
- Prisma Migrate through a controlled deployment step with drift/checksum checks.
- Application-owned short Unit of Work, optimistic version locking and no implicit startup migration.
- Hybrid identity: external IdP for ordinary human authentication, Veltryx-owned mapping/membership/session state, and disabled-by-default local break-glass access.
- Server-side default-deny RBAC with platform, tenant and workspace scopes.
- Shared-table tenant baseline with mandatory scoped repositories; RLS deferred from the first slice but required and end-to-end tested before production. Any alternative requires an approved RFC or RFC successor.

## 2. Approval gate by document

| Document | Current state | Recommendation                                                    | Compatibility                                                    | Residual risk                                          | Blockers / conditions                                                      | Responsible owner                  |
| -------- | ------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------- | ---------------------------------- |
| RFC-0020 | Draft         | Keep Draft; move to Review after security/operations cross-review | Compatible with RFC-0015 if no public contract is silently added | Shared-table leakage before RLS or full negative suite | Decide provider, migrations, UoW and mandatory production RLS gate         | Architecture Team / Platform owner |
| RFC-0019 | Draft         | Keep Draft; move to Review after threat-model review              | Preserves RFC-0011 AuthContext/Principal boundary                | IdP outage, break-glass abuse, stale membership cache  | Approve hybrid identity, session controls and contract proposals           | Architecture Team / Security owner |
| ADR-0006 | Draft         | Recommend approval after RFC-0020 Review                          | Keeps database out of Kernel/Contracts                           | Prisma behavior or generated client escaping boundary  | Provider contract suite, pool/secret plan, reversibility plan              | Platform owner                     |
| ADR-0007 | Draft         | Recommend approval after migration/UoW test plan                  | Does not change current public repository contract               | Failed migration rollback and retry semantics          | Select Prisma Migrate, expand/contract, drift and restore policy           | Platform + Operations              |
| ADR-0008 | Draft         | Recommend approval after threat-model sign-off                    | Preserves RFC-0011 transport-agnostic context                    | Privileged path and cross-tenant enforcement           | Hybrid identity, server-side policy, mandatory RLS gate and audit controls | Security owner                     |

`APPROVED_WITH_NOTES` here means “ready for formal approval”, not “normatively approved”.

## 3. Architectural compatibility

- Kernel remains agnostic of PostgreSQL, Prisma, sessions, credentials and transport.
- Contracts remain the stable boundary; candidate additions are explicitly versioned proposals, not code changes.
- Runtime receives an authenticated/authorized Execution Context; it does not implement browser authentication.
- Admin renders public results and does not become the authorization authority.
- Modules own declared data through governed boundaries and cannot access another module’s internals.
- Persistence snapshots remain aggregate-only and sanitized.
- Metadata, `tenantId`, roles and permissions supplied by clients are never treated as authority.
- RFC-0011, RFC-0015 and RFC-0099 are not contradicted or reclassified.

## 4. Threat model

| Threat                        | Mitigation                                                                                            | Required negative test                                   | Residual risk                                                           |
| ----------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| User spoofing                 | External IdP proof, server-side session lookup, Principal resolution                                  | Forged user/role claims are ignored                      | IdP compromise remains external dependency                              |
| Tenant spoofing               | Active membership resolves effective tenant; client hint is non-authoritative                         | Request with another tenant ID is denied                 | Requires complete middleware/repository coverage                        |
| Privilege escalation          | Default-deny RBAC, scoped roles, policy version and audit                                             | User without action permission receives deny             | Policy model may be incomplete for new resources                        |
| Session fixation              | Rotate opaque session after login/privilege change                                                    | Old pre-login ID is invalid                              | Cookie deployment configuration must be verified                        |
| CSRF                          | CSRF token/origin policy for cookie-authenticated writes                                              | Cross-origin state change is denied                      | API clients may need separate token mode                                |
| Revoked session reuse         | Server-side revocation and bounded cache TTL                                                          | Revoked session cannot access protected route            | Cache invalidation latency must be measured                             |
| Cross-tenant data leak        | Scoped repositories, deny missing scope, `tenant_id`, negative tests; mandatory RLS before production | Read/update/delete another tenant’s ID is denied         | Development/homologation remain non-production until RLS E2E validation |
| Incorrect cache scope         | Cache key includes principal/tenant/workspace/policy version                                          | Same resource under two tenants never shares result      | Future caches may introduce new paths                                   |
| Migration failure/drift       | Controlled Prisma Migrate deploy, checksum/history/drift checks, expand/contract                      | Drift blocks deploy; failed migration does not start app | Restore/runbook quality must be proven                                  |
| Direct repository bypass      | Application service boundary and code review rule                                                     | Unauthenticated/direct adapter call is denied            | Internal misuse remains possible without enforcement tooling            |
| Secret leakage                | Secret manager, redaction, sanitized snapshots/errors                                                 | Logs and snapshots contain no credentials                | Misconfigured external observability remains possible                   |
| Global system privilege abuse | Explicit system principal, non-browser path, audit and allowlist                                      | Tenant user cannot invoke system operation               | Break-glass account requires operational monitoring                     |

## 5. Public contract impact

No code contracts were changed. The following are candidate future public contracts and require a separate versioned proposal before implementation if exposed across package boundaries:

- `IUnitOfWork` and transaction outcome/error types;
- scoped repository/effective scope contract;
- identity provider and session store ports;
- membership repository and authorization policy evaluator;
- authorization decision and security audit event contracts.

Until those proposals are approved, OS-DATA-0001 may use internal infrastructure seams only and must not make Prisma/client types visible.

## 6. First implementation gate: OS-DATA-0001

OS-DATA-0001 may start only after:

1. RFC-0020 and ADR-0006 are approved or explicitly authorized for implementation.
2. ADR-0007’s migration and transaction conditions are accepted.
3. The provider contract suite and isolated test database plan exist.
4. Pool, timeout, secret, health and redaction policies are documented.
5. No protected tenant data path is enabled without effective server-side scope.
6. RLS is implemented and end-to-end tested before production. If an alternative is proposed, an approved RFC or RFC successor must authorize it with security review, compensating controls and measurable criteria; an ADR or informal exception cannot waive the gate.

The executable specification is [OS-DATA-0001-IMPLEMENTATION-SPEC.md](../plans/OS-DATA-0001-IMPLEMENTATION-SPEC.md).

## 7. Files reviewed and changed

Reviewed: `AGENTS.md`, RFC-0099, RFC-0011, RFC-0015, RFC-0019, RFC-0020, ADR-0006–0008, Phase 2 plans/review, Dependency Graph, Implementation Guide, `packages/contracts`, `packages/kernel` persistence/auth/context/API surfaces, `apps/admin` adapters and relevant tests.

Changed or created in this task:

- RFC-0019 and RFC-0020 updated as Drafts;
- ADR-0006, ADR-0007, ADR-0008 updated as Drafts;
- `docs/plans/OS-PHASE-02-TECHNICAL-SPEC.md` updated;
- `docs/plans/OS-PHASE-02-DECISION-MATRIX.md` created;
- `docs/plans/OS-DATA-0001-IMPLEMENTATION-SPEC.md` created;
- this final review created.

No source code, public contract implementation, migration, schema, dependency or environment configuration was changed.

## 8. Validation

- Prettier check: passed for all updated and created Markdown files.
- `git diff --check`: passed.
- Typecheck, lint, test and build were not rerun because this task is documentation-only and does not modify production code.

## 9. Final decision

`APPROVED_WITH_NOTES`: the package is ready for formal Architecture Review and can authorize preparation of OS-DATA-0001 once the listed owners approve the relevant RFC/ADR conditions. It is not approval of the RFCs/ADRs themselves, not production readiness and not authorization to install PostgreSQL/Prisma.
