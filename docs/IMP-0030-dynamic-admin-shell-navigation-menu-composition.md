# IMP-0030: Dynamic Admin Shell + Navigation/Menu Composition

Status: Approved  
Version: 1.0  
Type: Implementation Plan  
Owner: Architecture Team  
Reviewers: Architecture Review  
Created: 2026-09-01  
Last Updated: 2026-09-01  
Depends On: RFC-0005, RFC-0006, RFC-0007, RFC-0099, ADR-0004, IMP-0029, TASK-0313  
Related To: RFC-0008 (Draft)  
Impacts: apps/admin, testes do Admin, documentacao tecnica  
Supersedes: None

## Summary

Implementa a evolucao dinamica inicial do Admin Shell, permitindo que a navegacao principal do painel seja derivada de metadata de menu, Composition Tree universal e um ViewModel seguro renderizado exclusivamente por `apps/admin`.

## Authorized By

- RFC-0005 Metadata Engine;
- RFC-0006 Runtime Engine;
- RFC-0007 UI Composition System;
- RFC-0099 Architecture Governance;
- ADR-0004 Builder Runtime Agnosticism;
- IMP-0029 Admin Composition Adapter + Dynamic Screen Renderer.

## Scope

- Admin Navigation Adapter;
- Admin Navigation ViewModel e Admin Shell ViewModel;
- Navigation/Menu Composition demonstrativa;
- Sidebar/Menu renderizado em `apps/admin`;
- estado ativo derivado da rota atual;
- sanitizacao de labels, identificadores e links internos;
- fallbacks seguros para menu ausente, vazio, invalido ou indisponivel;
- testes, guardrails e documentacao.

## Non Goals

- Auth ou Permission Engine real;
- tenant, workspace ou regra de negocio;
- API, banco ou persistencia;
- CRUD ou editor visual de menus;
- Builder visual;
- publishing, preview, publish ou rollback;
- Runtime Adapter de publicacao;
- Next, WordPress ou Static Runtime Adapter;
- WordPress, PHP ou Gutenberg.

## Architectural Boundary

React, Next.js, JSX, componentes visuais e mapping de navegacao permanecem exclusivamente em `apps/admin`. `packages/kernel`, `packages/contracts`, Component Registry, UI Composition Runtime e Composition Tree permanecem universais e runtime-agnostic.

O Admin Navigation Adapter consome apenas APIs publicas, resolvers e snapshots. Ele nao acessa registries mutaveis, maps, providers, factories ou estado privado.

## Navigation Safety

- Somente caminhos internos iniciados por `/` podem ser habilitados.
- URLs externas e esquemas `javascript:`, `data:`, `mailto:` e `tel:` sao bloqueados.
- Metadata nao pode fornecer `className`, `style`, HTML bruto, funcoes ou actions executaveis.
- Falhas devem preservar o Admin Shell e produzir diagnosticos controlados sem stack trace.

## RFC-0008 Boundary

A RFC-0008 permanece Draft e nao e dependencia desta implementacao, pois o Admin Shell pertence ao Control Plane e nao publica nem entrega sites. Runtime Adapters de publicacao continuam bloqueados ate aprovacao da RFC-0008.

## Implementation Plan

1. Definir sanitizer, ViewModel e Admin Navigation Adapter em `apps/admin`.
2. Registrar e resolver metadata demonstrativa por APIs publicas.
3. Gerar Composition Tree de menu pelo UI Composition Runtime.
4. Converter a tree em grupos e itens imutaveis.
5. Integrar Sidebar e AppShell preservando as rotas atuais.
6. Adicionar fallbacks, testes de seguranca e guardrails.
7. Criar documentacao e executar todos os gates.

## Approval Checklist

- [x] RFC-0005, RFC-0006 e RFC-0007 autorizam metadata, runtime e composicao universal.
- [x] RFC-0099 esta Approved.
- [x] ADR-0004 esta Accepted.
- [x] IMP-0029 e TASK-0313 fornecem a fronteira tecnica anterior.
- [x] RFC-0008 permanece Draft e nao e dependencia.
- [x] Runtime Adapters de publicacao permanecem bloqueados.
- [x] Architecture Review desta autorizacao foi registrada.
