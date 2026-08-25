# Module System Public Snapshot

## Objetivo

O Module System Public Snapshot e a fronteira publica de leitura do Kernel para expor o estado atual dos modulos conhecidos pelo Module System.

A API oficial de consumo e:

```ts
await kernel.modules().snapshot();
```

Consumidores como Admin, diagnostics e futuras APIs internas devem usar esse read model em vez de acessar catalogos, registries, loaders, descriptors ou reports internos diretamente.

## Snapshot nao e comando

Gerar o snapshot nao executa discovery, resolution ou loading.

O snapshot apenas consolida o estado ja conhecido em memoria. Ele nao registra modulos, nao carrega modulos, nao altera estados, nao dispara lifecycle e nao inicializa Runtime.

```text
Module Discovery
    
Dependency Resolver
    
Module Loader
    
Module Registry
    
Module System Snapshot
    
Consumers
```

```text
Internal Module System
    
kernel.modules().snapshot()
    
Public Read Model
    
Admin / Future APIs / Diagnostics
```

## Campos principais

`ModuleSystemSnapshot` expoe:

- `status`
- `generatedAt`
- `modulesDiscovered`
- `modulesValid`
- `modulesInvalid`
- `modulesDuplicated`
- `modulesResolved`
- `modulesLoaded`
- `modulesRejected`
- `modules`
- `warnings`
- `errors`
- `diagnostics`
- `reports`

## Status possiveis

- `empty`: nenhum modulo conhecido; nao e erro.
- `partial`: ha modulos ou reports incompletos, warnings, errors, rejeicoes ou pipeline parcialmente executado.
- `ready`: modulos descobertos, resolvidos e carregados sem warnings/errors conhecidos.
- `error`: falha controlada ao gerar o snapshot.
- `notBootstrapped`: reservado no contrato para consumidores que precisem representar Kernel ainda nao inicializado.

## Module Public Snapshot

Cada modulo publico expoe apenas dados seguros:

- `id`
- `name`
- `version`
- `description`
- `state`
- `status`
- `discoveryStatus`
- `resolutionStatus`
- `loadingStatus`
- `dependencies`
- `optionalDependencies`
- `warnings`
- `errors`
- `metadata`

O snapshot nao retorna referencias mutaveis internas. Arrays e objetos publicados sao copias defensivas congeladas.

## Dependencias

Cada dependencia publica expoe:

- `moduleId`
- `required`
- `version`
- `status`
- `reason`

Status possiveis:

- `resolved`
- `missing`
- `optionalMissing`
- `incompatible`
- `unknown`

Nao ha resolucao semantica avancada de ranges nesta etapa.

## Warnings, Errors e Diagnostics

Warnings e errors sao estruturados com `code`, `message`, `source`, `moduleId` e `detail` opcional.

Diagnostics indicam disponibilidade de reports e resumo do registry publico. Stack trace nao faz parte do contrato publico.

## Casos empty e partial

Um snapshot sem modulos retorna `status: "empty"` e contadores zerados.

Um snapshot com modulos registrados, mas sem reports de discovery/resolution/loading, retorna `status: "partial"` e warnings explicitos de report indisponivel. Dados ausentes usam estados como `unknown` e `notLoaded`.

## Relacao com Kernel Status Snapshot

O Kernel Status Snapshot passa a consumir o resumo oficial do Module System Snapshot para os contadores de modulos descobertos, resolvidos e carregados. O status geral nao recalcula resolution nem inspeciona registries internos.

## Limites atuais

- O snapshot opera apenas em memoria.
- Nao instala, remove, habilita ou desabilita modulos.
- Nao cria tela `/modules`.
- Nao cria API externa, banco, Auth, Runtime real, Builder ou regra de negocio.
- Reports detalhados dependem do pipeline ja ter produzido esses dados.

## Uso futuro pelo Admin

A futura tela `/modules` deve consumir `kernel.modules().snapshot()` por um adapter de apresentacao. O Admin nao deve acessar registries, loaders ou reports internos.
