# Component Registry

## Objetivo

> TASK-0315D adds explicit persistence and hydration of safe declarative definitions. The Registry remains the operational catalog and existing definitions win hydration conflicts.

O Component Registry e o catalogo estrutural de componentes declarativos do Kernel. Ele permite registrar, validar, listar e resolver componentes por chave e versao, sem renderizar interface e sem conhecer implementacoes concretas.

```text
Component Definition
        |
        v
Component Validator
        |
        v
Component Registry
        |
        v
Component Resolver
        |
        v
Component Registry Snapshot
```

## Component Registry nao e React Registry

O registry central armazena contratos. Ele nao armazena componente visual, factory, callback, arquivo de implementacao, template de plataforma ou mapping de runtime.

Mapeamentos concretos pertencem a Runtime Adapters futuros. O mesmo componentKey deve poder ser interpretado por diferentes delivery targets sem alterar o registry central.

## Component Key

A chave oficial segue o formato `namespace.componentName`, por exemplo:

```text
system.page
system.section
system.card
system.table
system.form
system.button
```

A key deve ser estavel, unica por versao, segura para snapshot e independente de classe concreta.

## Component Definition

A definicao publica contem:

- key.
- name.
- label.
- description.
- type.
- category.
- version.
- propsSchema.
- slots.
- capabilities.
- allowedChildren.
- tags.
- source.

## Component Types

Tipos suportados:

```text
layout
display
data
form
navigation
feedback
action
overlay
content
system
```

## Component Categories

Categorias suportadas:

```text
page
section
container
card
table
form
field
button
navigation
status
feedback
media
typography
layout
system
```

## Capabilities

Capabilities sao declarativas. Elas indicam intencao estrutural, nao execucao real:

```text
canRenderChildren
canReceiveActions
canBindData
canUseSlots
canDisplayStatus
canSubmitForm
canNavigate
canRenderCollection
canRenderField
```

## Props Schema

`propsSchema` declara props aceitas pelo componente. Tipos suportados:

```text
string
number
boolean
date
datetime
array
object
enum
icon
image
url
color
spacing
variant
unknown
```

Default values devem ser serializaveis e seguros. Funcoes, instancias, simbolos, valores sensiveis e objetos vinculados a plataforma sao rejeitados.

## Slots

Slots sao declaracoes estruturais, por exemplo:

```text
header
body
footer
actions
sidebar
content
empty
loading
error
```

Cada slot pode declarar `required`, `accepts` e `multiple`. A validacao ocorre sobre componentKey, nao sobre implementacao visual.

## System Components

A TASK-0312 registra componentes base declarativos:

```text
system.page
system.section
system.container
system.card
system.grid
system.stack
system.table
system.form
system.field
system.input
system.select
system.textarea
system.checkbox
system.button
system.badge
system.heading
system.text
system.emptyState
system.errorState
system.statusIndicator
system.navigation
system.menu
```

## Snapshot Publico

O snapshot publico expoe:

- status.
- generatedAt.
- componentsRegistered.
- componentsByType.
- componentsByCategory.
- components.
- warnings.
- errors.
- diagnostics.

Snapshots sao clonados defensivamente, congelados e serializaveis.

## Seguranca

O registry nao deve expor stacks, secrets, funcoes, instancias, factories, callbacks, paths de implementacao ou objetos especificos de plataforma.

## Runtime/Platform Agnosticism

Conforme ADR-0004 e RFC-0008 Draft, Component Registry permanece no Control Plane. Ele define contratos universais para que Runtime Adapters futuros possam mapear componentKey para implementacoes concretas no Delivery Plane.

## Limitacoes Conhecidas

- Nao existe adapter de runtime nesta entrega.
- Nao existe renderizacao visual nesta entrega.
- Validacao de compatibilidade por plataforma sera definida em RFC futura.
- Eventos especificos do Component Registry foram adiados para evitar acoplamento prematuro.

## Proximos Passos

- Formalizar Runtime Adapter Contract.
- Implementar Admin Runtime Adapter e Dynamic Screen Renderer em task futura.
- Evoluir Site Schema como contrato universal de paginas e sites.
## Composition snapshot validation

UI Composition Persistence validates every node and requested version through the public Component Registry before persisting or returning a snapshot. The Registry remains an operational declarative catalog and never stores renderer implementations.
