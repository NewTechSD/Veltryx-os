# RFC-0008 Runtime Abstraction & Platform Adapters

## Status

Draft

## Summary

Define a abstracao de runtimes e platform adapters do Veltryx OS para garantir que Builder, Site Schema, Component Registry e UI Composition Runtime permanecam agnosticos de framework, runtime e plataforma.

Veltryx OS e o Control Plane. Sites publicados pertencem ao Delivery Plane.

## Core Principles

- Builder is not Renderer.
- Builder is not Next.js.
- Site Schema is the universal contract.
- Component Registry defines contracts, not implementations.
- UI Composition Runtime produces universal composition models.
- Runtime Adapters translate schema/composition to target platforms.
- Published sites must not depend on continuous Admin availability.
- Managed sites use Veltryx OS as source of truth.

## Runtime Targets

- Veltryx Next Runtime.
- WordPress Runtime.
- Static Runtime.
- Future runtimes.

## Site Schema

Site Schema is the universal, versioned and serializable contract for pages, sections, components, slots, content references, layout hints, semantic intent, visibility rules and action bindings.

Site Schema must not contain concrete component implementations, executable callbacks, framework imports, platform-specific templates, DOM nodes, framework routes or implementation file paths.

## Component Registry

The central Component Registry stores component contracts only:

- key.
- version.
- name and label.
- description.
- propsSchema.
- slots.
- capabilities.
- constraints.
- metadata.
- tags.
- source.

Concrete implementation mapping belongs to Runtime Adapters.

## UI Composition Runtime

The UI Composition Runtime transforms public metadata or Site Schema into a Composition Tree. The output is an intermediate model and must remain independent of visual implementations and target platforms.

## Runtime Adapter Contract

A future implementation must define:

- validateCompatibility.
- preview.
- publish.
- deploy.
- rollback.
- supportedCapabilities.
- component implementation mapping.
- version compatibility.
- target platform.

## Runtime Capabilities

Future runtime capabilities may include preview, publish, rollback, static export, server rendering, client rendering, incremental build, media sync, forms, dynamic routes, SEO, theme tokens and custom code.

The Site Schema and Component Registry must not assume every runtime supports the same capabilities. Compatibility validation belongs to Runtime Adapters.

## WordPress Strategy

### Managed Mode

```text
Veltryx OS
    |
    v
Site Schema
    |
    v
WordPress Runtime Adapter
    |
    v
Plugin Veltryx
    |
    v
WordPress
```

In Managed Mode, Veltryx OS is the source of truth. Publish sends schema, build output or configuration to WordPress.

### Native Mode

Veltryx components may exist as Gutenberg Blocks in the future. This RFC does not define that implementation.

## Non Goals

- Implementar WordPress agora.
- Implementar plugin WordPress agora.
- Implementar Gutenberg agora.
- Implementar Next Runtime agora.
- Implementar sincronizacao bidirecional.
- Implementar Renderer visual nesta RFC.
- Implementar Publishing Pipeline completo.
- Implementar Builder visual.

## Acceptance Guardrail For TASK-0312

TASK-0312 can only be approved when Component Registry and UI Composition Runtime remain fully declarative, runtime-agnostic, platform-agnostic and free from concrete implementation mappings.
