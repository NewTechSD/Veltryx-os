# UI Composition Runtime

## Objetivo

O UI Composition Runtime transforma metadata publica em uma Composition Tree segura, validavel e serializavel. Ele nao renderiza interface, nao acessa DOM e nao conhece implementacoes concretas de componentes.

```text
Metadata Resource
        |
        v
UI Composition Runtime
        |
        v
Component Registry
        |
        v
Composition Tree
        |
        v
Renderer Futuro
```

## UI Composition nao e Renderer

A Composition Tree e um modelo intermediario universal. Ela descreve componentKey, props, slots, children, bindings, actions e regras declarativas. A entrega visual pertence a Runtime Adapters futuros.

## Composition Input

O input publico contem:

- sourceType: page, view, form, list, menu ou custom.
- sourceId.
- namespace opcional.
- metadata opcional.
- runtimeContext opcional.

Metadata ausente ou invalida gera erro controlado. Runtime Context ausente gera warning quando nao for critico.

## Composition Node

Um node contem:

- id.
- componentKey.
- componentVersion.
- props.
- bindings.
- children.
- slots.
- actions.
- visibility.
- diagnostics.

Nodes nao contem implementacoes visuais, callbacks, instancias, DOM, templates de plataforma ou paths de arquivo.

## Composition Tree

A tree contem:

- id.
- source.
- sourceType.
- root.
- generatedAt.
- warnings.
- errors.
- diagnostics.

A tree e o output principal da TASK-0312 e sera consumida por adapters futuros.

## Metadata Mapping

Mapeamentos iniciais:

- MetadataPage vira `system.page` com sections declarativas.
- MetadataForm vira `system.form` com `system.field` e actions declarativas.
- MetadataList vira `system.table` com columns em props.
- MetadataMenu vira `system.menu` com items serializaveis.
- MetadataView vira `system.container`.

O mapper consome somente objetos publicos de metadata recebidos pelo input.

## Component Registry Dependency

O runtime consulta Component Registry por contrato publico para validar componentKey e componentVersion. Ele nao acessa internals do registry e nao instancia componentes.

## Validation

A validacao cobre:

- tree id obrigatorio.
- root obrigatorio.
- node id obrigatorio.
- componentKey obrigatorio.
- componentKey existente no registry.
- propsSchema quando disponivel.
- allowedChildren.
- slots declarados e obrigatorios.
- ausencia de funcoes, instancias, secrets e objetos especificos de plataforma.

## Snapshot Publico

O snapshot publico expoe somente resumo leve:

- status.
- generatedAt.
- compositionsGenerated.
- lastCompositionAt.
- lastSourceType.
- lastSourceId.
- warnings.
- errors.
- diagnostics.

Composition Trees completas nao sao duplicadas no snapshot do runtime.

## Seguranca

Composition output deve permanecer serializavel, congelado e livre de implementacoes concretas. Dados sensiveis, stacks, callbacks, factories, paths de implementacao e objetos vinculados a plataforma sao rejeitados.

## Runtime/Platform Agnosticism

Conforme ADR-0004 e RFC-0008 Draft, UI Composition Runtime pertence ao Control Plane. Runtime Adapters futuros traduzirao a Composition Tree para targets como Veltryx Next Runtime, WordPress Runtime ou Static Runtime no Delivery Plane.

## Limitacoes Conhecidas

- Nao existe renderizacao visual nesta entrega.
- Nao existe Builder visual nesta entrega.
- Nao existe Runtime Adapter nesta entrega.
- Nao existe WordPress, Gutenberg, PHP, publish, deploy ou rollback nesta entrega.
- Eventos especificos de UI Composition foram adiados para evitar acoplamento circular ou prematuro.

## Proximos Passos

- TASK-0313 Admin Runtime Adapter + Dynamic Screen Renderer.
- RFC futura para Runtime Adapter Contract.
- Evolucao do Site Schema como contrato universal.
