# Metadata Engine

> TASK-0315B adds explicit persistence through `IMetadataPersistenceService`; existing synchronous Engine APIs remain unchanged. See `METADATA-PERSISTENCE-INTEGRATION.md`.

## Objetivo

O Metadata Engine e o subsistema estrutural do Kernel responsavel por declarar, validar, registrar, resolver e expor metadados publicos seguros. Ele prepara o caminho para Component Registry, UI Composition Runtime, Dynamic Screen Renderer, Builder Foundation e modulos de negocio.

Esta implementacao nao renderiza telas, nao acessa banco, nao executa regras de negocio e nao implementa Permission Engine real.

## Fronteiras

Metadata Engine:

- valida estrutura declarativa;
- registra namespaces e resources;
- resolve resources por namespace e id;
- produz snapshot publico;
- normaliza warnings, errors e diagnostics.

Runtime Renderer:

- futuro consumidor de metadata resolvida;
- transforma estruturas declarativas em experiencia executavel;
- nao foi implementado nesta task.

Builder:

- futuro produtor governado de metadata;
- nao publica comportamento ativo diretamente;
- nao foi implementado nesta task.

## Pipeline

```text
Metadata Definitions
        |
        v
Metadata Validator
        |
        v
Metadata Registry
        |
        v
Metadata Resolver
        |
        v
Metadata Snapshot
```

## Namespaces

Namespaces organizam ownership logico de metadata. Um namespace possui `id`, `name`, `description`, `source` e `version`. O id deve ser estavel, nao vazio e aparece no snapshot publico.

## Resources

Resources sao objetos enderecaveis por `namespace` e `id`. Tipos suportados estruturalmente:

```text
entity
field
relation
action
view
form
list
page
menu
permission
validation
setting
dashboard
```

## Entities

Entities declaram conceitos de dominio sem persistencia ou regra imperativa. A entidade suporta fields, relations, actions, views, forms, lists, permissions, tags, source e version.

## Fields

Tipos de field suportados:

```text
text
textarea
number
boolean
date
datetime
email
phone
url
select
multiselect
relation
json
currency
status
```

`required`, `readonly` e `hidden` sao declaracoes estruturais e nao substituem autorizacao.

## Relations

Tipos suportados:

```text
oneToOne
oneToMany
manyToOne
manyToMany
```

Relations declaram destino por `targetNamespace` e `targetEntity`. Nenhum join, ORM ou banco e executado.

## Actions

Tipos suportados:

```text
create
update
delete
archive
restore
export
import
send
approve
reject
custom
```

Actions sao apenas declarativas. `permission` e campo declarativo futuro, nao enforcement.

## Views, Forms e Lists

Views, forms e lists sao estruturas declarativas para consumidores futuros. Nenhum componente visual, formulario React, tabela ou submissao foi implementado.

## Pages e Menus

Pages declaram superfices futuras de UI. Menus declaram navegacao futura. O Admin Shell nao consome esses menus nesta task.

## Permission Declarations

Permission declarations registram `id`, `action`, `resource` e `description`. Elas nao aplicam RBAC, ABAC, guards ou bloqueio de UI.

## Validation

O validator rejeita:

- namespace vazio;
- resource sem id, namespace ou type valido;
- entity sem id, namespace, name ou fields array;
- fields duplicados;
- field type invalido;
- relation sem target ou type valido;
- action sem id ou type valido;
- page sem id ou namespace;
- menu sem id, namespace, label ou items array;
- funcoes, symbols, bigint, instancias nao planas e chaves sensiveis.

Warnings nao impedem snapshot. Errors deixam o snapshot em `error`.

## Resolver

O resolver consulta somente resources registrados. Ele suporta:

- `resolve(namespace, id)`;
- `resolveEntity(namespace, id)`;
- `resolvePage(namespace, id)`;
- `resolveMenu(namespace, id)`;
- `resolveByType(type, namespace?)`.

Ausentes retornam resultado controlado com `found: false` e erro normalizado.

## Snapshot Publico

O snapshot expoe status, data, contadores, resourcesByType, namespaces, resources, warnings, errors e diagnostics. Ele e clonado defensivamente e congelado, sem funcoes, factories, instancias, stacks ou secrets.

## Diagnostics

Diagnostics implementados:

```text
metadata.namespace.registered
metadata.resource.registered
metadata.entity.registered
metadata.page.registered
metadata.menu.registered
metadata.snapshot.generated
metadata.validation.warning
metadata.validation.error
```

A implementacao registra os codigos de registro e snapshot. Warnings/errors de validacao sao normalizados como diagnostics de severidade correspondente.

## Limitacoes Conhecidas

- Eventos de metadata no Event Bus foram adiados para evitar acoplamento prematuro.
- Overrides existem apenas como `registerResource(..., { override: true })` controlado; nao ha politica de precedencia multi-escopo.
- Versionamento efetivo, inheritance, extensions e cache ficam para RFCs/tasks futuras.
- Menus ainda nao integram com Sidebar/Admin Navigation.

## Proximos Passos

A proxima implementacao recomendada e TASK-0312 Component Registry + UI Composition Runtime, consumindo apenas os contratos publicos do Metadata Engine.
