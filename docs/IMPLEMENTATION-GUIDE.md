# Implementation Guide do Veltryx OS

## Objetivo

Definir o guia oficial para implementacao do Veltryx OS.

Este documento deve ser usado por desenvolvedores, revisores e IAs durante toda a implementacao. Ele traduz a governanca arquitetural em regras praticas de trabalho sem criar nova arquitetura, alterar RFCs ou substituir especificacoes tecnicas futuras.

Toda implementacao deve seguir:

- Architecture Governance;
- Architecture Index;
- Dependency Graph;
- Implementation Roadmap;
- RFCs aprovadas;
- ADRs aplicaveis;
- Technical Specifications aprovadas quando existirem.

## Principios

### Clean Architecture

Implementacoes devem separar dominio, aplicacao, interfaces e infraestrutura. Regras de dominio nao devem depender de frameworks, banco de dados, transporte, cache, filas, UI ou detalhes externos.

Dependencias devem apontar para contratos e abstracoes estaveis.

### SOLID

Implementacoes devem respeitar:

- Single Responsibility: cada unidade deve possuir uma responsabilidade clara.
- Open/Closed: extensao deve ocorrer por contratos, providers, eventos, metadata, slots ou pontos de extensao aprovados.
- Liskov Substitution: substituicoes devem preservar contrato e comportamento esperado.
- Interface Segregation: consumidores devem depender apenas dos contratos necessarios.
- Dependency Inversion: consumidores devem depender de contratos, tokens e interfaces, nao de implementacoes concretas.

### DDD

Dominios de negocio devem ser modelados por linguagem ubliqua, fronteiras explicitas e regras de negocio isoladas de infraestrutura.

Modulos devem representar capacidades de negocio ou capacidades funcionais bem delimitadas. Entidades, servicos de dominio, comandos, queries e eventos devem preservar ownership claro.

### Metadata First

Sempre que uma capacidade puder ser descrita de forma segura por metadata, a implementacao deve priorizar metadata validada, versionada e auditavel.

Metadata nao deve ser tratada como configuracao informal.

### Contract First

Contratos publicos devem ser definidos antes de consumidores dependerem deles. Implementacoes devem satisfazer contratos aprovados, nao criar contratos implicitos.

Contratos incluem services, providers, metadata, events, components, modules, APIs conceituais, permissions e registries.

### Runtime First

Comportamento dinamico deve ser resolvido pelo Runtime a partir de metadata, services, components, permissions, modules e contexto.

Builder, Application e Modules nao devem assumir responsabilidades que pertencem ao Runtime.

## Fluxo Obrigatorio

```text
Problema
   |
   v
RFC
   |
   v
Review
   |
   v
Approved
   |
   v
Implementation
   |
   v
Tests
   |
   v
Documentation
   |
   v
Release
```

Nenhuma implementacao deve iniciar antes de existir RFC aprovada para o comportamento arquitetural correspondente.

## Regras

- Nunca alterar RFC durante uma implementacao sem processo de governanca.
- Nunca criar arquitetura nova dentro do codigo.
- Nunca quebrar contratos publicos aprovados.
- Nunca criar dependencias circulares.
- Nunca implementar sem RFC aprovada.
- Nunca consumir implementacao interna de outro modulo.
- Nunca acessar Core internals a partir de modulo ou plugin.
- Nunca fazer Runtime depender do Builder.
- Nunca fazer Builder instanciar componentes diretamente.
- Nunca fazer Metadata Engine depender de componente visual concreto.
- Nunca usar metadata visual como substituto de autorizacao.
- Nunca registrar service publico sem token, contrato, owner e compatibilidade.
- Nunca publicar evento publico sem contrato versionado.
- Nunca introduzir dependencia proibida pelo Dependency Graph.

## Antes de Implementar

Checklist obrigatorio:

- [ ] Existe RFC aprovada para a entrega.
- [ ] Existe IMP no Implementation Roadmap.
- [ ] Dependencias arquiteturais estao identificadas.
- [ ] Dependency Graph permite o fluxo proposto.
- [ ] Nao ha dependencia circular.
- [ ] Contratos publicos afetados estao identificados.
- [ ] Breaking changes foram descartados ou aprovados.
- [ ] ADRs necessarias foram identificadas.
- [ ] Escopo e nao objetivos estao claros.
- [ ] Plano de testes esta definido.
- [ ] Impacto em documentacao esta definido.
- [ ] Impacto em observabilidade foi considerado.
- [ ] Impacto em seguranca foi considerado.
- [ ] Impacto em tenancy foi considerado quando aplicavel.

