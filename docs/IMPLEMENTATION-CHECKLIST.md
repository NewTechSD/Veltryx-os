# Implementation Checklist do Veltryx OS

## Objetivo

Definir o checklist oficial obrigatorio para implementacoes do Veltryx OS.

Este documento deve ser usado antes de implementar, durante a implementacao, antes do merge e antes do release.

## Antes de implementar

- [ ] RFC existe?
- [ ] RFC aprovada?
- [ ] IMP existe?
- [ ] Dependencias resolvidas?
- [ ] ADR necessaria?
- [ ] Contratos definidos?
- [ ] Dependency Graph permite o fluxo?
- [ ] Nao existe dependencia circular?
- [ ] Breaking changes foram descartados ou aprovados?
- [ ] Seguranca foi avaliada?
- [ ] Observabilidade foi avaliada?
- [ ] Tenancy foi avaliada quando aplicavel?

## Durante implementacao

- [ ] Nao criar arquitetura.
- [ ] Nao alterar RFC.
- [ ] Nao quebrar contratos.
- [ ] Nao criar dependencias circulares.
- [ ] Nao acessar internals indevidos.
- [ ] Nao usar metadata visual como autorizacao.
- [ ] Preservar contratos publicos.
- [ ] Atualizar documentacao.
- [ ] Registrar ADR quando necessario.
- [ ] Manter escopo limitado ao IMP.

## Antes do merge

- [ ] Testes executados.
- [ ] Lint executado.
- [ ] Typecheck executado.
- [ ] Documentacao atualizada.
- [ ] Review concluido.
- [ ] Checklist do PR aprovado.
- [ ] Riscos residuais registrados.
- [ ] Nenhum contrato publico foi quebrado.
- [ ] Nenhuma dependencia proibida foi introduzida.

## Antes do release

- [ ] Checklist aprovado.
- [ ] Versionamento definido.
- [ ] Changelog atualizado.
- [ ] Compatibilidade verificada.
- [ ] Migrations revisadas quando aplicavel.
- [ ] Rollback avaliado quando aplicavel.
- [ ] Observabilidade pronta.
- [ ] Seguranca revisada.
- [ ] Documentacao de release atualizada.

## Definition of Done

Uma implementacao somente pode ser considerada concluida quando:

- [ ] RFC atendida.
- [ ] IMP atendida.
- [ ] Testes aprovados.
- [ ] Documentacao atualizada.
- [ ] Review aprovado.
- [ ] Checklist aprovado.
- [ ] Contratos preservados.
- [ ] Riscos aceitos ou resolvidos.

