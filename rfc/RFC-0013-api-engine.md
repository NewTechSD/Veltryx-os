# RFC-0013  API Layer + Runtime API Bridge

Status: Approved

## Decision

The initial API Layer is read-only and versioned as `/api/v1`. Contracts live in `packages/contracts`; the Kernel exposes a transport-agnostic Runtime API Bridge; the initial HTTP adapter lives in `apps/admin`.

The bridge consumes only public Kernel APIs and returns sanitized response/error envelopes. It does not know Next.js, React, HTTP server implementations, persistence records, secrets or environment contents.

Authentication, authorization, write APIs, CRUD, OpenAPI completeness, a dedicated `apps/api`, database infrastructure and publishing adapters are future work.

RFC-0008 remains Draft, RFC-0009 remains reserved for Builder / Application Model, and RFC-0015 remains the approved Data Layer.
