# IMP-0029: Admin Composition Adapter + Dynamic Screen Renderer

Status: Approved  
Version: 1.0  
Type: Implementation Plan  
Owner: Architecture Team  
Reviewers: Architecture Review  
Created: 2026-09-01  
Last Updated: 2026-09-01  
Depends On: RFC-0007, RFC-0099, ADR-0004, TASK-0312  
Related To: RFC-0008 (Draft)  
Impacts: apps/admin, testes do Admin, docs/ADMIN-COMPOSITION-ADAPTER.md, docs/DYNAMIC-SCREEN-RENDERER.md  
Supersedes: None

## Objetivo

Autorizar a TASK-0313 a implementar, exclusivamente em `apps/admin`, uma ponte interna entre a Composition Tree universal e a interface React/Next.js do painel.

A entrega recebe o nome **Admin Composition Adapter + Dynamic Screen Renderer**. O termo `Runtime Adapter` fica reservado aos adapters de publicacao e delivery tratados pela RFC-0008.

## Autorizacao Arquitetural

Este IMP e autorizado por:

- RFC-0007 UI Composition System: Frozen;
- RFC-0099 Architecture Governance: Approved;
- ADR-0004 Builder Runtime Agnosticism: Accepted;
- TASK-0312 Component Registry + UI Composition Runtime: concluida como dependencia tecnica.

A RFC-0008 Runtime Abstraction & Platform Adapters permanece `Draft`, e e apenas relacionada a esta entrega. Sua aprovacao nao e dependencia da TASK-0313 porque o Admin Composition Adapter nao publica nem entrega sites e nao constitui um Runtime Adapter de plataforma.

## Escopo Autorizado para a TASK-0313

- Criar um Admin Composition Adapter em `apps/admin` que consuma somente APIs e snapshots publicos.
- Transformar uma Composition Tree universal em ViewModel seguro do Admin.
- Criar um Dynamic Screen Renderer interno do Admin.
- Manter o mapping `componentKey` para componente React exclusivamente em `apps/admin`.
- Criar componentes React/Next.js, rota dinamica, estados controlados e testes apenas no Admin.
- Criar documentacao tecnica da implementacao.
- Adicionar guardrails que comprovem o isolamento de Kernel, Contracts e Composition Tree.

## Fronteira Obrigatoria

Permitido em `apps/admin`:

- React;
- Next.js;
- JSX;
- mapping local de `componentKey` para componente React do Admin;
- renderizacao visual interna do painel.

Proibido em `packages/kernel` e `packages/contracts`:

- React, Next.js ou JSX;
- DOM, WordPress, PHP ou Gutenberg;
- renderer concreto;
- mapping de implementacao visual;
- paths ou factories de implementacao.

A Composition Tree deve permanecer universal, serializavel, declarativa e livre de elementos, nodes, callbacks ou tipos de frameworks visuais.

## Fora do Escopo

Este IMP nao implementa:

- Runtime Adapter de publicacao;
- Next Runtime Adapter;
- WordPress Runtime Adapter;
- Static Runtime Adapter;
- Publishing Pipeline;
- Preview, Publish ou Rollback de site;
- deploy target real;
- integracao com `veltryx.com.br`;
- Builder visual;
- banco, API, Auth, Permission Engine ou regra de negocio.

## Dependencias

- A Composition Tree publica da TASK-0312 deve ser consumida sem mutacao.
- O Admin deve usar somente contratos e snapshots publicos do Kernel.
- As rotas existentes do Admin devem ser preservadas.
- Nenhuma alteracao arquitetural em RFC congelada esta autorizada por este IMP.

## Plano de Implementacao

1. Definir o ViewModel local e o Admin Composition Adapter em `apps/admin`.
2. Consumir a Composition Tree por API publica e normalizar diagnostics sem expor internals.
3. Implementar o mapping local e o Dynamic Screen Renderer.
4. Implementar componentes visuais basicos, fallbacks e seguranca de props.
5. Criar rota server-side de demonstracao e link discreto no Admin.
6. Adicionar testes unitarios, de renderizacao, rota e guardrails arquiteturais.
7. Criar a documentacao tecnica do adapter e do renderer.
8. Executar lint, typecheck, testes, coverage e build.

## Testes Planejados

- Adapter: ViewModels `ready`, `empty`, `warning` e `error`, diagnostics seguros e consumo exclusivo de APIs publicas.
- Renderer: nodes, children, slots, props invalidas e componentes desconhecidos.
- Seguranca: nenhuma funcao/action executada, nenhum HTML bruto e nenhum `dangerouslySetInnerHTML`.
- Rotas: tela valida, fontes invalidas, preservacao do Admin Shell e navegacao existente.
- Guardrails: ausencia de React, Next.js e JSX no Kernel e Contracts; mapping concreto restrito ao Admin.
- Gates: `pnpm lint`, `pnpm typecheck`, `pnpm test`, coverage e `pnpm build`.

## Documentacao Planejada

- Criar `docs/ADMIN-COMPOSITION-ADAPTER.md`.
- Criar `docs/DYNAMIC-SCREEN-RENDERER.md`.
- Atualizar documentos tecnicos e roadmap apenas quando necessario e sem alterar RFCs congeladas.

## Riscos e Controles

- Confusao com Runtime Adapter de publicacao: mitigada pela nomenclatura Admin Composition Adapter.
- Vazamento de React/Next.js ao Core: mitigado por isolamento de arquivos e testes de guardrail.
- Execucao de metadata nao confiavel: mitigada por props permitidas, fallbacks e proibicao de funcoes e HTML bruto.
- Acoplamento a internals: mitigado pelo consumo exclusivo de APIs e snapshots publicos.

## Checklist de Aprovacao

- [x] RFC-0007 esta Frozen e autoriza a Composition Tree universal.
- [x] RFC-0099 esta Approved.
- [x] ADR-0004 esta Accepted.
- [x] TASK-0312 esta concluida como dependencia tecnica.
- [x] RFC-0008 foi classificada apenas como relacionada e permanece Draft.
- [x] Runtime Adapters de publicacao continuam bloqueados.
- [x] Contratos publicos devem ser preservados.
- [x] Dependency Graph deve ser respeitado.
- [x] Testes e documentacao foram planejados.
- [x] Architecture Review desta autorizacao foi registrada.

## Convencoes

- Este IMP implementa a superficie administrativa prevista pela RFC-0007 sob o guardrail da ADR-0004.
- Este IMP nao define nem autoriza arquitetura de publicacao/delivery.
- Este IMP nao altera a RFC-0008 nem antecipa suas decisoes pendentes.
- A TASK-0313 fica formalmente autorizada sob o nome **Admin Composition Adapter + Dynamic Screen Renderer**.
