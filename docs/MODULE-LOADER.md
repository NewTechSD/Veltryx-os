# Module Loader

## Objetivo

Documentar o contrato inicial do Module Loader implementado na TASK-0204 / IMP-0011.

O Module Loader consome um `ModuleDependencyResolutionResult` valido, carrega os modulos em memoria como `LoadedModule`, registra esses modulos no `ModuleRegistry` e produz resultado e relatorio de carregamento.

Esta etapa nao executa modulos, nao chama providers, nao inicializa services, nao inicia Runtime e nao executa lifecycle operacional alem do estado `loaded`.

## Fluxo

```text
Dependency Resolver
  |
  v
Module Loader
  |
  v
Module Registry
  |
  v
Loading Report
```

## Componentes

- `KernelResolvedModuleLoader`: carregador oficial para resultados do Dependency Resolver.
- `KernelModuleRegistry`: registro in-memory de modulos carregados.
- `KernelLoadedModule`: representacao de modulo carregado em memoria.
- `KernelModuleStateValidator`: validador dos estados permitidos nesta fase.
- `ModuleLoadingResult`: resultado completo do carregamento.
- `ModuleLoadingReport`: resumo operacional do carregamento.

## Loaded Module

Um modulo carregado contem:

- descriptor original;
- manifesto;
- estado `loaded`;
- timestamp de carregamento;
- origem declarada no descriptor, quando existir.

Loaded Module nao representa inicializacao, execucao, habilitacao ou registro de providers.

## Module Registry

O registro permite:

- registrar modulo carregado;
- localizar modulo por id;
- listar modulos carregados;
- remover modulo do registro em memoria;
- verificar existencia;
- impedir duplicidade.

## Estados

Estados permitidos nesta fase:

```text
Discovered -> Validated -> Resolved -> Loaded
```

Transicoes fora dessa sequencia sao rejeitadas.

Estados fora desta fase, como `initialized`, `enabled`, `running`, `disabled`, `unloaded` e `uninstalled`, nao sao aceitos pelo loader desta implementacao.

## Resultado

O resultado de carregamento contem:

- `valid`: indica se nao houve erro de carregamento;
- `loaded`: modulos carregados;
- `ignored`: modulos ignorados;
- `rejected`: modulos rejeitados;
- `duplicated`: rejeicoes por duplicidade;
- `errors`: erros bloqueantes;
- `warnings`: avisos nao bloqueantes;
- `totalLoaded`: quantidade carregada;
- `report`: resumo operacional.

## Regras

- resolucao invalida bloqueia carregamento;
- descriptor sem `id`, `name` ou `version` validos e rejeitado;
- modulo ja carregado no registry e rejeitado e ignorado como duplicidade;
- a ordem do `ModuleDependencyResolutionResult.order` e preservada;
- o loader registra apenas objetos `LoadedModule` em memoria.

## Fora do escopo

- Runtime.
- Metadata Engine.
- Event Bus.
- Service Registry.
- Dependency Injection.
- Filesystem.
- Persistencia.
- Banco.
- JSON.
- YAML.
- Plugins.
- API.
- CLI.
- Enable, Disable, Install, Update ou Uninstall.
- Execucao de codigo de modulo.
- Chamada de providers.
- Inicializacao de services.
## Eventos Estruturais

Esta etapa publica eventos estruturais internos por meio do Event Bus em memoria quando um IStructuralEventPublisher e fornecido. A publicacao e isolada e nao altera o resultado funcional da operacao. O catalogo esta em docs/KERNEL-STRUCTURAL-EVENTS.md.

`r`n## Snapshot Publico`r`n`r`nResultados de loading podem ser consolidados pelo Module System Public Snapshot, incluindo modulos carregados, rejeitados, warnings e errors controlados.`r`n
