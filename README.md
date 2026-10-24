# Veltryx OS

Plataforma empresarial modular orientada a metadados, contratos e Runtime.

## Estado atual

Baseline revisada em 2026-10-24: commit `936ddd41f251f4374500561f7d269865d0cb760e` da branch `main`.

Implementacao presente ate **IMP-0033 / TASK-0317 — Auth + Tenant Foundation**: Kernel, Module System, Service Registry/DI, metadata, composicao abstrata, Admin dinamico, persistencia em memoria e API estrutural read-only.

Auth Foundation fornece contratos e contexto; **login, autorizacao efetiva, isolamento de tenants e banco duravel ainda nao estao implementados**. O Admin e um preview tecnico sem dados reais de clientes. Builder visual, modulos de negocio e publicacao de sites tambem permanecem futuros.

## Por onde continuar

1. Ler o [estado e evidencias](docs/DEVELOPMENT-STATUS.md).
2. Consultar a [analise das lacunas e revisao](docs/DOCUMENTATION-REVIEW.md).
3. Seguir o [roadmap de continuidade](docs/IMPLEMENTATION-ROADMAP.md).
4. Revisar a [RFC-0010 Permission Engine](rfc/RFC-0010-permission-engine.md) e o [IMP-0034](docs/IMP-0034-permission-engine-foundation.md), propostos como proxima entrega.

Propostas Draft nao autorizam codigo. RFCs Approved/Frozen permanecem preservadas.

## Desenvolvimento local

Stack observada: TypeScript, pnpm/Turborepo, Next.js 15, React 19, Tailwind 3 e Vitest. A stack prevista na Foundation e mais ampla que a implementacao atual.

Usar pnpm `9.15.0`, conforme `packageManager`; registrar a versao de Node usada na validacao. Nao ha `engines` que fixe Node neste baseline.

```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @veltryx/admin dev
```

As variaveis de exemplo estao em [.env.example](.env.example). Elas nao configuram banco ou login. Nunca colocar secrets em `NEXT_PUBLIC_*`.

## Navegacao documental

- [Architecture Index](docs/architecture-index.md): status oficial de RFCs e documentos.
- [Dependency Graph](docs/DEPENDENCY-GRAPH.md): fronteiras e dependencias.
- [API Reference](docs/API-ENDPOINTS.md): rotas implementadas e limites.
- [Deploy Preview](docs/DEPLOY-PREVIEW.md): PM2 e verificacao operacional.
- [Governanca](rfc/RFC-0099-architecture-governance.md), [AGENTS](AGENTS.md), [Implementation Guide](docs/IMPLEMENTATION-GUIDE.md) e [Checklist](docs/IMPLEMENTATION-CHECKLIST.md).

Este repositorio nao contem o Finance Core mencionado em outros trabalhos. Uma integracao futura exige modulo e contratos proprios; RFC-0009 aqui e reservada ao Builder/Application Model.
