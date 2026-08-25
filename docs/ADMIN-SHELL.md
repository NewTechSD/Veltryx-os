# Admin Shell

## Objetivo

O Admin Shell e a primeira interface visual do Veltryx OS em `apps/admin`. Ele fornece uma superficie administrativa inicial para visualizar o estado estrutural da plataforma consumindo o Kernel Public Status Snapshot server-side.

## Escopo implementado

- Layout base com sidebar, header e area principal de conteudo.
- Dashboard inicial conectado ao Kernel Status Adapter.
- Tela `/modules` conectada exclusivamente ao Admin Module System Adapter.
- Rotas operacionais iniciais: `/health`, `/status` e `/diagnostics`.
- Cards de status para Kernel, bootstrap, modulos descobertos, modulos resolvidos, modulos carregados, Service Registry, Metadata Registry, Runtime e Environment.
- Tratamento controlado para falhas de bootstrap do Kernel.
- Identidade visual inicial da Veltryx com foco operacional e responsivo.

## Fora do escopo

Este shell nao implementa autenticacao, autorizacao, banco, API, Prisma, Redis, Builder, CRUD, Runtime Renderer, Metadata dinamica ou modulos de negocio.

## Fonte de dados

Os dados exibidos sao produzidos pelo `@veltryx/kernel` por meio de `VeltryxKernel.status().snapshot()`.

`apps/admin/lib/kernel-status-adapter.ts` apenas executa o lifecycle server-side e consome o snapshot publico. `apps/admin/lib/kernel-status.ts` transforma esse snapshot em view model serializavel para os componentes React.

O Admin Shell nao deve inferir estado interno do Kernel quando o snapshot publico ja fornece a informacao.

As rotas `/health`, `/status` e `/diagnostics` tambem consomem esse mesmo snapshot publico por meio do adapter.

## Componentes

- `AppShell`: compoe sidebar, header e conteudo.
- `Sidebar`: navegacao visual inicial sem rotas funcionais adicionais.
- `Header`: estado resumido e origem dos dados.
- `KernelDashboard`: organiza resumo e grade de cards.
- `StatusCard`: apresenta cada superficie monitorada.

## Dados exibidos

- `kernelStatus`: estado consolidado retornado pelo Kernel.
- `bootStatus`: status publico do bootstrap.
- `modulesDiscovered`: metrica produzida pelo Kernel.
- `modulesResolved`: metrica produzida pelo Kernel.
- `modulesLoaded`: metrica produzida pelo Kernel.
- `servicesRegistered`: metrica produzida pelo Kernel.
- `moduleSystemStatus`: resumo publico do sistema de modulos.
- `metadataRegistryStatus`: status publico do registry de metadata.
- `runtimeStatus`: estado publico do Runtime.
- `environment`: ambiente reportado pelo snapshot.
- `bootTimestamp`: timestamp ISO mantido pelo Kernel.
- `errors`, `warnings` e `diagnostics`: entradas estruturadas do Kernel.

## Validacao

A entrega deve continuar passando em:

- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`

## Deploy Preview

O primeiro deploy preview do Admin Shell esta documentado em docs/DEPLOY-PREVIEW.md, com PM2, OpenLiteSpeed/CyberPanel, SSL e validacao das rotas operacionais.
