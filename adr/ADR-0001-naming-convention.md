# ADR-0001: Naming Convention

Status: Approved  
Version: 1.0  
Type: ADR  
Owner: Architecture Team  
Reviewers: Architecture Review  
Created: 2026-08-03  
Last Updated: 2026-08-03  
Depends On: RFC-0001, RFC-0099  
Impacts: RFCs, ADRs, IMPs, modules, services, events, metadata, components  
Supersedes: None

## Contexto

O Veltryx OS depende de contratos publicos, metadata, modulos, plugins, services, providers, events e components versionaveis. Nomes inconsistentes criam acoplamento acidental, dificultam descoberta e reduzem previsibilidade.

Esta ADR registra uma decisao local de convencao documental e operacional. Ela nao altera nenhuma RFC.

## Decisao

Nomes oficiais devem ser estaveis, descritivos e alinhados ao glossario das RFCs.

Convencoes:

- RFCs usam `RFC-0000-titulo-curto.md`.
- ADRs usam `ADR-0000-titulo-curto.md`.
- IMPs usam `IMP-0000 Titulo` em documentos de planejamento.
- Modulos usam identificadores estaveis em namespace proprio.
- Services publicos usam tokens estaveis.
- Events publicos usam nomes de fato ocorrido.
- Commands usam nomes de intencao.
- Queries usam nomes de leitura.
- Components usam identificadores estaveis e namespace.
- Metadata usa namespace, owner e versao.

## Consequencias

- Melhora previsibilidade entre documentos e implementacoes futuras.
- Reduz colisao entre modulos e plugins.
- Facilita busca, auditoria e revisao.
- Exige disciplina ao criar novos contratos.

## Alternativas Consideradas

- Permitir nomes livres por modulo: rejeitado por aumentar entropia.
- Definir nomes apenas durante implementacao: rejeitado por violar Contract First.

## Compatibilidade

Esta ADR e compativel com RFC-0001 e RFC-0099. Ela nao cria breaking change e nao altera contratos existentes.

## Checklist

- [x] ADR esta coberto por RFC aprovada.
- [x] ADR nao altera contrato publico.
- [x] ADR nao altera fronteira arquitetural.
- [x] ADR nao contradiz RFC aprovada.
- [x] ADR nao cria dependencia circular.
- [x] Consequencias foram registradas.
- [x] Alternativas foram consideradas.

## Convencoes

- ADR registra decisao local.
- ADR nao substitui RFC.
- ADR deve ser promovido para RFC quando afetar contrato publico, roadmap, seguranca, tenancy ou fronteira arquitetural.

