# Metadata Registry

> The Registry remains the operational index. Explicit hydration preserves existing entries on conflict and skips invalid stored entries with safe warnings.

## Objetivo

O Metadata Registry e o catalogo governado de metadata validada no Kernel. Ele armazena namespaces e resources estruturais, oferece resolucao publica e gera um read model seguro para Kernel, Runtime e consumidores futuros.

## Diagrama

```text
Namespace
   |
   v
Resource Definitions
   |
   v
Metadata Registry
   |
   v
Public Read Model
```

## Regras de Registro

- Todo resource deve possuir `namespace`, `id` e `type` valido.
- Namespaces podem ser registrados explicitamente ou criados de forma estrutural quando um resource valido e registrado.
- Entities, pages e menus sao registrados como resources tipados.
- O contrato legado `MetadataRecord` continua suportado por `register`, `get`, `list` e `listVersions`.

## Duplicidade

- Duplicidade de namespace e rejeitada.
- Duplicidade de resource no mesmo namespace e rejeitada por padrao.
- O mesmo id em namespaces diferentes e permitido.
- Override controlado existe por `MetadataRegistrationOptions.override` e e usado para compatibilidade do read model legado versionado.

## Resolucao

A resolucao ocorre por namespace e id:

```text
resolve(namespace, id)
resolveEntity(namespace, id)
resolvePage(namespace, id)
resolveMenu(namespace, id)
resolveByType(type, namespace?)
```

O resolver nao cria resources, nao carrega modulos e nao acessa banco.

## Snapshot

O snapshot contem:

- `status`;
- `generatedAt`;
- `namespacesRegistered`;
- `resourcesRegistered`;
- `entitiesRegistered`;
- `pagesRegistered`;
- `menusRegistered`;
- `resourcesByType`;
- `namespaces`;
- `resources`;
- `warnings`;
- `errors`;
- `diagnostics`.

## Seguranca

O registry clona e congela valores publicos. O validator rejeita funcoes, instancias nao planas e chaves sensiveis. Snapshot e diagnostics nao expõem stack trace, factories, closures ou secrets.

## Imutabilidade

Entradas registradas e resultados de leitura sao clonados defensivamente. Mutacoes externas em objetos originais ou retornados nao alteram o estado interno do registry.

## Integracao com Kernel Status

`KernelStatusSnapshot` consome apenas resumo oficial:

- `metadataRegistryStatus`;
- `metadataResourcesRegistered`;
- `metadataEntitiesRegistered`;
- `metadataPagesRegistered`.

O snapshot completo de Metadata nao e duplicado no Kernel Status.

## Integracao com Runtime

O Runtime Context recebe resumo leve de Metadata durante o bootstrap estrutural:

- status;
- namespaces registrados;
- resources registrados;
- entities registradas;
- pages registradas.

O Runtime nao executa metadata nesta task.

## Integracao Futura com Modulos

Metadados originados de modulos podem declarar `source: "module:<id>"`. O registry nao executa lifecycle de modulo e nao resolve dependencias de modulo.

## Limitacoes

- Sem persistencia.
- Sem cache fisico.
- Sem Permission Engine real.
- Sem Renderer, UI Composition ou Builder.
- Sem eventos publicos especificos de metadata nesta task.
