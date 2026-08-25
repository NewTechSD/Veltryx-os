# Dependency Resolver

## Objetivo

Documentar o contrato inicial do Dependency Resolver implementado na TASK-0203 / IMP-0010.

O Dependency Resolver analisa descriptors de modulos ja descobertos, constroi um grafo de dependencias, valida consistencia estrutural, detecta dependencias ausentes, identifica ciclos e calcula uma ordem deterministica de inicializacao.

O `ModuleDependencyResolutionResult` valido e a entrada autorizada para o Module Loader. Nenhum modulo e carregado, instalado, habilitado ou executado por esta etapa.

## Fluxo

```text
Module Catalog
  |
  v
Dependency Resolver
  |
  v
Dependency Graph
  |
  +--> Cycle Detector
  |
  +--> Topological Sort
  |
  v
Resolution Result
  |
  v
Resolution Report
```

## Componentes

- `KernelModuleDependencyResolver`: servico de resolucao sobre descriptors em memoria.
- `KernelModuleDependencyGraph`: representacao interna do grafo de modulos e dependencias.
- `KernelModuleCycleDetector`: detector de ciclos declarados no grafo.
- `KernelModuleTopologicalSorter`: ordenacao topologica deterministica para inicializacao futura.
- `ModuleDependencyResolutionResult`: resultado completo da resolucao.
- `ModuleDependencyResolutionReport`: resumo operacional da resolucao.

## Grafo

O grafo permite:

- adicionar modulos;
- adicionar dependencias entre modulos existentes;
- consultar dependencias diretas;
- consultar dependentes diretos;
- listar modulos de forma deterministica;
- apoiar deteccao de ciclos e ordenacao topologica.

## Resolucao

A resolucao considera apenas dependencias declaradas no manifesto em memoria.

Regras implementadas:

- dependencia obrigatoria ausente gera erro e bloqueia resolucao;
- dependencia opcional ausente gera aviso e nao bloqueia resolucao;
- ciclos bloqueiam resolucao;
- a ordem de inicializacao e calculada por ordenacao topologica quando nao ha erros bloqueantes;
- multiplos grafos independentes sao ordenados de forma deterministica por id;
- conflitos estruturais de descriptor bloqueiam resolucao.

## Compatibilidade estrutural

A validacao de compatibilidade e propositalmente estrutural:

- `compatibility` deve ser objeto;
- `compatibility.kernel`, `compatibility.runtime` e `compatibility.metadata`, quando informados, devem ser strings nao vazias.

Nao ha interpretacao semantica de intervalos de versao nesta implementacao.

## Resultado

O resultado da resolucao contem:

- `valid`: indica se a resolucao nao possui erros bloqueantes;
- `order`: ordem deterministica de inicializacao futura;
- `resolved`: mesmos descriptors resolvidos na ordem calculada;
- `missing`: dependencias ausentes;
- `conflicts`: conflitos estruturais;
- `cycles`: ciclos encontrados;
- `errors`: erros bloqueantes;
- `warnings`: avisos nao bloqueantes;
- `report`: resumo operacional.

## Fora do escopo

- Module Loader.
- Runtime.
- Metadata Engine.
- Event Bus.
- Service Registry.
- Filesystem.
- Persistencia.
- JSON.
- YAML.
- Enable, Disable, Install, Update ou Uninstall.
- Resolucao semantica de intervalos de versao.
## Eventos Estruturais

Esta etapa publica eventos estruturais internos por meio do Event Bus em memoria quando um IStructuralEventPublisher e fornecido. A publicacao e isolada e nao altera o resultado funcional da operacao. O catalogo esta em docs/KERNEL-STRUCTURAL-EVENTS.md.

`r`n## Snapshot Publico`r`n`r`nResultados de resolution podem ser consolidados pelo Module System Public Snapshot, incluindo modulos resolvidos, dependencias ausentes, conflitos e ciclos em formato publico seguro.`r`n