## Antes de Criar Modulo

Checklist obrigatorio:

- [ ] O modulo possui RFC ou esta coberto por RFC aprovada.
- [ ] O modulo possui responsabilidade clara.
- [ ] O modulo nao pertence ao Platform Core.
- [ ] O modulo possui manifesto previsto.
- [ ] Dependencias obrigatorias e opcionais estao declaradas.
- [ ] Public Contracts estao definidos.
- [ ] Internal Contracts permanecem encapsulados.
- [ ] Permissoes e recursos protegidos estao previstos.
- [ ] Metadata, events, providers, components, migrations e seeds estao identificados quando aplicavel.
- [ ] Nao ha dependencia direta de storage interno de outro modulo.
- [ ] Nao ha dependencia circular obrigatoria.
- [ ] Habilitacao por tenant ou workspace foi considerada quando aplicavel.

## Antes de Criar Servico

Checklist obrigatorio:

- [ ] O servico possui responsabilidade unica.
- [ ] Existe token quando o servico for consumido por contrato.
- [ ] Existe owner.
- [ ] Escopo foi definido: Global, Tenant, Workspace, Request ou Transient.
- [ ] Visibilidade foi definida: Public Contract ou Internal Contract.
- [ ] Dependencias sao resolvidas por contratos, nao por classes concretas.
- [ ] Nao existe dependencia circular obrigatoria.
- [ ] Politica de override foi definida quando aplicavel.
- [ ] Inicializacao e descarte foram considerados.
- [ ] Observabilidade foi considerada.
- [ ] Permissao de consumo foi considerada.
- [ ] Dados sensiveis nao vazam entre scopes.

## Antes de Criar Componente

Checklist obrigatorio:

- [ ] O componente possui identificador estavel.
- [ ] O componente possui namespace.
- [ ] O contrato declara propriedades aceitas.
- [ ] O contrato declara eventos emitidos e consumidos.
- [ ] O contrato declara acoes permitidas.
- [ ] O contrato declara slots quando aplicavel.
- [ ] O contrato declara variantes quando aplicavel.
- [ ] O contrato declara compatibilidade e versao.
- [ ] O componente sera registrado no Component Registry.
- [ ] O Builder apenas referencia o componente por contrato.
- [ ] O Runtime resolve o componente pelo Registry.
- [ ] O componente nao contem regra de dominio.
- [ ] Permissoes e contexto foram considerados.

## Antes de Criar Metadata

Checklist obrigatorio:

- [ ] Metadata possui owner.
- [ ] Metadata possui namespace.
- [ ] Metadata possui versao.
- [ ] Metadata possui status apropriado.
- [ ] Metadata passa por validacao antes de registro.
- [ ] Resources e permissions foram declarados.
- [ ] Fields sensiveis foram classificados.
- [ ] Hidden e readonly nao sao usados como autorizacao.
- [ ] Overrides e extensions sao permitidos explicitamente.
- [ ] Dependencias entre namespaces usam contratos publicos.
- [ ] Metadata publicada pode ser resolvida pelo Runtime.
- [ ] Cache e invalidacao foram considerados quando aplicavel.
- [ ] Eventos de lifecycle foram considerados.

## Antes de Criar Runtime

Checklist obrigatorio:

- [ ] Runtime opera dentro de Runtime Context.
- [ ] Runtime Context deriva de Execution Context.
- [ ] Tenant, workspace, user, roles, locale, timezone, requestId e correlationId estao preservados.
- [ ] Runtime consome metadata resolvida, nao metadata bruta.
- [ ] Runtime consome services por tokens publicos.
- [ ] Runtime resolve componentes via Component Registry.
- [ ] Runtime aplica Permission Resolution antes de expor recursos.
- [ ] Runtime nao acessa implementacoes internas de modulos, plugins ou Core.
- [ ] Runtime nao depende do Builder.
- [ ] Runtime Cache nao e fonte de verdade.
- [ ] Falhas sao explicitas, observaveis e seguras.
- [ ] Eventos de Runtime foram considerados.

