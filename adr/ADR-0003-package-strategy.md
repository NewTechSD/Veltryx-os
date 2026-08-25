# ADR-0003: Package Strategy

Status: Approved  
Version: 1.0  
Type: ADR  
Owner: Architecture Team  
Reviewers: Architecture Review  
Created: 2026-08-03  
Last Updated: 2026-08-03  
Depends On: RFC-0001, RFC-0003, RFC-0004, RFC-0099  
Impacts: packages, modules, services, SDK, contracts  
Supersedes: None

## Contexto

O Veltryx OS precisa organizar contratos, SDKs, utilitarios e capacidades compartilhadas sem transformar `packages/` em uma camada sem ownership. RFC-0003 diferencia Package de Module: package e unidade de entrega; module e unidade arquitetural de capacidade.

Esta ADR registra uma decisao local de estrategia de packages. Ela nao altera RFCs e nao define implementacao concreta.

## Decisao

Packages devem ser usados para organizar contratos, SDKs, bibliotecas compartilhadas e utilitarios autorizados.

Regras:

- Package nao define dominio por si so.
- Package deve possuir owner claro.
- Package deve expor apenas contratos autorizados.
- Package nao deve criar dependencia circular.
- Package nao deve vazar internals de modulos.
- Package compartilhado deve ser pequeno, coeso e justificavel.
- Package publico deve respeitar versionamento e compatibilidade.
- Package interno nao deve ser consumido como API publica.

## Consequencias

- Reduz duplicacao entre apps, modules e SDKs.
- Preserva fronteiras arquiteturais quando combinado com ownership.
- Evita que bibliotecas compartilhadas se tornem deposito de regras sem contexto.
- Exige revisao de dependencia antes de promover contratos para packages compartilhados.

## Alternativas Consideradas

- Colocar toda logica compartilhada em packages globais: rejeitado por risco de acoplamento.
- Manter tudo dentro de modules: rejeitado quando contratos realmente precisam ser compartilhados.
- Definir packages apenas depois da implementacao: rejeitado por contrariar Contract First.

## Compatibilidade

Esta ADR e compativel com RFC-0001, RFC-0003, RFC-0004 e RFC-0099. Ela nao cria breaking change.

## Checklist

- [x] ADR esta coberto por RFC aprovada.
- [x] ADR nao altera contrato publico.
- [x] ADR nao altera fronteira arquitetural.
- [x] ADR nao contradiz RFC aprovada.
- [x] ADR nao cria dependencia circular.
- [x] Consequencias foram registradas.
- [x] Alternativas foram consideradas.

## Convencoes

- Packages devem seguir Dependency Graph.
- Packages publicos devem preservar contratos.
- Packages internos devem permanecer encapsulados.

