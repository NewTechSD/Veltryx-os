# Runtime API Bridge

`RuntimeApiBridge` is a transport-neutral read model over public Kernel APIs. It can be reused by a future adapter without importing Next, React, Express, Fastify, NestJS or HTTP types.

It provides health, Kernel/runtime status, diagnostics and safe summaries for configuration, metadata, components and UI composition. Responses are frozen and sanitized; composition trees, records, providers, repositories, secrets, environment values and stack traces are never returned.
