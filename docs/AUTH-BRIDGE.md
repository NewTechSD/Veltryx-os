# Auth Bridge

`AuthBridge` resolves anonymous or explicitly internal system contexts without transport dependencies. It sanitizes hints, creates immutable principals/sessions and default tenant/workspace contexts, and exposes only aggregate status counters.

It deliberately does not parse credentials, headers, cookies or JWTs and does not implement login, logout, password handling, RBAC or authorization.
