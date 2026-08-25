# IMP-0002: Kernel Core Services

Status: Planned  
Version: 0.1  
Type: Implementation Plan  
Owner: Architecture Team  
Reviewers: Architecture Review  
Created: 2026-08-04  
Last Updated: 2026-08-04  
Depends On: IMP-0001, RFC-0001, RFC-0002, RFC-0004, RFC-0099  
Impacts: packages/contracts, packages/kernel, docs/KERNEL-BOOTSTRAP.md, docs/IMPLEMENTATION-ROADMAP.md  
Supersedes: None

## Objetivo

Transformar o bootstrap inicial em um Kernel extensivel, preparado para suportar modulos, runtime e metadata conforme definido nas RFCs.

Esta entrega representa a SPRINT-0002 Kernel Core Services.

Nenhuma funcionalidade de negocio deve ser implementada nesta sprint.

## RFCs Dependentes

- RFC-0001 Foundation: Frozen.
- RFC-0002 Platform Core: Frozen.
- RFC-0004 Service Registry & Dependency Injection: Frozen.
- RFC-0099 Architecture Governance: Approved.

## ADRs Relacionadas

- ADR-0001 Naming Convention.
- ADR-0002 Monorepo Strategy.
- ADR-0003 Package Strategy.

Nenhuma ADR nova e obrigatoria para iniciar este plano. Uma ADR deve ser criada se a implementacao escolher uma estrategia local relevante para DI, lifecycle in-memory ou estrutura interna de pacotes sem alterar contratos publicos.

## Escopo

- Revisar e consolidar contratos publicos em `@veltryx/contracts`.
- Garantir contratos minimos para:
  - Execution Context.
  - Configuration Provider.
  - Event Bus.
  - Service Registry.
  - Module Loader.
  - Metadata Registry.
  - Runtime bootstrap.
- Garantir que `@veltryx/kernel` implemente apenas os contratos publicos definidos.
- Registrar os core services minimos durante bootstrap quando aplicavel.
- Preservar resolucao por token e contrato, sem dependencias diretas de implementacoes concretas por consumidores externos.
- Validar unicidade de registro de services.
- Validar falha explicita para service ausente.
- Manter implementacoes in-memory como infraestrutura tecnica inicial, sem persistencia.
- Atualizar documentacao operacional da sprint.

## Fora do Escopo

- Auth real.
- Authorization engine.
- Tenancy avancada.
- Observability concreta com metricas, tracing ou backend externo.
- Persistencia em banco de dados.
- Cache externo.
- API HTTP.
- UI, Builder ou Application Model.
- Modulos de negocio.
- Plugin runtime.
- Container de DI completo.
- Overrides, lazy loading avancado ou descarte por scope alem do minimo necessario para contratos iniciais.

## Dependencias

- IMP-0001 Bootstrap deve existir e estar validada como base executavel.
- RFCs dependentes devem permanecer Frozen ou Approved.
- Dependency Graph deve continuar sem ciclos.
- Contratos publicos existentes nao podem ser removidos ou alterados de forma incompativel.

## Plano de Implementacao

1. Auditar contratos existentes em `packages/contracts/src`.
2. Comparar contratos com RFC-0001, RFC-0002 e RFC-0004.
3. Identificar lacunas compativeis sem criar arquitetura nova.
4. Ajustar contratos publicos somente quando a mudanca for extensiva e backward compatible.
5. Ajustar implementacoes in-memory do kernel para satisfazer os contratos.
6. Adicionar testes unitarios para registro, resolucao, conflito, token ausente e lifecycle minimo.
7. Adicionar testes para contexto, eventos, configuracao e integracao de bootstrap quando aplicavel.
8. Atualizar `docs/KERNEL-BOOTSTRAP.md` ou criar documentacao complementar da SPRINT-0002.
9. Executar validacoes oficiais.

## Testes

- Unit:
  - Service Registry registra provider por token.
  - Service Registry rejeita token duplicado.
  - Service Registry falha explicitamente em token ausente.
  - Service Registry reutiliza singleton global quando aplicavel.
  - Service Registry respeita transient criando resolucoes independentes.
  - Configuration Provider resolve valores por escopo suportado.
  - Event Bus publica eventos com contexto preservado.
- Integration:
  - Kernel bootstrap inicializa dependencias fundacionais.
  - Kernel ready publica evento operacional.
  - Runtime bootstrap permanece acessivel por contrato.
- Validation:
  - `pnpm build`.
  - `pnpm lint`.
  - `pnpm typecheck`.
  - `pnpm test`.
  - `pnpm --filter @veltryx/kernel-cli dev`.

## Documentacao

- Atualizar `docs/KERNEL-BOOTSTRAP.md` com o resultado da SPRINT-0002.
- Atualizar `docs/IMPLEMENTATION-ROADMAP.md` somente apos review para refletir mudanca de status.
- Registrar riscos residuais neste documento ou em checklist de release.

## Riscos

- Expandir contratos publicos cedo demais pode congelar superficie instavel.
- Implementar DI alem do minimo pode criar arquitetura nao aprovada pela RFC-0004.
- Misturar Auth, Authorization ou Tenancy real nesta sprint violaria o fora do escopo.
- Implementacoes in-memory podem ser confundidas com estrategia final de persistencia.
- Registrar services internos como publicos pode quebrar fronteiras do Platform Core.

## Checklist

- [x] RFC aprovada.
- [ ] IMP-0001 validada.
- [ ] Dependencias resolvidas.
- [x] ADRs necessarias identificadas.
- [x] Contratos publicos preservados.
- [x] Dependency Graph respeitado.
- [x] Testes planejados.
- [x] Documentacao planejada.
- [ ] Review planejado.

## Convencoes

- IMP implementa RFC.
- IMP nao define arquitetura nova.
- IMP nao altera RFC.
- IMP nao autoriza quebrar contratos publicos.
- SPRINT-0002 so pode iniciar implementacao apos este plano ser revisado e aprovado conforme RFC-0099.
