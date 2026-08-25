# Admin Module System Adapter

## Objetivo

O Admin Module System Adapter e a fronteira de apresentacao do Admin para consumir o snapshot publico do Module System exposto pelo Kernel.

A fonte oficial dos dados e exclusivamente:

```ts
await kernel.modules().snapshot();
```

O adapter transforma esse snapshot em um ViewModel seguro para a futura tela `/modules`, sem acessar registries, loaders, resolvers, descriptors ou reports internos.

## Fluxo

```text
@veltryx/kernel

kernel.modules().snapshot()

Admin Module System Adapter

Module System ViewModel

Future /modules screen
```

## Snapshot publico vs ViewModel

O snapshot publico pertence ao Kernel e representa o estado oficial do Module System.

O ViewModel pertence ao Admin e prepara os mesmos dados para renderizacao visual futura, adicionando labels, flags e contagens derivadas apenas do snapshot recebido.

O Admin nao recalcula discovery, resolution ou loading. Ele tambem nao executa lifecycle.

## ViewModels

`ModuleSystemViewModel` expoe:

- `status`
- `statusLabel`
- `statusDescription`
- `generatedAt`
- `summary`
- `modules`
- `warnings`
- `errors`
- `diagnostics`
- `isEmpty`
- `hasWarnings`
- `hasErrors`
- `hasModules`

`ModuleCardViewModel` expoe dados de cada modulo publico, incluindo labels de estado/status e contadores de dependencias, warnings e errors.

`ModuleDependencyViewModel` expoe `moduleId`, obrigatoriedade, versao, status e motivo quando fornecido pelo Kernel.

`ModuleDiagnosticViewModel` normaliza warnings, errors e diagnostics para uso visual.

## Estados tratados

- `ready`: snapshot completo e modulos carregados.
- `partial`: snapshot disponivel, mas lifecycle parcial ou com issues.
- `empty`: nenhum modulo conhecido; nao e erro.
- `error`: falha controlada ao obter ou mapear o snapshot.
- `notBootstrapped`: estado reservado quando o Kernel ainda nao disponibilizou o snapshot.

## Warnings e errors

Warnings e errors preservam `code`, `message`, `source` e `detail` quando fornecidos pelo Kernel.

Falhas do adapter sao normalizadas com `ADMIN_MODULE_SYSTEM_SNAPSHOT_FAILED` e nao quebram o Admin.

## Seguranca

O adapter nao expoe stack trace em producao.

O adapter nao acessa caminhos internos, variaveis sensiveis, registries internos ou objetos mutaveis internos.

Arrays e objetos do ViewModel sao copias defensivas congeladas para evitar mutacao acidental.

## Limitacoes conhecidas

- Nao cria tela `/modules`.
- Nao cria componentes visuais finais.
- Nao instala, remove, habilita ou desabilita modulos.
- Nao cria API externa, banco, Auth, Runtime real, Builder ou regra de negocio.
- O conteudo depende exclusivamente do snapshot publico ja produzido pelo Kernel.

## Uso futuro

A tela `/modules`, documentada em `ADMIN-MODULES-SCREEN.md`, consome o `ModuleSystemViewModel` exposto por este adapter sem acessar detalhes internos do Kernel.
