# Navigation/Menu Composition

Status: Implemented  
Scope: `apps/admin`  
Authorization: IMP-0030

## Objective and flow

Navigation/Menu Composition proves that Admin navigation can originate as declarative menu metadata rather than a React array embedded in the Sidebar.

```text
Metadata Menu
      |
      v
UI Composition Runtime
      |
      v
Composition Tree (system.menu)
      |
      v
Admin Navigation Adapter
      |
      v
Admin Navigation ViewModel
```

The controlled `system/admin-main` menu is registered through `metadata().registerMenu()`, resolved through `resolveMenu()` and composed with `uiComposition().compose({ sourceType: "menu" })`. The current runtime emits a `system.menu` root whose declarative `items` prop is normalized by the Admin adapter.

## ViewModel

The immutable ViewModel contains status, generation timestamp, normalized current path, groups, items, warnings, errors and diagnostics. Each item exposes only safe display data: `id`, `label`, internal `href`, `active`, `disabled`, optional badge and description. Composition actions, callbacks, arbitrary classes and styles are not propagated.

## Link sanitization and active state

Only paths beginning with a single `/` are accepted. Protocol-relative URLs, external HTTP(S), backslashes, control characters and the schemes `javascript:`, `data:`, `mailto:` and `tel:` are blocked. Blocked destinations become disabled presentation items without an anchor.

Query strings and fragments are removed for active-state comparison. `/` matches only the Dashboard; a non-root item matches its exact path or nested path segments.

## Fallbacks

- Missing metadata or adapter exception: `error` ViewModel without exception text or stack trace.
- Empty Composition Tree items: `empty` ViewModel.
- Runtime warnings/errors: normalized public issue records.
- Missing identity/label: item ignored with a safe warning.
- Invalid href: item retained as disabled with a safe warning.

## Architectural limits

The Composition Tree remains universal and contains no React, Next.js, JSX or DOM. The React mapping belongs only to the Admin shell. This work does not implement permission evaluation, menu CRUD, a Builder, delivery/publishing or Runtime Adapters. RFC-0008 remains Draft.
