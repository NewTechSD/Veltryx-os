# RFC-0006: Runtime Engine do Veltryx OS

Status: Frozen  
Version: 1.0  
Type: RFC arquitetural  
Owner: Architecture Team  
Reviewers: Architecture Review  
Created: 2026-08-03  
Last Updated: 2026-08-03  
Depends On: RFC-0001, RFC-0002, RFC-0003, RFC-0004, RFC-0005  
Impacts: RFC-0007, RFC-0099  
Supersedes: None
## Indice

1. [Visao Geral](#1-visao-geral)
2. [Objetivos](#2-objetivos)
3. [Nao Objetivos](#3-nao-objetivos)
4. [Conceitos](#4-conceitos)
5. [Arquitetura Geral](#5-arquitetura-geral)
6. [Runtime Bootstrap](#6-runtime-bootstrap)
7. [Runtime Lifecycle](#7-runtime-lifecycle)
8. [Runtime Pipeline](#8-runtime-pipeline)
9. [Runtime Context](#9-runtime-context)
10. [Metadata Resolution](#10-metadata-resolution)
11. [Component Resolution](#11-component-resolution)
12. [Service Resolution](#12-service-resolution)
13. [Permission Resolution](#13-permission-resolution)
14. [API Resolution](#14-api-resolution)
15. [Menu Resolution](#15-menu-resolution)
16. [Layout Resolution](#16-layout-resolution)
17. [Runtime Cache](#17-runtime-cache)
18. [Runtime Events](#18-runtime-events)
19. [Runtime Extensions](#19-runtime-extensions)
20. [Seguranca](#20-seguranca)
21. [Observabilidade](#21-observabilidade)
22. [Performance](#22-performance)
23. [Diagramas](#23-diagramas)
24. [Glossario](#24-glossario)
25. [Decisoes Arquiteturais](#25-decisoes-arquiteturais)
26. [Riscos](#26-riscos)
27. [Duvidas](#27-duvidas)
28. [RFCs Dependentes](#28-rfcs-dependentes)

## 1. Visao Geral

Runtime Engine e o subsistema responsavel por transformar metadata validada e resolvida em comportamento executavel pelo Veltryx OS. Ele interpreta contratos declarativos, aplica contexto operacional, resolve services, componentes, permissoes, menus, APIs, layouts, plugins e overrides, e entrega uma representacao executavel para a Application.

O Runtime nao e o Builder, nao e a Metadata Engine, nao e o Module Loader e nao e um framework de UI ou backend. Ele atua como orquestrador de execucao declarativa. Sua funcao e consumir contratos publicos do Platform Core e dos modulos para produzir comportamento dinamico, sem conhecer implementacoes internas.

O Runtime deve operar sempre dentro de um Runtime Context derivado do Execution Context definido na RFC-0001. Toda decisao de execucao deve respeitar tenant, workspace, usuario, papeis, permissoes, locale, timezone, requestId e correlationId.

## 2. Objetivos

Os objetivos desta RFC sao:

- definir o Runtime Engine e suas responsabilidades;
- definir o que nao pertence ao Runtime;
- especificar bootstrap e lifecycle do Runtime;
- definir o pipeline de execucao;
- definir Runtime Context, Runtime Session, Runtime State e Runtime Cache;
- definir como metadata, services, componentes, permissoes, menus, APIs, layouts, plugins e overrides sao resolvidos;
- definir como Runtime publica eventos;
- definir tratamento arquitetural de cache e erros;
- estabelecer requisitos de seguranca, observabilidade e performance;
- fornecer base suficiente para futura implementacao do Runtime sem novas decisoes arquiteturais fundacionais.

## 3. Nao Objetivos

Esta RFC nao define nem autoriza:

- codigo;
- React;
- NestJS;
- renderer concreto;
- parser;
- cache concreto;
- framework de UI;
- framework de API;
- schema de banco;
- ORM;
- implementacao do Builder;
- implementacao da Metadata Engine;
- implementacao do Component Registry;
- implementacao do Permission Model;
- motor avancado de workflow;
- regras de negocio especificas de modulos.

O Runtime deve coordenar comportamento declarado, mas regras complexas de dominio devem permanecer em providers, services ou camadas de aplicacao dos modulos, expostas por contratos publicos.

## 4. Conceitos

### Runtime

Runtime e a camada de execucao declarativa que transforma metadata resolvida em comportamento operacional. Ele coordena resolucao de recursos, aplicacao de permissoes, montagem de estruturas executaveis e entrega para a Application.

### Runtime Context

Runtime Context e o contexto operacional usado pelo Runtime durante uma execucao. Ele deriva do Execution Context e adiciona informacoes especificas de execucao, como modulo alvo, resource alvo, metadata resolvida, estado de cache e capacidades habilitadas.

### Execution Pipeline

Execution Pipeline e a sequencia conceitual de passos executada pelo Runtime para transformar uma solicitacao em resposta, interface, menu, API conceitual ou comportamento dinamico.

### Runtime Session

Runtime Session e uma unidade logica de continuidade de execucao para uma identidade e contexto. Ela pode representar uma interacao de usuario, uma operacao administrativa, um job ou uma sequencia rastreavel de chamadas.

### Resolver

Resolver e qualquer mecanismo conceitual que transforma uma referencia declarativa em recurso efetivo. O Runtime usa resolvers para metadata, components, services, permissions, menus, APIs, layouts, plugins e overrides.

### Renderer

Renderer e a capacidade conceitual que transforma uma arvore ou estrutura executavel em representacao de interface, resposta ou experiencia consumivel pela Application. Esta RFC nao define renderer concreto.

### Registry

Registry e um catalogo governado de recursos registrados. O Runtime consome Metadata Registry, Service Registry, Component Registry e Module Registry por contratos publicos.

### Runtime State

Runtime State e o estado operacional necessario para acompanhar lifecycle, sessoes, caches, capacidades carregadas, execucoes em andamento e saude do Runtime.

### Runtime Cache

Runtime Cache e o mecanismo conceitual de armazenamento temporario de resultados resolvidos, arvores montadas, permissoes derivadas, menus e estruturas de execucao. Ele nao e fonte de verdade.

## 5. Arquitetura Geral

```text
Client
  |
  v
Runtime
  |
  +----------------+----------------+----------------+
  |                |                |                |
Metadata     Service Registry  Component Registry  Modules
  |                |                |                |
  +----------------+----------------+----------------+
                    |
                    v
              Application
```

Arquitetura expandida:

```text
                 Client
                   |
                   v
            +--------------+
            |   Runtime    |
            +------+-------+
                   |
   +---------------+----------------+----------------+
   |               |                |                |
Metadata       Services         Components        Modules
Resolver       Resolver          Resolver         Resolver
   |               |                |                |
Metadata       Service         Component          Module
Registry       Registry        Registry           Registry
   +---------------+----------------+----------------+
                   |
                   v
              Application
```

Responsabilidades de alto nivel:

- Client inicia uma solicitacao ou interacao.
- Runtime cria ou recebe Runtime Context.
- Metadata Resolver fornece metadata efetiva.
- Service Registry fornece services por token.
- Component Registry fornece componentes por identificador.
- Module Registry informa modulos, plugins e capacidades habilitadas.
- Application recebe comportamento, estrutura ou resposta final.

## 6. Runtime Bootstrap

Runtime Bootstrap e a sequencia que prepara o Runtime para operar apos o Platform Core estar em estado compativel.

Sequencia conceitual:

1. Confirmar que Platform Core esta Ready ou Running.
2. Resolver configuracoes do Runtime.
3. Registrar contratos publicos do Runtime no Service Registry.
4. Conectar-se aos contratos publicos de Metadata Registry, Metadata Resolver, Service Registry, Component Registry, Module Registry, Authorization, Event Bus, Configuration e Observability.
5. Validar compatibilidade com contratos do Core.
6. Carregar capacidades de Runtime declaradas por modulos habilitados.
7. Preparar Runtime Cache conceitual.
8. Validar health minimo.
9. Publicar evento de Runtime bootstrapped.
10. Entrar em estado Ready.

Regras:

- bootstrap do Runtime nao deve executar regras de negocio de modulos;
- bootstrap nao deve consumir metadata Draft;
- falha em dependencia fundacional deve impedir Ready;
- capacidades opcionais podem deixar o Runtime em modo degradado apenas quando explicitamente permitido;
- bootstrap deve ser observavel e auditavel.

## 7. Runtime Lifecycle

Estados:

- Created: o Runtime foi criado conceitualmente, mas ainda nao iniciou bootstrap.
- Bootstrapped: dependencias fundacionais foram conectadas e contratos basicos foram verificados.
- Initialized: resolvers, registries e configuracoes foram preparados.
- Ready: Runtime esta apto a receber solicitacoes.
- Running: Runtime esta processando solicitacoes, sessoes ou execucoes.
- Reloading: Runtime esta recarregando metadata, modulos, componentes, permissoes ou cache de forma controlada.
- Stopping: Runtime esta encerrando novas entradas e drenando execucoes ativas.
- Disposed: Runtime descartou estado operacional e nao aceita novas operacoes.

Regras:

- Ready exige Core compativel e registries essenciais disponiveis;
- Running exige Runtime Context valido por execucao;
- Reloading nao deve servir estados parcialmente resolvidos;
- Stopping deve preservar auditoria e eventos de encerramento;
- Disposed deve invalidar caches e sessoes operacionais conforme politica;
- transicoes devem emitir sinais de observabilidade.

## 8. Runtime Pipeline

O Runtime Pipeline transforma uma solicitacao em uma resposta ou estrutura executavel.

Passos:

1. Carregar contexto: receber solicitacao, requestId, correlationId e dados de entrada.
2. Resolver tenant: identificar tenant e aplicar isolamento logico.
3. Resolver workspace: identificar workspace quando aplicavel.
4. Resolver user e roles: identificar usuario, papeis e identidade operacional.
5. Resolver modulo: identificar modulo, plugin ou resource alvo e verificar se esta habilitado.
6. Resolver metadata: solicitar metadata efetiva ao Metadata Resolver.
7. Validar: confirmar versao, status, resource, escopo e compatibilidade da metadata resolvida.
8. Resolver services: solicitar providers necessarios ao Service Registry por tokens publicos.
9. Resolver componentes: consultar Component Registry por identificadores declarados.
10. Resolver permissoes: avaliar accesso por resource, action, field, menu, API ou layout.
11. Resolver overrides: garantir que overrides efetivos ja foram aplicados pela Metadata Engine ou por registries autorizados.
12. Resolver menus, APIs e layouts: derivar estruturas executaveis a partir da metadata e permissoes.
13. Montar arvore: produzir arvore conceitual de execucao, navegacao, interface ou resposta.
14. Renderizar: entregar representacao para Application por renderer conceitual.
15. Publicar eventos: emitir eventos de runtime relevantes.
16. Atualizar cache: armazenar resultados permitidos e invalidar entradas obsoletas.
17. Tratar erros: produzir falhas explicitas, observaveis e seguras.

O pipeline deve ser deterministico para a mesma entrada, contexto, versoes de metadata, configuracoes, permissoes e capacidades habilitadas.

## 9. Runtime Context

Runtime Context e obrigatorio para toda operacao do Runtime.

Campos minimos:

- tenant: tenant ativo.
- workspace: workspace ativo quando aplicavel.
- user: usuario, servico ou identidade responsavel.
- roles: papeis resolvidos para a identidade.
- locale: idioma e convencoes regionais.
- timezone: fuso horario aplicavel.
- requestId: identificador da solicitacao ou comando.
- correlationId: identificador para correlacao entre chamadas, eventos e logs.

Campos adicionais conceituais:

- permissions: permissoes resolvidas ou parcialmente resolvidas.
- module: modulo alvo quando aplicavel.
- resource: resource alvo quando aplicavel.
- metadataVersion: versao de metadata solicitada ou resolvida.
- runtimeState: estado operacional do Runtime.
- featureFlags: capacidades habilitadas por escopo quando aplicavel.

Regras:

- Runtime Context deve ser propagado para resolvers e services por contrato;
- modulos nao devem inferir contexto acessando infraestrutura interna;
- contexto ausente ou invalido deve impedir execucao;
- contexto deve participar de cache key quando afetar resultado;
- dados sensiveis do contexto nao devem ser expostos em logs sem classificacao.

## 10. Metadata Resolution

Runtime consome metadata resolvida pela Metadata Engine. Ele nao deve interpretar manifestos brutos como fonte final e nao deve aplicar overrides de metadata diretamente fora dos contratos do Metadata Resolver.

Responsabilidades do Runtime:

- solicitar metadata efetiva por resource, namespace, versao e Runtime Context;
- rejeitar metadata em estado Draft, Archived nao autorizado ou status invalido;
- respeitar metadata Deprecated conforme politica de compatibilidade;
- validar que metadata recebida e compativel com a operacao;
- usar metadata como fonte para menus, layouts, APIs, permissoes, componentes e arvores de execucao;
- publicar eventos quando metadata consumida gerar falha ou comportamento degradado;
- invalidar cache quando receber eventos de metadata relevante.

Metadata Resolution deve respeitar tenant, workspace, modulo, plugin, permissao, versao, overrides e extensions conforme RFC-0005.

## 11. Component Resolution

Component Resolution e o processo pelo qual o Runtime transforma referencias declarativas de componentes em componentes efetivos.

Responsabilidades:

- consultar Component Registry por identificador e contrato;
- validar se o componente esta disponivel para tenant, workspace, modulo e Runtime Context;
- aplicar substituicoes autorizadas por plugins;
- respeitar compatibilidade de versao;
- diferenciar componentes publicos, privados, substituiveis e especializados;
- rejeitar conflitos sem precedencia declarada;
- evitar que componente execute regra de dominio que pertence a service ou provider;
- montar componentes na arvore de renderizacao conceitual.

Builder deve referenciar componentes por identificador e contrato. O Builder nunca instancia componentes diretamente. Runtime e o responsavel por resolver o componente efetivo.

## 12. Service Resolution

Runtime resolve services por tokens publicos registrados no Service Registry.

Responsabilidades:

- solicitar services por token, scope e Runtime Context;
- respeitar permissao de consumo do token;
- aceitar overrides somente quando o Service Registry resolver substituicao autorizada;
- tratar token inexistente, conflito de providers, permissao negada ou dependencia invalida como falha explicita;
- preservar requestId e correlationId em chamadas a services;
- nao acessar providers internos de modulos, plugins ou Core;
- nao instanciar services diretamente.

Runtime pode usar services para validacao dinamica, computacao de fields, regras de aplicacao, autorizacao complementar, integracoes e execucao de actions declaradas. Services continuam responsaveis por suas regras; Runtime coordena a chamada por contrato.

## 13. Permission Resolution

Permission Resolution e a avaliacao de acesso para recursos, acoes, fields, menus, APIs, layouts, componentes e services usados pelo Runtime.

Fontes:

- Authorization do Platform Core;
- permissoes declaradas em metadata;
- permissoes declaradas em manifestos de modulos e plugins;
- Runtime Context;
- escopo de tenant e workspace;
- overrides e configuracoes autorizadas.

Regras:

- negar por padrao;
- permission deve ser avaliada antes de renderizar, executar action ou expor API;
- hidden nao substitui permission;
- readonly nao substitui permission;
- permissao de menu nao implica permissao de API;
- permissao de API nao implica permissao de field sensivel;
- dependencia entre modulos nao concede permissao automaticamente;
- resultado de permissao pode ser cacheado apenas quando seguro para o contexto.

O Runtime deve produzir falhas seguras e nao revelar existencia de resources sensiveis quando a politica exigir ocultacao.

## 14. API Resolution

API Resolution e o processo conceitual pelo qual o Runtime deriva capacidades de API a partir de metadata, permissions, services e module contracts.

Responsabilidades:

- identificar resources e actions expostos como API;
- validar que a metadata permite exposicao;
- validar permissao e tenancy;
- resolver services necessarios para executar action;
- aplicar validation declarativa antes de acao mutavel;
- produzir contrato conceitual de entrada, saida, erro e auditoria;
- rejeitar APIs derivadas de metadata invalida, nao publicada ou sem permissao;
- publicar eventos relevantes de execucao.

Esta RFC nao define HTTP, OpenAPI concreto, rotas fisicas, controllers ou transporte.

## 15. Menu Resolution

Menu Resolution transforma metadata de menus em navegacao efetiva para um Runtime Context.

Responsabilidades:

- consultar metadata de menu publicada;
- aplicar tenant, workspace, locale, module enablement e permissions;
- remover itens nao autorizados;
- ordenar itens por regras declarativas;
- resolver labels, icons conceituais e destinos;
- aplicar overrides e extensions ja resolvidos pela Metadata Engine;
- garantir que menu visivel nao prometa recurso inacessivel.

Menu Resolution deve ser deterministico e cacheavel por contexto quando permitido.

## 16. Layout Resolution

Layout Resolution transforma metadata de Page, Form, List, View, Dashboard e componentes em uma arvore conceitual de layout.

Responsabilidades:

- resolver metadata de layout efetiva;
- validar compatibilidade com componentes disponiveis;
- aplicar permission por page, section, action, field e component;
- aplicar locale, timezone, formatter e mask quando aplicavel;
- respeitar hidden, readonly, required e computed sem substituir autorizacao;
- produzir arvore conceitual para renderer;
- rejeitar layouts incompletos, conflitantes ou sem componentes validos;
- preservar rastreabilidade entre elemento renderizado e metadata de origem.

Runtime nao define estilo visual final nem implementa renderer concreto nesta RFC.

## 17. Runtime Cache

Runtime Cache otimiza execucao sem se tornar fonte de verdade.

Pode armazenar:

- metadata resolvida permitida para contexto;
- arvore de layout resolvida;
- menu efetivo;
- permissao derivada quando seguro;
- resolucao de componentes;
- resolucao de services por scope permitido;
- resultados intermediarios do pipeline.

Regras:

- cache deve considerar tenant, workspace, user ou roles quando afetarem resultado;
- cache deve considerar locale e timezone quando afetarem apresentacao;
- cache deve considerar versao de metadata e estado de modulo;
- cache nao deve vazar entre tenants, workspaces, users ou requests;
- eventos de metadata, modulo, permissao, componente, service ou plugin devem invalidar entradas afetadas;
- falha de cache nao deve alterar resultado correto;
- cache nao deve esconder falhas de autorizacao ou compatibilidade.

## 18. Runtime Events

Runtime deve publicar eventos para observabilidade, auditoria e integracao de baixo acoplamento.

Eventos conceituais:

- RuntimeBootstrapped;
- RuntimeInitialized;
- RuntimeReady;
- RuntimeStarted;
- RuntimeReloading;
- RuntimeStopped;
- RuntimeDisposed;
- RuntimePipelineStarted;
- RuntimePipelineCompleted;
- RuntimePipelineFailed;
- RuntimeMetadataResolved;
- RuntimeComponentResolved;
- RuntimeServiceResolved;
- RuntimePermissionDenied;
- RuntimeApiResolved;
- RuntimeMenuResolved;
- RuntimeLayoutResolved;
- RuntimeCacheInvalidated;
- RuntimeErrorHandled.

Regras:

- eventos devem preservar requestId e correlationId quando aplicavel;
- eventos sensiveis devem respeitar autorizacao e classificacao;
- eventos publicos devem possuir contrato versionado;
- eventos internos podem coordenar subsistemas do Runtime;
- eventos nao devem expor metadata privada, dados sensiveis ou implementacoes internas.

## 19. Runtime Extensions

Runtime Extensions permitem adicionar capacidades ao Runtime por pontos de extensao declarados.

Tipos:

- metadata resolvers especializados;
- component resolvers;
- menu contributors;
- layout contributors;
- API contributors;
- permission policies;
- renderer adapters conceituais;
- pipeline hooks;
- cache policies.

Regras:

- toda extension deve ser registrada por modulo ou plugin autorizado;
- extensions devem possuir contrato publico ou ponto de extensao declarado;
- extensions nao devem acessar implementacao interna do Runtime;
- pipeline hooks nao devem modificar contexto, metadata ou permissao silenciosamente;
- extensions devem ser versionadas, observaveis e auditaveis;
- falha de extension deve ser isolada quando possivel;
- extensions nao podem reduzir requisitos de seguranca.

## 20. Seguranca

Seguranca do Runtime deve seguir negar por padrao.

Requisitos:

- toda execucao exige Runtime Context valido;
- permissao deve ser avaliada antes de expor resource, action, field, menu, API, layout ou component;
- Runtime deve consumir apenas metadata validada e autorizada;
- Runtime deve consumir services apenas por tokens publicos;
- Runtime deve resolver componentes apenas via Component Registry;
- Runtime deve respeitar tenant e workspace em todas as resolucoes;
- Runtime nao deve acessar implementacoes internas de modulos, plugins ou Core;
- Runtime nao deve executar action sem permissao explicita;
- erros devem ser seguros e nao vazar detalhes internos;
- eventos e logs devem preservar classificacao de dados.

O Runtime nao deve usar metadata visual, como hidden ou readonly, como substituto de Authorization.

## 21. Observabilidade

Runtime deve ser observavel desde o bootstrap ate o descarte.

Sinais obrigatorios:

- estado do lifecycle;
- tempo de bootstrap;
- tempo por etapa do pipeline;
- falhas de metadata, service, component, permission, menu, API e layout resolution;
- cache hit, miss e invalidacao;
- eventos publicados;
- throughput de execucao;
- erros por modulo, plugin, tenant, workspace e resource;
- degradacao por dependencia opcional;
- consumo de services e components por contrato.

Logs, metricas e traces devem usar requestId e correlationId quando disponiveis. Observabilidade nao deve vazar metadata privada, dados sensiveis, secrets, tokens internos ou detalhes de implementacao.

## 22. Performance

Performance do Runtime deve ser tratada como requisito arquitetural.

Diretrizes:

- resolver metadata apenas uma vez por contexto quando possivel;
- usar cache para resultados seguros e invalidaveis;
- evitar recomputar menus e layouts quando metadata, permissao e contexto nao mudarem;
- usar lazy loading para services e components opcionais;
- separar falhas de cache de falhas de fonte de verdade;
- permitir warmup conceitual de metadata ou rotas criticas quando autorizado;
- medir latencia por etapa do pipeline;
- manter resolucao deterministica para permitir cache confiavel;
- evitar estado local nao externalizavel que impeca escala horizontal.

O Runtime deve favorecer previsibilidade e isolamento sobre otimizacoes que comprometam seguranca ou corretude.

## 23. Diagramas

### Bootstrap

```text
Created
   |
   v
Validate Core Contracts
   |
   v
Resolve Runtime Configuration
   |
   v
Connect Registries
   |
   v
Prepare Resolvers
   |
   v
Prepare Runtime Cache
   |
   v
Ready
```

### Pipeline

```text
Client Request
      |
      v
Load Runtime Context
      |
      v
Resolve Tenant / Workspace / User
      |
      v
Resolve Module / Resource
      |
      v
Resolve Metadata
      |
      v
Resolve Permissions
      |
      v
Resolve Services / Components
      |
      v
Build Execution Tree
      |
      v
Render / Respond
```

### Rendering

```text
Resolved Metadata
      |
      v
Layout Resolution
      |
      v
Component Resolution
      |
      v
Permission Filter
      |
      v
Execution Tree
      |
      v
Renderer Contract
      |
      v
Application
```

### Permission Resolution

```text
Runtime Context
      |
      v
Resource + Action + Field
      |
      v
Authorization Contract
      |
      v
Metadata Permissions
      |
      v
Tenant / Workspace Scope
      |
      v
Allow or Deny
```

### Component Resolution

```text
Component Reference
      |
      v
Component Registry
      |
      v
Check Scope / Version / Permission
      |
      v
Apply Plugin Substitution
      |
      v
Resolved Component
```

### Runtime Lifecycle

```text
Created
  |
  v
Bootstrapped
  |
  v
Initialized
  |
  v
Ready
  |
  v
Running
  |
  +------> Reloading
  |          |
  |          v
  +------- Ready
  |
  v
Stopping
  |
  v
Disposed
```

## 24. Glossario

- Runtime: camada que transforma metadata resolvida em comportamento executavel.
- Runtime Context: contexto operacional usado pelo Runtime em uma execucao.
- Execution Pipeline: sequencia de etapas que processa uma solicitacao no Runtime.
- Runtime Session: unidade logica de continuidade de execucao.
- Resolver: mecanismo que transforma referencias declarativas em recursos efetivos.
- Renderer: contrato conceitual que materializa arvore executavel em representacao consumivel.
- Registry: catalogo governado de recursos registrados.
- Runtime State: estado operacional do Runtime.
- Runtime Cache: cache de resultados resolvidos pelo Runtime.
- Execution Tree: arvore conceitual de resposta, interface ou comportamento.
- API Resolution: derivacao de capacidades de API a partir de metadata e contratos.
- Layout Resolution: derivacao de estrutura visual a partir de metadata.
- Permission Resolution: avaliacao de acesso por contexto, resource e action.
- Component Resolution: resolucao de componente efetivo por registry.

## 25. Decisoes Arquiteturais

- Runtime Engine transforma metadata resolvida em comportamento executavel.
- Runtime nao e Builder, Metadata Engine, Module Loader, renderer concreto ou framework.
- Runtime consome metadata resolvida, nao metadata bruta nem manifestos brutos.
- Runtime opera sempre dentro de Runtime Context derivado de Execution Context.
- Runtime consome services apenas por tokens publicos via Service Registry.
- Runtime resolve componentes apenas via Component Registry.
- Runtime aplica Permission Resolution antes de expor resources, menus, APIs, layouts, fields ou actions.
- Runtime nao executa regras complexas de dominio; essas ficam em providers ou services de modulo.
- Runtime nao aplica overrides de metadata diretamente; consome resultado do Metadata Resolver.
- Runtime pode aplicar extensoes apenas por pontos de extensao declarados.
- Runtime Cache nao e fonte de verdade.
- Cache deve respeitar tenant, workspace, user, roles, locale, timezone, metadata version e module state quando afetarem resultado.
- Runtime deve publicar eventos de lifecycle, pipeline, resolucao, cache e erro.
- Falhas devem ser explicitas, observaveis e seguras.
- Esta RFC nao define React, NestJS, renderer, parser, framework, cache concreto ou codigo.

## 26. Riscos

- Pipeline amplo pode aumentar latencia se cache e resolucao nao forem bem governados.
- Cache incorreto pode vazar dados entre tenants, workspaces ou usuarios.
- Permissoes mal resolvidas podem expor resources indevidos.
- Component substitutions por plugins podem criar comportamento inesperado.
- Runtime extensions podem aumentar acoplamento se contratos forem fracos.
- Eventos excessivos podem gerar ruido operacional.
- Erros genericos demais podem dificultar diagnostico; erros detalhados demais podem vazar informacao.
- Layouts muito dinamicos podem dificultar previsibilidade de experiencia e performance.

## 27. Duvidas

- Qual sera a politica final de invalidacao entre Metadata Cache e Runtime Cache?
- Quais partes do Runtime Pipeline poderao ser estendidas por plugins?
- Como o Runtime representara erro seguro para Client sem vazar detalhes internos?
- Qual sera o contrato formal do Renderer conceitual?
- Quais resolucoes poderao ser precomputadas durante warmup?
- Como permissao por field sera combinada com layouts e APIs automaticas?
- Como Runtime Session se relacionara com autenticacao e sessoes de usuario?
- Quais eventos do Runtime serao publicos e quais serao internos?

## 28. RFCs Dependentes

As seguintes RFCs dependerao desta:

- RFC de Builder Visual.
- RFC de Component Registry.
- RFC de API Generation.
- RFC de Menu e Navigation Model.
- RFC de Layout Model.
- RFC de Permission Model.
- RFC de Renderer Contract.
- RFC de Runtime Cache.
- RFC de Runtime Extensions.
- RFC de Plugin System e Marketplace.
- RFC de Observabilidade operacional.
- RFC de SDK de Runtime.
