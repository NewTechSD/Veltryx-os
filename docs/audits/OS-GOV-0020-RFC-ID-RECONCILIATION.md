# OS-GOV-0020 — RFC Identifier Reconciliation

**Branch:** `feature/os-gov-phase-02-approval`  
**Result:** `APPROVED` for identifier reconciliation readiness  
**Normative status:** no RFC or ADR was promoted to `Approved`

## 1. Decision

The historical identifier is preserved:

| Identifier | Meaning                                              | Treatment                                                |
| ---------- | ---------------------------------------------------- | -------------------------------------------------------- |
| RFC-0018   | Deployment                                           | Reserved and preserved as a historical/planned reference |
| RFC-0020   | Durable Persistence, Transactions & Tenant Isolation | Assigned to the persistence proposal                     |

`RFC-0020` was available as a filename and was not used by an existing RFC, ADR or reserved architecture-index entry. The persistence file was renamed with `git mv` from `rfc/RFC-0018-durable-persistence-transactions-tenancy.md` to `rfc/RFC-0020-durable-persistence-transactions-tenancy.md`.

## 2. Audit evidence

The global contextual search found:

- `docs/DEPENDENCY-GRAPH.md:125` — `RFC-0018 Deployment` under the planned Deployment path.
- `docs/architecture-index.md:109,145` — Deployment is listed as `RFC-0018`, status Planned.
- `docs/IMPLEMENTATION-ROADMAP.md:106` — historical `IMP-0018 Queue` references `RFC-0018` in the Deployment dependency path.
- No `rfc/RFC-0018-deployment.md` exists in the checkout; the references remain historical/planned and are not silently rewritten.
- `rfc/RFC-0019-identity-sessions-authorization-rbac.md` now references RFC-0020 for database-level tenant defense.
- ADR-0006 and ADR-0007 now depend on RFC-0020.
- ADR-0008 now relates to RFC-0020.
- Phase 2 specifications, decision matrix, execution gate and audit reports now reference RFC-0020 for persistence.

The remaining occurrences of `RFC-0018` are intentional historical Deployment references or explicit reconciliation notes. No remaining Phase 2 persistence dependency points to RFC-0018.

## 3. Cross-reference updates

Updated:

- RFC title and filename.
- RFC-0019 related reference and tenant-defense reference.
- ADR-0006 `Depends On` and approval condition.
- ADR-0007 `Depends On`.
- ADR-0008 related reference.
- `OS-PHASE-02-TECHNICAL-SPEC.md` basis and approval sequence.
- `OS-PHASE-02-DECISION-MATRIX.md` dependency graph and checklist.
- `OS-DATA-0001-IMPLEMENTATION-SPEC.md` execution prerequisite.
- `OS-DATA-0001-EXECUTION-GATE.md` parent decisions and collision checklist.
- `OS-ARCH-PHASE-02-REVIEW.md` and `OS-ARCH-PHASE-02B-FINAL-REVIEW.md`.
- `OS-GOV-PHASE-02-APPROVAL-REVIEW.md`, which now records the collision as resolved and leaves formal approval to the authorized owner.

Preserved:

- `RFC-0018 Deployment` in the Dependency Graph and Architecture Index.
- The historical `IMP-0018` roadmap reference.
- All original technical decisions concerning PostgreSQL, Prisma, transactions, tenancy and RLS.

## 4. RFC-0099 compatibility

The reconciliation follows RFC-0099 because it:

- avoids silent reuse of an identifier;
- preserves historical traceability;
- separates identifier correction from architectural approval;
- updates dependent references consistently;
- leaves RFC-0020 in `Draft`;
- does not alter any approved RFC or ADR status;
- does not authorize implementation.

## 5. Collision result

The identifiers now have unique meanings in the active proposal set:

- RFC-0018: Deployment historical/planned reference.
- RFC-0019: Identity, Sessions, Authorization & RBAC.
- RFC-0020: Durable Persistence, Transactions & Tenant Isolation.

The persistence proposal is therefore eligible for the next formal `Draft → Review` decision. It is not yet `Approved`, and OS-DATA-0001 remains gated by the explicit approval conditions in `OS-DATA-0001-EXECUTION-GATE.md`.
