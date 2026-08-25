# RFC-0002: Platform Core do Veltryx OS

Status: Frozen  
Version: 1.0  
Type: RFC arquitetural  
Owner: Architecture Team  
Reviewers: Architecture Review  
Created: 2026-08-03  
Last Updated: 2026-08-03  
Depends On: RFC-0001  
Impacts: RFC-0003, RFC-0004, RFC-0005, RFC-0006, RFC-0007, RFC-0099  
Supersedes: None
## Indice

1. [Visao Geral](#1-visao-geral)
2. [Responsabilidades do Platform Core](#2-responsabilidades-do-platform-core)
3. [Nao Responsabilidades](#3-nao-responsabilidades)
4. [Arquitetura Interna](#4-arquitetura-interna)
5. [Bootstrap da Plataforma](#5-bootstrap-da-plataforma)
6. [Ciclo de Vida do Core](#6-ciclo-de-vida-do-core)
7. [Service Registry](#7-service-registry)
8. [Configuration System](#8-configuration-system)
9. [Event Bus](#9-event-bus)
10. [Module Registry](#10-module-registry)
11. [Interfaces Publicas](#11-interfaces-publicas)
12. [Fronteiras entre Core, Runtime e Modules](#12-fronteiras-entre-core-runtime-e-modules)
13. [Seguranca e Governanca](#13-seguranca-e-governanca)
14. [Observabilidade do Core](#14-observabilidade-do-core)
15. [Diagramas](#15-diagramas)
16. [Glossario](#16-glossario)
17. [Decisoes Arquiteturais Registradas](#17-decisoes-arquiteturais-registradas)
18. [RFCs Futuras Relacionadas](#18-rfcs-futuras-relacionadas)

## 1. Visao Geral

O Platform Core e o nucleo operacional e arquitetural do Veltryx OS. Ele fornece as capacidades transversais necessarias para inicializar, configurar, proteger, observar e estender a plataforma sem acoplar o sistema a um dominio empresarial especifico.

Esta RFC detalha a responsabilidade do Core definida pela RFC-0001. O Core deve ser entendido como uma camada de contratos, servicos fundacionais e registries. Ele coordena a plataforma, mas nao implementa funcionalidades de negocio como CRM, Financeiro, Estoque, RH ou Projetos.

O objetivo do Platform Core e oferecer uma base estavel para Runtime Engine, Builder, modulos, plugins, SDKs e futuras capacidades da plataforma.

## 2. Responsabilidades do Platform Core

O Platform Core e responsavel por:

- inicializar a plataforma de forma ordenada e verificavel;
- manter contratos publicos para capacidades transversais;
- resolver configuracoes globais, por tenant, por workspace e por modulo;
- autenticar identidades de usuarios, servicos e integracoes;
- autorizar acoes com base em papeis, permissoes, recursos e contexto;
- resolver contexto de tenant, workspace, usuario, locale, timezone e correlacao;
- registrar e disponibilizar servicos internos autorizados;
- registrar modulos descobertos, instalados, resolvidos e habilitados;
- disponibilizar um barramento conceitual de eventos;
- fornecer contratos para armazenamento, cache e observabilidade;
- expor pontos de extensao controlados para Runtime, Builder, modulos e plugins;
- aplicar regras de dependencia definidas pela RFC-0001;
- impedir que modulos acessem implementacoes internas do Core.

Subsistemas pertencentes ao Platform Core:

- Auth;
- Authorization;
- Tenancy;
- Metadata;
- Runtime contracts;
- Events;
- Module Loader;
- Module Registry;
- Service Registry;
- Configuration;
- Storage contracts;
- Cache contracts;
- Observability;
- SDK contracts.

## 3. Nao Responsabilidades

O Platform Core nao e responsavel por:

- implementar dominios de negocio;
- conter regras de CRM, Financeiro, Estoque, RH, Projetos ou outros modulos;
- gerar interfaces finais sem participacao do Runtime;
- editar metadados como experiencia visual de usuario;
- substituir o Builder;
- substituir a Metadata Engine;
- definir workflows avancados;
- implementar marketplace funcional;
- impor arquitetura de microservicos;
- conter regras especificas de plugins ou modulos que deveriam estar em seus manifestos.

O Core deve oferecer infraestrutura arquitetural para que essas capacidades existam de forma governada, mas sem assumir seu comportamento de dominio.

## 4. Arquitetura Interna

A arquitetura interna do Platform Core deve ser organizada por subsistemas com responsabilidades claras e contratos publicos estaveis.

```text
                     Platform Core
                           |
    +----------+-----------+-----------+-----------+
    |          |           |           |           |
   Auth   Authorization  Tenancy  Configuration  Observability
    |          |           |           |           |
    +----------+-----------+-----------+-----------+
                           |
    +----------+-----------+-----------+-----------+
    |          |           |           |           |
 Services    Events     Modules     Metadata   Runtime Contracts
 Registry     Bus       Registry    Contracts
    |          |           |           |           |
    +----------+-----------+-----------+-----------+
                           |
              Storage Contracts | Cache Contracts | SDK
```

Diretrizes internas:

- cada subsistema deve possuir responsabilidade unica e contrato claro;
- subsistemas devem se comunicar por interfaces publicas internas, nao por acesso direto a detalhes de implementacao;
- dependencias devem fluir para contratos estaveis;
- infraestrutura concreta deve permanecer substituivel;
- estado operacional compartilhado deve ser externalizavel;
- inicializacao deve ser observavel e auditavel.

## 5. Bootstrap da Plataforma

Bootstrap e o processo conceitual que leva o Veltryx OS de um estado nao inicializado para um estado operacional minimo.

Fluxo conceitual:

```text
Start
  |
  v
Load Base Configuration
  |
  v
Initialize Core Services
  |
  v
Validate Core Health
  |
  v
Initialize Registries
  |
  v
Discover Modules
  |
  v
Resolve Modules
  |
  v
Enable Runtime Contracts
  |
  v
Ready
```

Responsabilidades do bootstrap:

- carregar configuracoes minimas necessarias;
- inicializar subsistemas essenciais;
- validar pre-condicoes de seguranca, tenancy e observabilidade;
- registrar servicos fundacionais;
- preparar Configuration System, Service Registry, Event Bus e Module Registry;
- descobrir modulos disponiveis;
- resolver dependencias e compatibilidade conceitual de modulos;
- disponibilizar contratos para Runtime e Builder;
- falhar de forma explicita quando uma dependencia fundacional estiver invalida.

O bootstrap nao deve executar logica de negocio de modulos. Ativacao de comportamento modular deve ocorrer apos validacao e resolucao do Module Registry.

## 6. Ciclo de Vida do Core

O ciclo de vida do Core descreve os estados operacionais do nucleo da plataforma.

Estados:

- Uninitialized: nenhum subsistema fundacional foi carregado.
- Bootstrapping: configuracoes e servicos essenciais estao sendo inicializados.
- Configured: configuracoes minimas foram carregadas e validadas.
- Services Registered: servicos fundacionais foram registrados no Service Registry.
- Registries Ready: registries essenciais foram preparados para consulta e escrita controlada.
- Modules Resolved: modulos descobertos foram avaliados pelo Module Registry.
- Runtime Ready: contratos necessarios para execucao dinamica estao disponiveis.
- Running: o Core esta apto a atender operacoes da plataforma.
- Degraded: o Core opera com capacidade reduzida, mas preserva integridade e seguranca.
- Stopping: o Core esta encerrando operacoes de forma coordenada.
- Stopped: o Core nao aceita novas operacoes.

Transicoes de estado devem ser observaveis e, quando relevantes, auditaveis. Falhas em subsistemas essenciais devem impedir a entrada em estado Running.

## 7. Service Registry

O Service Registry e o catalogo conceitual de servicos fundacionais disponiveis dentro do Platform Core. Ele permite que subsistemas e consumidores autorizados resolvam capacidades por contrato, sem depender de implementacoes concretas.

Responsabilidades:

- registrar servicos por identificador e contrato;
- resolver servicos para consumidores autorizados;
- aplicar escopos de visibilidade;
- impedir acesso a servicos internos nao publicados;
- expor metadados operacionais basicos de servicos registrados;
- suportar substituicao controlada de implementacoes;
- participar do bootstrap e do encerramento coordenado da plataforma.

Diretrizes:

- servicos devem ser publicados por contrato;
- nomes e identificadores devem ser estaveis;
- consumidores nao devem construir ou acessar servicos internos diretamente;
- conflitos de registro devem ser tratados como erro arquitetural;
- versao e compatibilidade devem ser consideradas para servicos publicos.

## 8. Configuration System

O Configuration System e responsavel por resolver configuracoes em multiplos escopos e disponibiliza-las de forma consistente para Core, Runtime, Builder, modulos e plugins.

Escopos conceituais:

- global: configuracao padrao da plataforma;
- environment: configuracao do ambiente operacional;
- tenant: configuracao especifica de um tenant;
- workspace: configuracao especifica de um workspace;
- module: configuracao declarada ou requerida por um modulo;
- plugin: configuracao declarada ou requerida por um plugin;
- user: preferencias ou opcoes de experiencia permitidas ao usuario.

Regras:

- configuracoes sensiveis devem ser protegidas;
- configuracoes devem possuir origem rastreavel;
- sobrescritas devem respeitar hierarquia e permissoes;
- modulos devem acessar configuracoes por contrato, nao por infraestrutura direta;
- alteracoes relevantes devem ser auditaveis;
- o Core deve distinguir configuracao ausente, configuracao invalida e configuracao negada por permissao.

Hierarquia conceitual:

```text
Global
  |
Environment
  |
Tenant
  |
Workspace
  |
Module / Plugin
  |
User
```

A RFC nao define formato, armazenamento fisico ou mecanismo de entrega de configuracao.

## 9. Event Bus

O Event Bus e o mecanismo conceitual de publicacao, assinatura e roteamento de eventos dentro da plataforma. Ele deve suportar comunicacao de baixo acoplamento entre subsistemas do Core, Runtime, modulos e plugins.

Tipos de eventos:

- Core Events: eventos internos gerados por subsistemas do Core;
- Module Events: eventos publicados por modulos;
- Public Events: eventos publicados como contratos consumiveis por outros modulos, plugins ou integracoes autorizadas;
- Operational Events: eventos relacionados a bootstrap, health, degradacao, auditoria e ciclo de vida;
- Security Events: eventos relevantes para autenticacao, autorizacao, auditoria e rastreabilidade.

Diretrizes:

- eventos publicos devem possuir contratos estaveis e versionaveis;
- consumidores nao devem depender de detalhes internos do produtor;
- publicacao de eventos deve preservar tenant, workspace e correlationId quando aplicavel;
- eventos nao devem ser usados para burlar regras de autorizacao;
- falhas de consumidores nao devem comprometer integridade do produtor sem decisao arquitetural explicita;
- eventos de seguranca e auditoria devem ser rastreaveis.

Esta RFC nao define tecnologia, transporte, broker, topologia ou formato de serializacao.

## 10. Module Registry

O Module Registry e o registro operacional de modulos conhecidos pela plataforma. Ele e responsavel por manter o estado conceitual dos modulos e disponibilizar informacoes para Module Loader, Runtime, Builder, Authorization, Metadata e Observability.

Responsabilidades:

- registrar modulos descobertos;
- armazenar estado do ciclo de vida do modulo;
- validar manifestos conceitualmente;
- resolver dependencias e compatibilidade;
- expor capacidades declaradas por modulo;
- informar permissoes, rotas, metadados, eventos, providers, migrations e seeds declarados;
- diferenciar modulo instalado, habilitado e em execucao;
- preservar historico necessario para auditoria;
- impedir ativacao de modulos incompativeis ou conflitantes.

Estados de modulo devem seguir a RFC-0001: Discovered, Installed, Resolved, Loaded, Enabled, Running, Disabled e Uninstalled.

O Module Registry nao executa logica de negocio. Ele registra, valida e disponibiliza informacoes para que outros subsistemas atuem dentro de suas fronteiras.

## 11. Interfaces Publicas

Interfaces publicas do Core sao contratos consumiveis por Runtime, Builder, modulos, plugins, SDKs e aplicacoes autorizadas. Elas definem a forma suportada de interacao com capacidades fundacionais.

Categorias:

- Auth Interface: identidade, sessao conceitual e autenticacao.
- Authorization Interface: avaliacao de permissoes e recursos.
- Tenancy Interface: tenant, workspace e contexto operacional.
- Configuration Interface: leitura governada de configuracoes resolvidas.
- Service Registry Interface: descoberta de servicos publicados por contrato.
- Event Bus Interface: publicacao e assinatura autorizada de eventos.
- Module Registry Interface: consulta de modulos, estados e capacidades.
- Metadata Interface: acesso a metadados registrados e validados.
- Observability Interface: logs, metricas, tracing e health checks.
- Storage Interface: contratos de persistencia e arquivos.
- Cache Interface: contratos de cache e invalidacao.
- SDK Interface: tipos e utilitarios oficiais para extensao.

Regras:

- interfaces publicas devem ser estaveis, versionaveis e documentadas;
- consumidores externos ao Core devem usar apenas interfaces publicas;
- alteracoes incompativeis exigem RFC ou processo formal de versionamento;
- interfaces publicas nao devem expor detalhes internos de armazenamento, cache, transporte ou framework;
- permissoes devem ser avaliadas antes de expor capacidades sensiveis.

## 12. Fronteiras entre Core, Runtime e Modules

As fronteiras entre Core, Runtime e Modules preservam a arquitetura modular definida na RFC-0001.

```text
                 +-------------------+
                 |   Platform Core   |
                 | contracts/state   |
                 +---------+---------+
                           |
                    public contracts
                           |
                 +---------v---------+
                 |   Runtime Engine  |
                 | metadata runtime  |
                 +---------+---------+
                           |
                    module contracts
                           |
          +----------------v----------------+
          |         Business Modules        |
          | CRM | Financeiro | Estoque | RH |
          +---------------------------------+
```

Regras de fronteira:

- Core fornece contratos, registries, contexto, seguranca, configuracao e observabilidade.
- Runtime interpreta metadados e usa contratos publicos do Core.
- Modules fornecem capacidades de negocio por manifesto, eventos, metadados, rotas e providers.
- Modules nao acessam implementacoes internas do Core.
- Runtime nao depende do Builder.
- Builder produz metadados e consome contratos publicos.
- Core nao depende de modulos de negocio.
- Integracoes entre modulos devem ocorrer por contratos publicos, eventos ou APIs autorizadas.

O Core pode conhecer o conceito de modulo, mas nao o conteudo de dominio de um modulo.

## 13. Seguranca e Governanca

O Core deve aplicar seguranca por padrao. Toda interface publica sensivel deve passar por autenticacao, autorizacao, tenancy e auditoria quando aplicavel.

Requisitos:

- negar acesso por padrao;
- resolver permissoes dentro de um Execution Context;
- auditar alteracoes em configuracao, manifesto, estado de modulo, permissao e metadados;
- correlacionar eventos e logs por requestId e correlationId;
- proteger configuracoes sensiveis;
- impedir que plugins e modulos acessem capacidades nao declaradas;
- registrar falhas de autorizacao e eventos criticos de seguranca.

Governanca:

- mudancas estruturantes no Core exigem RFC;
- decisoes locais de implementacao podem ser registradas por ADR;
- contratos publicos devem possuir politica de compatibilidade;
- capacidades experimentais nao devem ser tratadas como contratos estaveis.

## 14. Observabilidade do Core

O Core deve ser observavel desde o bootstrap.

Sinais obrigatorios:

- logs estruturados de bootstrap, configuracao, eventos, registries e ciclo de vida;
- metricas de saude, latencia, erros, volume de eventos, resolucao de modulos e acesso a configuracoes;
- tracing para operacoes que cruzam Core, Runtime, modulos e plugins;
- health checks para subsistemas essenciais;
- registro de estado Running, Degraded, Stopping e falhas de inicializacao;
- correlacao por requestId e correlationId.

Observabilidade nao deve vazar dados sensiveis. Logs e metricas devem respeitar tenant, permissao e classificacao de dados.

## 15. Diagramas

### Relacao entre Subsistemas

```text
                     Veltryx OS
                         |
                 +-------v-------+
                 | Platform Core |
                 +-------+-------+
                         |
 +-----------+-----------+-----------+-----------+
 |           |           |           |           |
Auth   Authorization   Tenancy  Configuration  Observability
 |           |           |           |           |
 +-----------+-----------+-----------+-----------+
                         |
 +-----------+-----------+-----------+-----------+
 |           |           |           |           |
Service    Event      Module     Metadata    Runtime
Registry    Bus       Registry   Contracts   Contracts
```

### Bootstrap e Execucao

```text
Bootstrap
   |
   v
Core Ready
   |
   v
Registries Ready
   |
   v
Modules Resolved
   |
   v
Runtime Ready
   |
   v
Platform Running
```

### Contratos Publicos

```text
Builder ----+
            |
Runtime ----+----> Core Public Interfaces
            |
Modules ----+
            |
Plugins ----+
```

## 16. Glossario

- Platform Core: nucleo da plataforma responsavel por contratos e capacidades transversais.
- Core Service: servico fundacional registrado e consumido por contrato.
- Service Registry: catalogo de servicos publicados pelo Core.
- Configuration System: subsistema de resolucao governada de configuracoes.
- Event Bus: barramento conceitual para publicacao e consumo de eventos.
- Module Registry: registro operacional de modulos e seus estados.
- Module Loader: subsistema responsavel por descoberta, carregamento e ativacao controlada de modulos.
- Public Interface: contrato suportado para consumo por Runtime, Builder, modulos, plugins ou SDKs.
- Execution Context: contexto operacional com tenant, workspace, identidade, permissoes e correlacao.
- Core Lifecycle: conjunto de estados operacionais do Platform Core.
- Core Contract: interface estavel exposta pelo Core para consumidores autorizados.
- Degraded: estado em que o Core opera com capacidade reduzida sem violar seguranca ou integridade.

## 17. Decisoes Arquiteturais Registradas

- O Platform Core e o nucleo de capacidades transversais do Veltryx OS.
- O Core nao implementa modulos de negocio.
- O Core pode conhecer o conceito de modulo, mas nao o conteudo de dominio de um modulo.
- Auth, Authorization, Tenancy, Metadata contracts, Runtime contracts, Events, Module Loader, Module Registry, Service Registry, Configuration, Storage contracts, Cache contracts, Observability e SDK contracts pertencem ao Core.
- Bootstrap deve inicializar configuracao, servicos, registries, modulos resolvidos e contratos de runtime de forma ordenada.
- O ciclo de vida do Core deve ser explicito e observavel.
- Service Registry resolve capacidades por contrato, nao por implementacao concreta.
- Configuration System deve resolver configuracoes por escopo e preservar rastreabilidade.
- Event Bus deve permitir comunicacao de baixo acoplamento sem definir tecnologia nesta RFC.
- Module Registry mantem estados e capacidades declaradas de modulos, mas nao executa regras de negocio.
- Interfaces publicas do Core devem ser estaveis, versionaveis e documentadas.
- Runtime, Builder, Modules e Plugins devem consumir o Core apenas por interfaces publicas.
- Mudancas estruturantes no Core exigem RFC; decisoes locais podem usar ADRs.

## 18. RFCs Futuras Relacionadas

- RFC de Auth e Authorization.
- RFC de Tenancy e Execution Context.
- RFC de Metadata Engine.
- RFC de Runtime Engine.
- RFC de Module System, Module Loader e Module Registry.
- RFC de Manifesto de Modulo.
- RFC de Event Bus e contratos de eventos.
- RFC de Configuration System.
- RFC de Service Registry e contratos publicos.
- RFC de Observabilidade operacional.
- RFC de SDK e extensibilidade.

