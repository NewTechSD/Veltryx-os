# ADR-0004 Builder Runtime Agnosticism

## Status

Accepted

## Context

O Veltryx OS tera um Page Builder capaz de criar, editar, versionar e publicar sites. O primeiro runtime podera ser baseado em React/Next.js, mas a arquitetura deve permitir runtimes futuros, incluindo WordPress e Static Runtime.

Sem uma restricao explicita, Component Registry, UI Composition Runtime, Site Schema e Builder poderiam nascer acoplados a uma tecnologia de entrega especifica. Isso comprometeria o objetivo do Veltryx OS como Control Plane e tornaria o Delivery Plane dependente da plataforma administrativa.

## Decision

O Builder sera runtime-agnostic e platform-agnostic.

O Site Schema sera o contrato universal.

O Component Registry definira contratos de componentes, nao implementacoes visuais.

Runtimes especificos serao responsaveis por mapear componentes para implementacoes concretas.

Next.js sera tratado como runtime/adaptador, nao como parte estrutural do Builder.

WordPress sera preservado como requisito arquitetural futuro.

Veltryx OS e Control Plane. Sites publicados pertencem ao Delivery Plane e nao devem depender da disponibilidade continua do painel administrativo.

## Consequences

- O Builder nao pode depender de React, Next.js, JSX, DOM, PHP, WordPress ou Gutenberg.
- O Site Schema nao pode conter detalhes de implementacao visual.
- O Component Registry nao pode armazenar React components ou mappings de runtime.
- A UI Composition Tree deve ser universal.
- Runtime Adapters futuros poderao implementar Next, WordPress, Static ou outras plataformas.
- O Control Plane e o Delivery Plane devem permanecer separados.
- Para sites managed, o Veltryx OS sera source of truth.
- Validacao de compatibilidade por plataforma pertence a uma RFC futura de Runtime Adapter, nao ao Builder nem ao registry central.

## Guardrails

Component Registry, UI Composition Runtime e contratos publicos devem permanecer sem imports, tipos, callbacks, templates, paths ou instancias vinculadas a framework, DOM, PHP, WordPress ou Gutenberg.

A Composition Tree deve conter apenas componentKey, componentVersion, props, slots, children, bindings, actions, metadata estrutural e regras declarativas.
