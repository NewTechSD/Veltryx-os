# Dynamic Admin Shell

Status: Implemented  
Scope: `apps/admin`  
Authorization: IMP-0030

## Objective

The Dynamic Admin Shell replaces the Sidebar's embedded navigation array with an immutable Admin Navigation ViewModel. Visual rendering remains a React concern inside `apps/admin`; menu structure comes from metadata and the universal UI Composition Runtime.

```text
Admin Navigation ViewModel
            |
            v
       Admin Shell
            |
            v
 Sidebar / Navigation
            |
            v
     Admin routes
```

Each server-side page passes its known `currentPath` to `AppShell`. The shell asks the Sidebar to render the navigation ViewModel, allowing deterministic active-state rendering without a client component or browser-side fetch.

## Relationship to composition

The Admin Navigation Adapter is a specialized administrative boundary alongside the Admin Composition Adapter. Both consume public metadata and universal Composition Trees, but navigation produces a shell ViewModel while the screen adapter produces dynamic page nodes.

This is not a visual Builder. There is no drag-and-drop, metadata editing, persistence, component authoring or publishing.

## Fallbacks and security

- Missing or failed menu: controlled `Navigation unavailable` state.
- Empty menu: controlled `Navigation is empty` state.
- Empty group: local non-breaking message.
- Invalid item identity: ignored with a warning.
- Invalid link: item remains visible but disabled and is not rendered as an anchor.

The shell renders no raw HTML, metadata class names or styles. It executes no metadata function or action. Active styling and all CSS classes are defined locally.

## Preserved routes

`/`, `/health`, `/status`, `/diagnostics`, `/modules` and `/runtime/page/system/admin-overview` remain available. The Health endpoint remains a server route and appears as a safe internal navigation destination.

## Current limits and next steps

The menu is process-local demonstration metadata and contains one navigation group. Auth, permission filtering, tenant/workspace scoping and persisted preferences remain out of scope and require their own approved architecture and implementation plans.
