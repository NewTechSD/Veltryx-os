# Health & Diagnostics

## Objetivo

As rotas iniciais de saude, status e diagnostico do `apps/admin` permitem validar o Admin Shell em ambiente local, preview e producao sem criar API NestJS, banco, autenticacao, autorizacao ou regra de negocio.

A fonte oficial dos dados e o Kernel Public Status Snapshot exposto por `@veltryx/kernel` via `VeltryxKernel.status().snapshot()` e consumido pelo Kernel Status Adapter.

## Rotas

### `/health`

Implementada em `apps/admin/app/health/route.ts` como Route Handler do Next.js.

Resposta minima:

```json
{
  "status": "ok",
  "kernel": "ready",
  "timestamp": "2026-08-18T12:00:00.000Z"
}
```

Em falha controlada:

```json
{
  "status": "error",
  "kernel": "error",
  "timestamp": "2026-08-18T12:00:00.000Z"
}
```

A rota nao expoe diagnostics, warnings, errors, stack trace, variaveis de ambiente, caminhos internos, tokens ou segredos.

### `/status`

Implementada em `apps/admin/app/status/page.tsx` como pagina server-side.

Exibe:

- `kernelStatus`
- `bootStatus`
- `bootTimestamp`
- `environment`
- `servicesRegistered`
- `modulesDiscovered`
- `modulesResolved`
- `modulesLoaded`
- `moduleSystemStatus`
- `metadataRegistryStatus`
- `runtimeStatus`
- `warnings`
- `errors`

### `/diagnostics`

Implementada em `apps/admin/app/diagnostics/page.tsx` como pagina server-side.

Exibe:

- `appName` quando disponivel;
- `appVersion` quando disponivel;
- `environment`;
- `bootTimestamp`;
- `uptime` quando disponivel;
- `kernelStatus`;
- `bootStatus`;
- `moduleSystemStatus`;
- `metadataRegistryStatus`;
- `runtimeStatus`;
- `diagnostics`;
- `warnings`;
- `errors` controlados.

Dados ausentes sao marcados como `unavailable`.

## Segurança

As rotas seguem as regras:

- nao expor stack trace em producao;
- nao expor variaveis de ambiente sensiveis;
- nao expor caminhos internos do servidor;
- nao expor tokens ou segredos;
- nao expor dados de usuario;
- manter `/health` com payload minimo.

## Arquivos

- `apps/admin/app/health/route.ts`
- `apps/admin/app/status/page.tsx`
- `apps/admin/app/diagnostics/page.tsx`
- `apps/admin/lib/health-status.ts`
- `apps/admin/lib/diagnostics-status.ts`
- `apps/admin/components/status-summary.tsx`
- `apps/admin/components/diagnostics-panel.tsx`
- `apps/admin/components/diagnostics-entry.tsx`

## Limites

Esta implementacao nao cria REST externa completa, GraphQL, API NestJS, banco, Auth, JWT, Prometheus, OpenTelemetry, tracing, alertas, Runtime Renderer, Builder, CRUD ou modulos de negocio.

## Deploy Preview

As rotas /, /health, /status e /diagnostics fazem parte da validacao pos-deploy descrita em docs/DEPLOY-PREVIEW.md.

