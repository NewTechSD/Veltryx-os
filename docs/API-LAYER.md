# API Layer

The first API Layer is read-only and versioned at `/api/v1`. `packages/contracts` defines envelopes and request context, `packages/kernel` implements the transport-agnostic Runtime API Bridge, and `apps/admin` supplies the initial HTTP adapter.

Responses contain `ok`, `data` or `error`, `meta`, warnings and diagnostics. Inputs are bounded and sanitized. Public views expose operational summaries only; secrets, environment values, persistence records, internals and stacks are excluded.

Authentication, permissions, writes, CRUD, rate limiting, database access and publishing are intentionally deferred.

API requests may carry sanitized tenant/workspace hints and receive only a safe principal/session summary; no authentication is required yet.
