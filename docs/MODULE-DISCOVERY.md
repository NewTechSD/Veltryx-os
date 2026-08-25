# Module Discovery

## Objetivo

Documentar o contrato inicial de Module Discovery implementado na TASK-0202 / IMP-0009.

Module Discovery localiza candidatos fornecidos em memoria, valida manifestos, elimina invalidos, detecta duplicidades, cataloga modulos validos e produz resultado e relatorio de descoberta.

## Fluxo

```text
Discovery
  |
  v
Validator
  |
  v
Catalog
  |
  v
Report
```

## Componentes

- `KernelModuleDiscovery`: servico de descoberta sobre candidatos em memoria.
- `KernelModuleDiscoveryValidator`: valida manifesto e conflitos de identificacao para discovery.
- `KernelModuleCatalog`: catalogo in-memory de modulos descobertos validos.
- `KernelModuleDescriptor`: representacao interna de modulo descoberto.
- `ModuleDiscoveryResult`: resultado completo da descoberta.
- `ModuleDiscoveryReport`: resumo operacional da descoberta.

## Catalogo

O catalogo permite:

- registrar modulo;
- remover modulo;
- localizar modulo por id;
- listar modulos;
- verificar existencia;
- impedir duplicidade de id.

O catalogo nao resolve dependencias, nao ordena modulos e nao carrega capacidades.

O catalogo produzido pelo Discovery e a entrada autorizada para o Dependency Resolver. Essa integracao permanece em memoria e nao implica instalacao, carregamento ou execucao de lifecycle.

## Resultado

O resultado da descoberta contem:

- candidatos encontrados;
- descriptors validos;
- entradas invalidas;
- entradas ignoradas;
- entradas duplicadas;
- total encontrado;
- erros;
- relatorio.

## Validacao

Discovery valida somente aspectos estruturais e de catalogacao:

- manifesto deve ser valido pelo contrato oficial de Module Manifest;
- `id`, `name` e `version` devem existir como strings nao vazias;
- `compatibility` deve ser estruturalmente valida;
- manifesto vazio deve ser rejeitado;
- id duplicado no catalogo ou no lote descoberto deve ser rejeitado.

Discovery nao valida resolucao de dependencias, nao calcula compatibilidade semantica e nao executa metadata.

## Fora do escopo

- Module Loader.
- Dependency Resolver.
- Runtime.
- Metadata Engine.
- Service Registry.
- Event Bus.
- Lifecycle operacional.
- Enable, Disable, Install, Update ou Uninstall.
- Persistencia.
- Filesystem.
- JSON.
- YAML.
- Banco.
- API.
- CLI.
- Plugins.

## Eventos Estruturais

Esta etapa publica eventos estruturais internos por meio do Event Bus em memoria quando um IStructuralEventPublisher e fornecido. A publicacao e isolada e nao altera o resultado funcional da operacao. O catalogo esta em docs/KERNEL-STRUCTURAL-EVENTS.md.

`r`n## Snapshot Publico`r`n`r`nResultados de discovery podem ser consolidados pelo Module System Public Snapshot. Consumidores externos ao Kernel devem ler `kernel.modules().snapshot()` em vez de acessar reports internos diretamente.`r`n