## Padroes

### Naming

Nomes devem ser estaveis, descritivos e consistentes com o glossario das RFCs.

Diretrizes:

- Usar nomes de dominio para conceitos de negocio.
- Usar nomes de contrato para interfaces publicas.
- Usar namespaces para evitar colisao entre modulos e plugins.
- Evitar abreviacoes obscuras.
- Evitar nomes baseados em tecnologia quando o conceito for arquitetural.

### Packages

Packages sao unidades de distribuicao ou organizacao tecnica. Eles nao devem definir fronteiras de dominio por si so.

Packages devem:

- respeitar ownership;
- expor apenas contratos autorizados;
- evitar dependencias circulares;
- manter internals encapsulados;
- seguir o Dependency Graph.

### Modules

Modules sao unidades independentes de capacidade.

Modules devem:

- possuir manifesto;
- declarar dependencies;
- declarar compatibility;
- declarar permissions;
- declarar public contracts;
- registrar metadata, providers, events e components por mecanismos aprovados;
- nao acessar internals de outros modulos.

### Interfaces

Interfaces publicas representam contratos suportados.

Interfaces devem:

- ser versionadas quando publicas;
- possuir owner;
- declarar escopo;
- preservar compatibilidade;
- evitar expor detalhes de infraestrutura.

### Events

Events representam fatos, nao comandos.

Events devem:

- possuir nome estavel;
- possuir contrato versionado quando publicos;
- preservar tenant, workspace, requestId e correlationId quando aplicavel;
- nao transportar dados sensiveis sem politica explicita;
- nao burlar autorizacao.

### Commands

Commands representam intencoes de mudanca.

Commands devem:

- validar permissao;
- operar dentro de contexto;
- declarar resource e action quando aplicavel;
- preservar auditoria;
- nao depender de UI ou transporte.

### Queries

Queries representam leitura.

Queries devem:

- respeitar tenant e workspace;
- respeitar permissao;
- nao alterar estado;
- nao vazar fields sensiveis;
- ser observaveis quando criticas.

### Services

Services representam capacidades consumiveis por contrato.

Services devem:

- possuir responsabilidade unica;
- ser resolvidos por token quando publicos;
- respeitar scope;
- nao acessar internals de outro owner;
- declarar dependencias;
- ser testaveis por contrato.

### Repositories

Repositories representam acesso abstrato a persistencia quando aplicavel.

Repositories devem:

- permanecer atras de contratos;
- nao definir regra de dominio;
- nao vazar detalhes fisicos de banco;
- respeitar tenancy;
- ser substituiveis.

### Providers

Providers associam tokens a services ou capacidades.

Providers devem:

- declarar token;
- declarar scope;
- declarar visibilidade;
- declarar compatibilidade;
- declarar ownership;
- declarar politica de override quando aplicavel.

## Estrutura do Monorepo

Organizacao esperada:

```text
docs/
rfc/
adr/
tasks/
apps/
packages/
modules/
scripts/
```

Responsabilidades:

- `docs/`: documentos oficiais, guias, roadmaps, indices e mapas arquiteturais.
- `rfc/`: RFCs arquiteturais e de governanca.
- `adr/`: Architecture Decision Records para decisoes locais.
- `tasks/`: planejamento operacional de entregas quando aplicavel.
- `apps/`: aplicacoes executaveis.
- `packages/`: bibliotecas compartilhadas, contratos, SDKs e utilitarios.
- `modules/`: modulos de negocio ou capacidades instalaveis.
- `scripts/`: automacoes auxiliares aprovadas.

Regras:

- Estrutura fisica nao substitui fronteira arquitetural.
- Dependencias entre pastas devem respeitar Dependency Graph.
- `modules/` nao deve depender de internals de outros modulos.
- `apps/` deve consumir contratos, nao implementar politica de dominio.
- `packages/` deve evitar virar deposito de regras sem ownership.

## Commits

Commits devem seguir Conventional Commits.

Tipos esperados:

- `feat`: nova capacidade implementada conforme RFC ou IMP.
- `fix`: correcao de comportamento existente.
- `docs`: alteracao documental.
- `test`: criacao ou ajuste de testes.
- `refactor`: melhoria interna sem mudanca de comportamento.
- `chore`: manutencao sem impacto funcional.
- `build`: ajustes de build quando aprovados.
- `ci`: ajustes de CI quando aprovados por documento futuro.

