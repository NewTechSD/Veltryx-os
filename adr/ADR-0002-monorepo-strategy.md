# ADR-0002: Monorepo Strategy

Status: Approved  
Version: 1.0  
Type: ADR  
Owner: Architecture Team  
Reviewers: Architecture Review  
Created: 2026-08-03  
Last Updated: 2026-08-03  
Depends On: RFC-0001, RFC-0099  
Impacts: repository organization, documentation, future implementation planning  
Supersedes: None

## Contexto

RFC-0001 define uma organizacao prevista para o monorepo com `apps/`, `packages/`, `modules/`, `docs/`, `rfc/` e `scripts/`. O Architecture Index expande essa estrutura com `adr/` e `tasks/`.

Esta ADR registra a decisao local de usar monorepo como estrategia inicial de organizacao. Ela nao cria estrutura de implementacao nem altera a arquitetura aprovada.

## Decisao

O Veltryx OS adotara monorepo como estrategia inicial de organizacao documental e futura implementacao.

Organizacao esperada:

- `docs/`: documentos oficiais, indices, guias e roadmaps.
- `rfc/`: RFCs arquiteturais e de governanca.
- `adr/`: Architecture Decision Records.
- `tasks/`: planejamento operacional quando aplicavel.
- `apps/`: aplicacoes executaveis futuras.
- `packages/`: contratos, SDKs, bibliotecas e utilitarios futuros.
- `modules/`: modulos de negocio e capacidades instalaveis futuras.
- `scripts/`: automacoes auxiliares futuras.

## Consequencias

- Facilita governanca centralizada.
- Facilita revisao cruzada entre RFCs, ADRs e implementacoes.
- Permite evolucao coordenada de apps, packages e modules.
- Exige disciplina para evitar acoplamento indevido por proximidade fisica.

## Alternativas Consideradas

- Multirepo desde o inicio: rejeitado por aumentar custo de coordenacao na fase fundacional.
- Estrutura sem convencao formal: rejeitada por dificultar governanca.

## Compatibilidade

Esta ADR e compativel com RFC-0001, Architecture Index e RFC-0099. Ela nao altera a stack tecnologica e nao cria codigo.

## Checklist

- [x] ADR esta coberto por RFC aprovada.
- [x] ADR nao altera contrato publico.
- [x] ADR nao altera fronteira arquitetural.
- [x] ADR nao contradiz RFC aprovada.
- [x] ADR nao cria dependencia circular.
- [x] Consequencias foram registradas.
- [x] Alternativas foram consideradas.

## Convencoes

- Estrutura fisica nao substitui fronteira arquitetural.
- Dependencias entre pastas devem respeitar Dependency Graph.
- Monorepo nao autoriza acesso a internals entre modulos.

