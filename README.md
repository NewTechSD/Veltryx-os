# Veltryx OS

Veltryx OS is a modular, metadata-driven enterprise platform.

This repository is governed by the architecture documents in `docs/`, `rfc/`, and `adr/`.

## Current Phase

Sprint: SPRINT-0002B First Online Shell.

Goal: publish the initial Admin Shell preview with Kernel status, health, and diagnostics surfaces, without business rules or enterprise features.

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
