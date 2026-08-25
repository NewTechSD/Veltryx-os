# AGENTS.md

## Visao

O Veltryx OS e uma plataforma empresarial modular, orientada a metadados, projetada para gerar aplicacoes dinamicas por meio de contratos, Runtime Engine, Builder Visual e modulos independentes.

O objetivo da plataforma e funcionar como um sistema operacional empresarial extensivel, nao como um ERP monolitico.

## Filosofia

- Architecture First.
- Documentation First.
- Metadata First.
- Runtime First.
- Contract First.

## Fluxo

```text
RFC
 |
 v
Architecture Review
 |
 v
Approved
 |
 v
IMP
 |
 v
Tests
 |
 v
Release
```

## Regras

Nenhum agente pode:

- alterar RFCs aprovadas sem processo de governanca;
- criar arquitetura sem RFC;
- quebrar contratos publicos;
- criar dependencias circulares;
- implementar sem RFC aprovada;
- acessar internals de Core, Runtime, Module, Plugin ou Service sem contrato publico;
- substituir ADR por RFC quando a decisao for estrutural;
- tratar metadata visual como autorizacao;
- criar codigo de producao durante tarefas exclusivamente documentais.

## Regras especificas

### Codex

Codex atua principalmente em implementacao, manutencao, validacao, testes e edicao controlada de arquivos.

Codex deve:

- seguir RFCs aprovadas;
- seguir IMPs aprovadas;
- respeitar Dependency Graph;
- criar ou alterar codigo somente quando a tarefa autorizar;
- nao alterar arquitetura durante implementacao;
- reportar divergencias arquiteturais antes de implementar;
- preservar alteracoes existentes de outros autores.

### ChatGPT

ChatGPT atua principalmente em arquitetura, revisao, especificacao, governanca, planejamento e documentacao.

ChatGPT deve:

- priorizar RFC-0099;
- preservar consistencia entre RFCs;
- identificar riscos, ambiguidades e impactos;
- nao inventar implementacao quando a tarefa for arquitetural;
- recomendar ADR quando a decisao for local;
- recomendar RFC quando a decisao for estrutural.

### Outros agentes

Outros agentes devem seguir RFC-0099, Architecture Index, Dependency Graph, Implementation Guide e este documento.

Quando houver conflito, prevalece a ordem oficial definida no Architecture Index.

## Definition of Done

Implementacoes somente serao concluidas quando:

- RFC atendida;
- IMP atendida quando aplicavel;
- testes executados;
- documentacao atualizada;
- revisao concluida;
- checklist aprovado;
- contratos preservados;
- nenhuma dependencia proibida introduzida.

