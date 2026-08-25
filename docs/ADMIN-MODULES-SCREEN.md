# Admin Modules Screen

## Objetivo

A rota server-side `/modules` e a primeira tela funcional dedicada ao Module System no Admin do Veltryx OS. Ela transforma o snapshot público em uma visão somente de leitura, sem expor ou executar internals do Kernel.

## Fonte oficial dos dados

A única fonte da página é `getModuleSystemViewModel()`, definido no Admin Module System Adapter. A página não importa `@veltryx/kernel`, registries, discovery, resolver, loader, descriptors ou reports.

```text
/modules
    |
    v
getModuleSystemViewModel()
    |
    v
ModuleSystemViewModel
    |
    v
Summary / List / Diagnostics
```

Os componentes recebem exclusivamente view models e não recalculam informações de domínio.

## Componentes principais

- `ModuleSystemScreen`: coordena a apresentação dos estados públicos.
- `ModuleSystemSummary` e `ModuleSummaryCard`: exibem status, descrição, geração e contadores oficiais.
- `ModulesList` e `ModuleCard`: exibem identidade, lifecycle e contadores por módulo.
- `ModuleDependenciesList`: separa dependências obrigatórias e opcionais.
- `ModuleDiagnosticsList` e `ModuleDiagnosticItem`: exibem warnings, errors e diagnostics normalizados.
- `ModuleEmptyState`, `ModulePartialState` e `ModuleErrorState`: mantêm a página estável nos estados sem dados, parcial e de erro.

## Estados tratados

- `empty`: informa que nenhum módulo foi encontrado e não caracteriza falha.
- `partial`: informa disponibilidade parcial e deriva a disponibilidade visual apenas de `hasModules` e dos arrays públicos de warnings, errors e diagnostics.
- `error` ou `hasErrors`: mantém a página renderizável e destaca os erros normalizados.
- demais estados: exibem summary e módulos existentes conforme fornecidos pelo adapter.

Warnings usam destaque de atenção sem aparência de falha crítica. Errors usam destaque de falha. Diagnostics permanecem técnicos, limitados ao conteúdo já sanitizado pelo adapter. A tela não lê stack traces, paths, metadata ou reports internos e não inventa valores ausentes.

## Limitações conhecidas

A tela é somente leitura. Não possui busca, filtros avançados, paginação, edição, instalação, atualização, remoção, enable/disable ou resolução manual. O Admin também não cria API, autenticação, persistência, Runtime Renderer ou capacidades de negócio nesta entrega.

## Próximos passos futuros

Evoluções devem ser propostas por IMP/RFC compatível e continuar usando contratos públicos. Candidatos futuros incluem filtros e paginação de apresentação, detalhes de módulo e ações governadas, sem acoplamento aos internals do Kernel.