Regras:

- Commit nao deve misturar alteracao arquitetural e implementacao sem justificativa.
- Commit que altera contrato deve referenciar RFC, ADR ou IMP.
- Commit documental deve deixar claro se e editorial ou material.

## Pull Requests

Checklist obrigatorio:

- [ ] PR referencia RFC aprovada.
- [ ] PR referencia IMP aplicavel.
- [ ] PR referencia ADRs aplicaveis.
- [ ] Escopo esta limitado.
- [ ] Nao altera RFC sem processo de governanca.
- [ ] Nao cria arquitetura nova.
- [ ] Nao quebra contrato publico.
- [ ] Nao cria dependencia circular.
- [ ] Nao viola Dependency Graph.
- [ ] Testes foram incluidos ou justificativa foi registrada.
- [ ] Documentacao foi atualizada.
- [ ] Riscos foram declarados.
- [ ] Observabilidade foi considerada.
- [ ] Seguranca foi considerada.
- [ ] Tenancy foi considerada quando aplicavel.

## Code Review

Criterios minimos:

- A implementacao atende a RFC.
- A implementacao atende ao IMP.
- A implementacao nao contradiz Architecture Governance.
- A implementacao respeita Clean Architecture.
- A implementacao respeita SOLID.
- A implementacao preserva contratos publicos.
- A implementacao nao acessa internals indevidos.
- A implementacao nao cria dependencia circular.
- A implementacao possui testes proporcionais ao risco.
- A implementacao possui observabilidade suficiente.
- A implementacao trata erros de forma segura.
- A implementacao respeita tenant, workspace, user e permissions quando aplicavel.
- A documentacao foi atualizada.

Review deve priorizar corretude arquitetural, seguranca, compatibilidade, clareza e testabilidade.

## Testes

### Unit

Testes unitarios validam regras locais, contratos pequenos, validadores, resolvers, services e comportamento isolado.

Devem ser usados para proteger:

- regras de dominio;
- validacoes;
- resolucao de contratos;
- transformacoes deterministicas;
- edge cases.

### Integration

Testes de integracao validam colaboracao entre subsistemas por contratos publicos.

Devem ser usados para proteger:

- registries;
- module lifecycle;
- service resolution;
- metadata validation e resolution;
- runtime pipeline;
- permission resolution;
- event publication e consumption.

### E2E

Testes E2E validam fluxos completos de usuario ou operacao.

Devem ser usados para proteger:

- bootstrap da plataforma;
- fluxo Builder -> Metadata -> Runtime -> Application;
- instalacao e habilitacao de modulo;
- resolucao de UI;
- autorizacao ponta a ponta;
- isolamento de tenant quando aplicavel.

## Documentation

Documentacao deve ser atualizada quando a implementacao:

- materializar RFC;
- alterar comportamento publico;
- alterar contrato;
- adicionar capability;
- adicionar module, service, provider, metadata, event ou component;
- criar risco operacional;
- introduzir ADR.

Documentacao operacional nao deve contradizer RFCs.

## Definition of Done

Toda implementacao somente sera concluida quando:

- [ ] RFC atendida.
- [ ] IMP atendida.
- [ ] ADRs aplicaveis atendidas.
- [ ] Contratos publicos preservados.
- [ ] Dependency Graph respeitado.
- [ ] Testes unitarios executados quando aplicavel.
- [ ] Testes de integracao executados quando aplicavel.
- [ ] Testes E2E executados quando aplicavel.
- [ ] Documentacao atualizada.
- [ ] Code Review aprovado.
- [ ] Checklist do PR aprovado.
- [ ] Riscos residuais registrados.
- [ ] Nenhum bloqueio de seguranca conhecido.
- [ ] Nenhum bloqueio de compatibilidade conhecido.

## Criterio

Documento sem codigo.

Voltado para orientar toda a implementacao futura.

TASK-0317 adds the approved Auth/Tenant Foundation (RFC-0011): identity and scope contracts are transport-agnostic, with anonymous/default/default public fallback and explicit internal system context. Login, JWT, authorization and persistence remain future implementations.
