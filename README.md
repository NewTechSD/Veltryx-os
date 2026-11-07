# Veltryx OS

Veltryx OS is a modular, metadata-driven enterprise platform.

This repository is governed by the architecture documents in `docs/`, `rfc/`, and `adr/`.

## Current Phase

Phase: OS-CORE-PHASE-01 — Platform Foundation Operational Consolidation.

Goal: connect explicit host manifest registration to the Kernel Module System,
Runtime snapshots and Admin observability, while keeping the default host
catalog empty and the platform free of business modules.

Technical readiness is review-ready, not production readiness. See
`docs/PLATFORM-FOUNDATION.md` and `docs/audits/OS-CORE-PHASE-01-REPORT.md`.

## Commands

- `pnpm install`
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm --filter @veltryx/admin build`
- `pnpm --filter @veltryx/admin start -- -p 3000`

## Deploy Preview

See `docs/DEPLOY-PREVIEW.md` for PM2, OpenLiteSpeed/CyberPanel, SSL, environment variables, and post-deploy validation.

## Governance

Implementation must follow:

- `AGENTS.md`
- `docs/IMPLEMENTATION-GUIDE.md`
- `docs/IMPLEMENTATION-CHECKLIST.md`
- `docs/DEPENDENCY-GRAPH.md`
- `rfc/RFC-0099-architecture-governance.md`
