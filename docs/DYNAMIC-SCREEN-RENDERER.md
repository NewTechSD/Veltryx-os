# Dynamic Screen Renderer

Status: Implemented  
Scope: `apps/admin`  
Authorization: IMP-0029

## Objective and flow

The Dynamic Screen Renderer materializes the Admin Screen ViewModel as React components inside the Admin only.

```text
Composition Tree
        |
        v
Admin Component Mapping
        |
        v
React Components do Admin
        |
        v
Rendered Admin screen
```

The recursive node renderer resolves `componentKey` through a static local allowlist, renders children and named slots, and passes only normalized data props. The mapping is never stored in the Component Registry or Composition Tree.

## Supported components

- `system.page`, `system.section`, `system.container`, `system.card`
- `system.grid`, `system.stack`
- `system.heading`, `system.text`, `system.badge`, `system.button`
- `system.emptyState`, `system.errorState`, `system.statusIndicator`

Unknown keys render a safe `Unsupported component: <key>` block. Missing trees and adapter failures render controlled empty/error states without breaking `AppShell`.

## Props and action safety

Metadata is untrusted. Text is type-checked and length-limited, variants and numeric layout values use allowlists/ranges, arbitrary `className` and `style` are rejected, and only internal paths beginning with a single `/` can become links. External or malformed URLs result in a disabled button.

The renderer never uses `dangerouslySetInnerHTML`; strings are escaped by React. Functions are removed and never invoked. Composition action bindings are deliberately absent from the Admin ViewModel, so real actions, form submissions and business operations cannot execute.

## Composition Tree versus JSX

The Composition Tree is universal data containing identifiers, props and node relationships. JSX exists only in the Admin renderer as a concrete administrative presentation. No React element, React node, DOM node, callback, component factory or implementation path crosses into the tree.

## Route and limits

The server route is `/runtime/[sourceType]/[namespace]/[sourceId]`; the initial demonstration is `/runtime/page/system/admin-overview` and uses `force-dynamic`. This implementation is not a site preview, publishing renderer, visual Builder or platform Runtime Adapter. Future work may add more visual-only Admin components after an approved implementation plan, while universal publishing remains governed by RFC-0008.

The route now participates in the Dynamic Admin Shell from IMP-0030 and passes its server-known path for active navigation. Menu rendering remains a separate Admin navigation concern and does not contaminate the screen Composition Tree or component mapping.
