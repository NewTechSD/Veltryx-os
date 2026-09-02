# Admin Composition Adapter

Status: Implemented  
Scope: `apps/admin`  
Authorization: IMP-0029

## Objective

The Admin Composition Adapter is the internal, server-side boundary that converts public Kernel data and a universal Composition Tree into an immutable Admin Screen ViewModel. It proves administrative rendering without introducing React, Next.js or implementation paths into Kernel or Contracts.

```text
Kernel Public APIs
        |
        v
Admin Composition Adapter
        |
        v
Admin Screen ViewModel
        |
        v
Dynamic Screen Renderer
```

## Public sources

The adapter uses only `metadata()`, `components()`, `uiComposition()`, `runtime()` and `status()` public methods and their public resolvers/snapshots. It never reads mutable registries, maps, providers, factories or private classes. The controlled `system/admin-overview` demo is registered through `metadata().registerPage()`, resolved through `resolvePage()` and sent to `uiComposition().compose()`.

The output contains screen identity, status, generation timestamp, a recursively normalized tree, warnings, errors and diagnostics. Arrays, nodes, props and the resulting ViewModel are frozen. Functions and the reserved props `className`, `style` and `dangerouslySetInnerHTML` are discarded.

## Failure handling

Invalid source types, missing metadata and composition failures return controlled `error` ViewModels. Messages do not include exception text, stack traces or Kernel internals. The Admin shell remains available and links to Status and Diagnostics remain visible.

## Architectural boundary

This adapter is not a publishing or delivery Runtime Adapter. It renders only inside `apps/admin`; it does not publish sites, select deployment targets or implement Next/WordPress/Static adapters. ADR-0004 remains satisfied because the Composition Tree stays declarative and universal. RFC-0008 remains Draft and its publishing adapters remain blocked.

## Known limitations

- Demonstration metadata is in-memory and process-local.
- Only `page` has an Admin demonstration source in this iteration, although source types are validated against the universal contract.
- No API, database, authentication, permission evaluation, business rule or action execution exists.
- Snapshot values can be zero before a runtime lifecycle has been bootstrapped; this is an honest public state, not invented data.

## Admin Shell integration

IMP-0030 adds a sibling Admin Navigation Adapter for shell navigation. It follows the same public-API and immutable-ViewModel boundary, but consumes `system.menu` composition and does not alter the dynamic screen adapter. See [Dynamic Admin Shell](DYNAMIC-ADMIN-SHELL.md) and [Navigation/Menu Composition](NAVIGATION-MENU-COMPOSITION.md).
