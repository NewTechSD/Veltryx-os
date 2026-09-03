# API v1 Endpoints

All endpoints are `GET`, return the standard API envelope and send `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`.

| Endpoint | Purpose |
|---|---|
| `/api/v1/health` | Public liveness and application identity |
| `/api/v1/status` | Sanitized Kernel status summary |
| `/api/v1/diagnostics` | Bounded diagnostics, warnings and errors |
| `/api/v1/runtime/status` | Sanitized Runtime status |
| `/api/v1/configuration` | Public configuration only |
| `/api/v1/metadata` | Metadata counts and safe diagnostics |
| `/api/v1/components` | Declarative component summaries only |
| `/api/v1/ui-composition` | Composition runtime summary, never a full tree |

Invalid pagination returns 400; unexpected failures return a sanitized 500. No endpoint performs persist, hydrate, prune, repair, publish or deploy operations.
