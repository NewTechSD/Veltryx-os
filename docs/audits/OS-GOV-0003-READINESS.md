# OS-GOV-0003 — Matriz de prontidão técnica

**Data:** 2026-10-31  
**Base:** OS-GOV-0002 + checkout atual  
**Critério:** prontidão significa evidência suficiente de contrato, implementação, integração e validação. Não equivale a “há arquivos”.

| Componente | Prontidão | Evidência | Justificativa |
|---|---|---|---|
| Public Contracts | Partially Ready | `packages/contracts/src/index.ts`; `packages/contracts/src/modules.ts`, `runtime.ts`, `services.ts` | Contratos públicos existem e são exportados, mas alguns fluxos consumidores ainda não estão integrados operacionalmente. |
| Execution Context | Ready | `packages/kernel/src/core/execution-context/*`; `packages/kernel/tests/execution-context.test.ts`; `docs/EXECUTION-CONTEXT.md` | Implementação, integração estrutural e testes existem. Gate de execução não foi confirmado por falta do toolchain. |
| Configuration Provider | Ready | `packages/kernel/src/core/configuration/*`; `kernel.ts:314-345`; `configuration-provider.test.ts` | Provider e persistence bridge estão registrados; execução não verificada. |
| Event Bus | Ready | `packages/kernel/src/core/events/*`; `event-bus.ts`; `event-bus.test.ts` | Implementação in-memory e eventos estruturais existem; execução não verificada. |
| Service Registry | Ready | `packages/kernel/src/core/services/*`; `service-registry-evolution.test.ts`; `kernel.ts:335-396` | Registro, resolução, snapshots e integração DI estão presentes. |
| Dependency Injection | Ready | `packages/kernel/src/core/di/*`; `dependency-injection.test.ts`; `kernel.ts:331-433` | Container e providers estruturais estão implementados. |
| Module Manifest | Ready | `packages/kernel/src/module-loader.ts:40-124`; `module-manifest.test.ts`; `docs/MODULE-MANIFEST.md` | Parser/validator existem e têm testes. Não há manifest Finance ou módulos reais no checkout. |
| Module Discovery | Partially Ready | `packages/kernel/src/module-system/discovery/*`; `module-discovery.test.ts`; `contracts/src/modules.ts:138-139` | Discovery especializado processa candidatos, mas o bootstrap padrão não fornece candidatos nem o chama. |
| Dependency Resolver | Partially Ready | `packages/kernel/src/module-system/resolver/*`; `module-dependency-resolver.test.ts` | Resolver especializado existe; facade padrão retorna a lista registrada sem grafo. |
| Module Loader | Partially Ready | `packages/kernel/src/module-system/loader/*`; `module-loader.test.ts` | Loader especializado carrega resolução, mas não está integrado ao bootstrap padrão e só suporta pipeline até `loaded`. |
| Module Registry | Partially Ready | `packages/kernel/src/module-system/loader/module-registry.ts`; loader tests | Registry existe, porém não há evidência de população pelo caminho default. |
| Runtime Bootstrap | Partially Ready | `packages/kernel/src/core/runtime/runtime-bootstrap-service.ts`; `kernel.ts:181-190,397-433`; tests | Bootstrap estrutural está integrado, mas recebe Module System sem candidatos no caminho padrão. |
| Metadata Registry/Engine | Ready | `packages/kernel/src/core/metadata/*`; metadata tests; `docs/METADATA-ENGINE.md` | Implementação e integrações declarativas existem. |
| Component Registry | Ready | `packages/kernel/src/core/components/*`; component tests; Kernel registration | Implementado e registrado; renderer concreto permanece fora do Kernel. |
| UI Composition Runtime | Ready | `packages/kernel/src/core/ui-composition/*`; UI tests; `docs/UI-COMPOSITION-RUNTIME.md` | Runtime declarativo e persistência in-memory existem; não é publishing renderer. |
| Persistence Layer | Ready | `packages/kernel/src/core/persistence/*`; persistence tests; `docs/PERSISTENCE-LAYER.md` | Provider in-memory e contratos existem; sem banco/migrations por decisão arquitetural. |
| Runtime API Bridge | Partially Ready | `packages/kernel/src/core/api/runtime-api-bridge.ts`; Admin `/api/v1/*`; API tests/docs | API read-only existe; validação automatizada bloqueada pelo ambiente. |
| Admin Shell | Partially Ready | `apps/admin/app/*`; Admin tests; `docs/ADMIN-SHELL.md` | Rotas e adapters existem; não há validação executada nem módulos reais carregados. |
| Admin Dynamic Composition | Partially Ready | `apps/admin/app/runtime/[sourceType]/[namespace]/[sourceId]/page.tsx`; guardrail tests/docs | Rota Admin existe; não é Runtime Adapter de publicação e os testes não foram executados. |
| Finance Core | Not Implemented | Ausência em `packages`, `apps`, `modules`; nenhum teste/manifest | Nenhuma evidência de domínio Finance no checkout. |
| Builder | Blocked | `rfc/RFC-0008-runtime-abstraction-platform-adapters.md` Draft; RFC-0009 ausente/reservada; `ADR-0004` | Arquitetura mantém Builder fora da implementação atual. |
| Hosting / Publishing | Blocked | `docs/DEPLOY-PREVIEW.md`; RFC-0008 Draft; ausência de adapters/hosting code | Há preparação documental, não uma implementação de Hosting/publicação. |
| TypeScript validation | Not Verified | `tsconfig.base.json`; scripts em `package.json` | Configuração existe, mas pnpm/dependências estão indisponíveis. |
| Lint | Not Verified | `package.json`; `eslint.config.mjs` | Não executado. |
| Unit/Integration tests | Not Verified | Testes presentes em Kernel/Admin | Não executados por bloqueio do toolchain. |
| Production build | Not Verified | scripts Turbo/Next/tsc | Não executado. |

## Leitura da matriz

- **Ready:** há contrato, implementação, integração prevista e cobertura documental/testes; a execução ainda depende do ambiente quando indicado.
- **Partially Ready:** parte concreta existe, mas falta integração, escopo operacional ou validação.
- **Blocked:** existe uma barreira de governança/arquitetura, não uma falha que deva ser contornada por código.
- **Not Implemented:** não há evidência de implementação no checkout.
- **Not Verified:** a configuração/testes existem, mas o gate não pôde rodar.

O Module System e o Runtime Bootstrap são **Partially Ready**, não Ready. Finance é **Not Implemented**. A plataforma não deve ser declarada pronta para produção.

