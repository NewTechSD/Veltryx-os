# RFC-0004: Service Registry & Dependency Injection do Veltryx OS

Status: Frozen  
Version: 1.0  
Type: RFC arquitetural  
Owner: Architecture Team  
Reviewers: Architecture Review  
Created: 2026-08-03  
Last Updated: 2026-08-03  
Depends On: RFC-0001, RFC-0002, RFC-0003  
Impacts: RFC-0005, RFC-0006, RFC-0007, RFC-0099  
Supersedes: None
## Indice

1. [Visao Geral](#1-visao-geral)
2. [Objetivos](#2-objetivos)
3. [Nao Objetivos](#3-nao-objetivos)
4. [Conceitos](#4-conceitos)
5. [Arquitetura Geral](#5-arquitetura-geral)
6. [Service Lifecycle](#6-service-lifecycle)
7. [Service Registry](#7-service-registry)
8. [Dependency Injection](#8-dependency-injection)
9. [Service Tokens](#9-service-tokens)
10. [Providers](#10-providers)
11. [Service Resolution](#11-service-resolution)
12. [Overrides](#12-overrides)
13. [Lazy Loading](#13-lazy-loading)
14. [Scopes](#14-scopes)
15. [Public Contracts](#15-public-contracts)
16. [Internal Contracts](#16-internal-contracts)
17. [Seguranca](#17-seguranca)
18. [Observabilidade](#18-observabilidade)
19. [Diagramas](#19-diagramas)
20. [Glossario](#20-glossario)
21. [Decisoes Arquiteturais](#21-decisoes-arquiteturais)
22. [Riscos](#22-riscos)
23. [RFCs Dependentes](#23-rfcs-dependentes)

## 1. Visao Geral

O Service Registry e o mecanismo arquitetural do Veltryx OS para registrar, descobrir, resolver, substituir e descartar servicos por contrato. Ele pertence ao Platform Core e fornece uma superficie controlada para Core, Runtime, Builder, modulos, plugins e SDKs consumirem capacidades sem depender de implementacoes concretas.

Dependency Injection, nesta RFC, e o modelo arquitetural de inversao de dependencia usado para entregar servicos aos consumidores por meio de tokens, providers, scopes e resolvers. A RFC nao define um IoC Container especifico nem qualquer mecanismo de framework. Ela define o comportamento esperado para que um container possa ser implementado futuramente de forma compativel.

O Service Registry deve reforcar as decisoes anteriores: Core nao depende de modulos de negocio; Runtime nao depende do Builder; Builder consome contratos publicos; modulos e plugins nao acessam implementacoes internas do Core; integracoes entre modulos ocorrem por contratos publicos, eventos autorizados e metadados registrados.

## 2. Objetivos

Os objetivos desta RFC sao:

- definir Service, Provider, Registry, Token, Factory, Scope e Resolver;
- especificar o lifecycle conceitual de servicos;
- definir como servicos sao registrados, descobertos, resolvidos e descartados;
- definir como modulos registram servicos via manifesto e Module Loader;
- definir como plugins adicionam, estendem ou substituem servicos;
- definir regras para override e substituicao;
- definir lazy loading sem escolher mecanismo de implementacao;
- definir scopes global, tenant, workspace, request e transient;
- definir como Runtime e Builder consomem servicos;
- definir contratos publicos e internos;
- estabelecer requisitos de seguranca, observabilidade e governanca;
- fornecer base arquitetural suficiente para futura implementacao de um container de DI.

## 3. Nao Objetivos

Esta RFC nao define nem autoriza:

- codigo;
- decorators;
- implementacao de IoC Container;
- APIs HTTP concretas;
- sintaxe de configuracao;
- formato de manifesto;
- integracao especifica com NestJS ou qualquer framework;
- schema de banco de dados;
- mecanismo fisico de cache;
- estrategia de serializacao;
- runtime de plugins nao confiaveis;
- politica comercial de marketplace.

Esta RFC define contratos, responsabilidades, estados e comportamento arquitetural.

## 4. Conceitos

### Service

Service e uma capacidade consumivel por contrato. Um service pode representar uma operacao de dominio, uma capacidade transversal, uma integracao, um adaptador, um provider de metadados, uma politica de autorizacao, um conector ou uma abstracao de infraestrutura.

Services devem ser consumidos por tokens e contratos publicos ou internos. Consumidores nao devem depender da classe, modulo fisico, framework ou implementacao concreta de um service.

### Provider

Provider e a declaracao que informa ao Service Registry como um service deve ser disponibilizado. Ele associa um token a uma estrategia conceitual de fornecimento, a um scope, a metadados de compatibilidade e a regras de visibilidade.

Um provider pode ser publicado pelo Core, por um modulo ou por um plugin. Providers publicos devem ser declarados como contratos suportados. Providers internos permanecem privados ao modulo ou subsistema que os declara.

### Registry

Registry e um catalogo governado de entradas registradas por identificador e contrato. O Service Registry cataloga providers e services. Outros registries, como Module Registry e Component Registry, podem consultar ou depender de contratos publicados pelo Service Registry, mas nao devem acessar sua implementacao interna.

### Token

Token e o identificador estavel usado para solicitar um service. O token representa um contrato, nao uma implementacao. Ele deve ser unico dentro do escopo em que e publico e deve permitir resolucao deterministica.

Tokens publicos fazem parte da superficie de compatibilidade da plataforma. Mudancas incompativeis em tokens publicos ou em seus contratos devem seguir politica de versionamento.

### Factory

Factory e a estrategia conceitual para criar ou obter uma instancia de service. Ela pode representar criacao direta, adaptacao de outro service, composicao, proxy, delegacao ou resolucao lazy. Esta RFC nao define assinatura, API ou implementacao de factory.

### Scope

Scope define o limite de vida, visibilidade e reutilizacao de um service. Scopes impedem que estado global seja usado indevidamente em contextos de tenant, workspace ou request.

### Resolver

Resolver e o mecanismo conceitual que recebe uma solicitacao por token e contexto, consulta registros disponiveis, avalia permissao, escopo, overrides, compatibilidade e lifecycle, e retorna o service apropriado ou uma falha explicita.

## 5. Arquitetura Geral

```text
                         Platform Core
                              |
                    +---------v----------+
                    |  Service Registry  |
                    +---------+----------+
                              |
          +-------------------+-------------------+
          |                   |                   |
      Providers             Tokens             Scopes
          |                   |                   |
          +-------------------+-------------------+
                              |
                    +---------v----------+
                    |      Resolver      |
                    +---------+----------+
                              |
          +-------------------+-------------------+
          |                   |                   |
       Runtime              Builder             Modules
          |                   |                   |
          +-------------------+-------------------+
                              |
                            Plugins
```

Fluxo de responsabilidade:

- Module Loader registra providers declarados por modulos e plugins.
- Service Registry valida, cataloga e governa providers.
- Resolver resolve tokens para consumidores autorizados.
- Runtime consome services para materializar comportamento dinamico.
- Builder consome services para operacoes administrativas e producao de metadados.
- Modulos consomem services publicos por contrato, nunca por implementacao interna.
- Plugins podem adicionar ou substituir providers quando houver ponto de extensao permitido.

## 6. Service Lifecycle

O lifecycle de service define estados minimos para governar registro, resolucao, execucao e descarte.

Estados:

- Registered: o provider foi registrado no Service Registry com token, contrato, scope, origem e regras de visibilidade.
- Resolved: uma solicitacao por token foi avaliada e associada a um provider valido dentro de um contexto.
- Initialized: o service foi preparado para uso conforme seu scope e suas dependencias conceituais.
- Running: o service esta apto a atender consumidores autorizados.
- Disposed: o service foi descartado, invalidado ou removido do escopo ativo.

Regras:

- Registered nao implica Initialized;
- Resolved nao implica reuso de instancia;
- Initialized deve respeitar scope;
- Running exige que dependencias obrigatorias estejam resolvidas;
- Disposed deve liberar referencias operacionais e impedir novo uso daquela instancia;
- falhas em resolucao, autorizacao, compatibilidade ou inicializacao devem impedir Running;
- descarte deve ser observavel quando afetar servicos publicos ou scopes compartilhados.

## 7. Service Registry

O Service Registry e responsavel por manter o catalogo de providers e permitir resolucao governada de services.

Responsabilidades:

- registrar providers por token;
- validar unicidade, visibilidade e compatibilidade de tokens;
- armazenar origem do provider, como Core, modulo ou plugin;
- registrar scope, versao, prioridade e politica de override quando aplicavel;
- expor descoberta de services publicos para consumidores autorizados;
- impedir acesso a providers internos;
- resolver conflitos de registro de forma deterministica;
- integrar-se ao Module Loader para carregar e descarregar providers;
- integrar-se ao Execution Context para resolucao contextual;
- emitir sinais de observabilidade para registro, resolucao, erro e descarte;
- preservar informacoes necessarias para auditoria.

O Service Registry nao deve executar regras de negocio. Ele gerencia contratos e ciclo de vida de services.

## 8. Dependency Injection

Dependency Injection e a pratica arquitetural pela qual consumidores recebem dependencias por contrato em vez de instancia-las diretamente. No Veltryx OS, essa pratica e usada para aplicar inversao de dependencia, reduzir acoplamento e permitir substituicao controlada por modulo, plugin ou escopo.

Principios:

- consumidores dependem de tokens e contratos, nao de implementacoes;
- providers implementam ou satisfazem contratos;
- resolucao ocorre por contexto, scope, visibilidade e compatibilidade;
- substituicoes devem ser declaradas e auditaveis;
- falhas devem ser explicitas;
- dependencias circulares obrigatorias devem ser rejeitadas;
- dependencias opcionais podem produzir comportamento degradado documentado.

O modelo de DI deve permitir que Runtime, Builder e modulos sejam construidos sobre contratos publicos. Isso preserva Clean Architecture e separacao entre dominio e infraestrutura.

## 9. Service Tokens

Service Tokens sao identificadores de contrato usados para registrar e resolver services.

Requisitos:

- tokens publicos devem ser estaveis;
- tokens devem identificar contratos, nao classes concretas;
- tokens devem possuir ownership claro;
- tokens publicos devem ser documentados;
- tokens internos nao devem ser usados fora de seu limite de encapsulamento;
- tokens devem permitir versionamento quando o contrato evoluir;
- tokens devem ser resolvidos dentro de um scope e Execution Context quando aplicavel.

Categorias:

- Core Tokens: contratos fundacionais publicados pelo Platform Core.
- Module Tokens: contratos publicos publicados por modulos.
- Plugin Tokens: contratos adicionados por plugins.
- Internal Tokens: contratos privados de um subsistema, modulo ou plugin.
- Override Tokens: tokens publicos que permitem substituicao por politica explicita.

Um token publico e parte da compatibilidade da plataforma ou do modulo que o publica.

## 10. Providers

Providers declaram como um service e fornecido ao Service Registry.

Tipos conceituais:

- Singleton: um service compartilhado dentro de um escopo definido. Nao significa necessariamente global; o limite e determinado pelo scope.
- Transient: um service novo ou logicamente independente a cada resolucao.
- Scoped: um service associado a um contexto especifico, como tenant, workspace ou request.

Responsabilidades de um provider:

- declarar token fornecido;
- declarar contrato atendido;
- declarar scope;
- declarar visibilidade publica ou interna;
- declarar dependencias necessarias;
- declarar compatibilidade;
- declarar politica de inicializacao;
- declarar politica de descarte;
- declarar se aceita override ou substituicao;
- declarar origem e ownership.

Providers de modulos devem ser registrados durante o lifecycle do modulo. Providers de plugins seguem as mesmas regras, com validacao adicional de permissao e compatibilidade.

## 11. Service Resolution

Service Resolution e o processo conceitual de transformar uma solicitacao por token em um service consumivel.

Algoritmo conceitual:

1. Receber token solicitado e contexto de execucao.
2. Validar se o consumidor tem permissao para solicitar o token.
3. Consultar providers registrados para o token.
4. Filtrar providers por visibilidade, scope, tenant, workspace, modulo e compatibilidade.
5. Aplicar regras de override e prioridade autorizadas.
6. Validar dependencias obrigatorias do provider selecionado.
7. Detectar ciclos de resolucao obrigatorios.
8. Inicializar ou reutilizar service conforme scope.
9. Registrar evento de resolucao quando relevante para observabilidade ou auditoria.
10. Retornar service ou falha explicita.

Comportamento esperado:

- token inexistente deve gerar falha explicita;
- multiplos providers sem regra de precedencia devem gerar conflito;
- provider incompativel deve ser ignorado ou rejeitado conforme obrigatoriedade;
- resolucao nao deve vazar providers internos;
- resolucao deve respeitar Execution Context;
- falhas nao devem comprometer o Service Registry.

## 12. Overrides

Override e a substituicao declarada de um provider por outro provider para o mesmo token ou ponto de extensao. Overrides permitem customizacao controlada por Core, modulo, plugin, tenant ou workspace.

Regras:

- override deve ser permitido pelo contrato original;
- override deve declarar origem, escopo, prioridade e compatibilidade;
- override nao pode reduzir requisitos de seguranca;
- override nao pode expor contrato interno como publico sem decisao explicita;
- override deve ser auditavel;
- conflitos entre overrides devem ser resolvidos por politica deterministica;
- override por tenant ou workspace deve respeitar isolamento logico;
- consumidores devem continuar dependendo do mesmo token, nao do provider substituto.

Substituicao:

- substituicao e a aplicacao efetiva de um override durante resolucao;
- substituicao pode ocorrer por escopo global, tenant, workspace ou request quando permitido;
- substituicao nao deve alterar semanticamente o contrato publico;
- mudanca semantica incompativel exige novo token ou nova versao de contrato.

Modulos podem substituir services apenas quando o ponto de extensao for publico e permitir override. Plugins seguem a mesma regra, com verificacao adicional de permissao e compatibilidade.

## 13. Lazy Loading

Lazy Loading e a estrategia pela qual um service registrado nao precisa ser inicializado ate ser solicitado por um consumidor autorizado.

Objetivos:

- reduzir custo de bootstrap;
- evitar inicializacao de capacidades nao usadas;
- permitir modulos habilitados parcialmente por escopo;
- adiar conexoes ou adaptadores ate necessidade real;
- melhorar resiliencia em capacidades opcionais.

Regras:

- lazy loading nao deve ocultar erros de manifesto, compatibilidade ou permissao;
- providers lazy ainda devem estar Registered antes de resolucao;
- primeira resolucao deve validar dependencias e contexto;
- falha na primeira inicializacao deve ser observavel;
- services lazy devem seguir as mesmas regras de scope e descarte;
- dependencias obrigatorias de bootstrap nao devem depender de lazy loading para mascarar falhas fundacionais.

Runtime pode acionar lazy loading ao resolver services necessarios para metadados, providers ou componentes em tempo de execucao. Builder pode acionar lazy loading ao solicitar services administrativos ou de validacao, sempre por contratos publicos.

## 14. Scopes

Scopes definem vida util, compartilhamento e fronteira de visibilidade de services.

### Global

Global e o escopo compartilhado por toda a plataforma. Deve ser usado apenas para services sem estado contextual sensivel ou cujo estado seja seguro para todos os tenants e workspaces.

### Tenant

Tenant e o escopo associado a um tenant. Services nesse escopo podem carregar configuracoes, permissoes ou recursos especificos do tenant. Eles nao devem compartilhar estado sensivel entre tenants.

### Workspace

Workspace e o escopo associado a um workspace dentro de um tenant. Ele permite customizacoes ou providers diferentes por area operacional, desde que respeite tenancy e autorizacao.

### Request

Request e o escopo associado a uma requisicao, comando, job ou operacao rastreavel. Ele deve preservar requestId, correlationId e Execution Context.

### Transient

Transient e o escopo em que cada resolucao produz uma instancia ou capacidade logicamente independente. Deve ser usado quando reuso nao e desejavel ou quando estado local nao pode ser compartilhado.

Regras gerais:

- scopes mais especificos nao devem vazar para scopes mais amplos;
- services globais nao devem depender de services request-scoped;
- services tenant-scoped nao devem ser reutilizados entre tenants;
- descarte deve seguir a vida util do scope;
- scopes devem ser considerados durante override e lazy loading.

## 15. Public Contracts

Public Contracts sao os contratos de service suportados para consumo fora do limite que os publica.

Regras:

- devem ser identificados por tokens publicos;
- devem possuir ownership;
- devem declarar versao e compatibilidade;
- devem declarar semantica esperada;
- devem declarar permissoes requeridas quando aplicavel;
- devem declarar scopes suportados;
- devem ser consumidos por Runtime, Builder, modulos e plugins apenas por token;
- mudancas incompativeis devem seguir politica de versionamento.

Runtime consome public contracts para resolver providers necessarios a APIs automaticas, metadados, componentes, menus, permissoes e comportamento dinamico. Builder consome public contracts para validacao, preview, administracao e edicao governada de metadados.

## 16. Internal Contracts

Internal Contracts sao contratos privados de um Core subsystem, modulo ou plugin. Eles nao fazem parte da superficie suportada da plataforma.

Regras:

- nao devem ser expostos no SDK publico;
- nao devem ser consumidos por outros modulos;
- nao devem ser usados pelo Builder ou Runtime como dependencia direta;
- podem mudar sem politica publica de compatibilidade;
- nao podem ser alvo de override externo;
- devem permanecer encapsulados dentro do owner;
- promocao para contrato publico exige decisao explicita e versionamento.

Essa distincao impede acoplamento acidental e preserva liberdade de evolucao interna.

## 17. Seguranca

O Service Registry e o mecanismo de DI devem aplicar seguranca por padrao.

Requisitos:

- negar resolucao de tokens nao autorizados;
- validar consumidor, owner, scope e Execution Context;
- impedir acesso a providers internos;
- impedir override nao autorizado;
- auditar registro, override, substituicao, falha de resolucao e descarte de services criticos;
- impedir que plugins elevem privilegios por substituicao de providers;
- impedir que services em scopes amplos retenham dados de scopes restritos;
- proteger configuracoes sensiveis usadas por providers;
- preservar tenant, workspace, requestId e correlationId quando aplicavel;
- classificar tokens e providers por sensibilidade quando necessario.

Modulos e plugins devem receber apenas os services para os quais possuem contrato e permissao. Dependencia declarada em manifesto nao concede automaticamente acesso a service sensivel.

## 18. Observabilidade

O Service Registry deve ser observavel desde o bootstrap.

Sinais obrigatorios:

- registro de providers;
- conflitos de tokens;
- falhas de resolucao;
- latencia de resolucao;
- inicializacao de services;
- descarte de services;
- aplicacao de overrides;
- uso de lazy loading;
- uso por scope;
- falhas de autorizacao;
- degradacao de services opcionais.

Logs, metricas e traces devem usar requestId e correlationId quando disponiveis. Observabilidade nao deve expor dados sensiveis, segredos, configuracoes privadas ou estado interno de modules.

## 19. Diagramas

### Resolucao

```text
Consumer
   |
   v
Token + Execution Context
   |
   v
Service Registry
   |
   v
Filter by Visibility / Scope / Permission
   |
   v
Apply Overrides
   |
   v
Resolve Dependencies
   |
   v
Initialize or Reuse Service
   |
   v
Return Public Contract
```

### Registro

```text
Module Manifest
      |
      v
Module Loader
      |
      v
Provider Declaration
      |
      v
Validate Token / Scope / Visibility
      |
      v
Service Registry
      |
      v
Registered Provider
```

### Ciclo de Vida

```text
Registered
    |
    v
Resolved
    |
    v
Initialized
    |
    v
Running
    |
    v
Disposed
```

### Override

```text
Base Provider
     |
     v
Override Policy
     |
     v
Plugin or Module Provider
     |
     v
Scope + Permission Check
     |
     v
Substituted Provider
```

## 20. Glossario

- Service: capacidade consumivel por contrato.
- Provider: declaracao que associa token, contrato, scope e estrategia de fornecimento.
- Registry: catalogo governado de entradas registradas por identificador e contrato.
- Token: identificador estavel de um contrato de service.
- Factory: estrategia conceitual para criar, obter ou adaptar um service.
- Scope: fronteira de vida util, compartilhamento e visibilidade de um service.
- Resolver: mecanismo conceitual que transforma token e contexto em service resolvido.
- Override: substituicao declarada e autorizada de provider.
- Substituicao: aplicacao efetiva de um override durante resolucao.
- Lazy Loading: inicializacao adiada de service ate sua primeira resolucao autorizada.
- Public Contract: contrato suportado para consumo fora do owner.
- Internal Contract: contrato privado de um owner sem garantia publica.
- Owner: Core subsystem, modulo ou plugin responsavel por um token ou provider.
- Consumer: Runtime, Builder, modulo, plugin ou subsistema autorizado que solicita um service.

## 21. Decisoes Arquiteturais

- Service Registry pertence ao Platform Core.
- Dependency Injection e definida como modelo arquitetural de inversao de dependencia, sem escolha de IoC Container.
- Services sao consumidos por tokens e contratos, nao por implementacoes concretas.
- Providers declaram como services sao disponibilizados, incluindo scope, visibilidade, compatibilidade e ownership.
- Tokens publicos fazem parte da superficie de compatibilidade.
- Runtime e Builder consomem services apenas por contratos publicos.
- Modulos registram services por manifesto e pelo Module Loader.
- Plugins podem adicionar services e aplicar overrides apenas por pontos de extensao autorizados.
- Overrides devem ser declarados, versionaveis, auditaveis e restritos por permissao e scope.
- Lazy loading e permitido, mas nao pode ocultar falhas de manifesto, compatibilidade ou seguranca.
- Scopes oficiais sao Global, Tenant, Workspace, Request e Transient.
- Services globais nao devem depender de services request-scoped.
- Services tenant-scoped nao devem ser compartilhados entre tenants.
- Internal Contracts nao podem ser consumidos como API publica.
- Resolucao deve falhar explicitamente em token ausente, conflito sem precedencia, permissao negada ou dependencia obrigatoria invalida.
- Descarte de services deve respeitar scope e ser observavel em services criticos.
- Esta RFC nao define implementacao, decorators, framework ou container especifico.

## 22. Riscos

- Politicas de override mal definidas podem causar comportamento imprevisivel.
- Tokens publicos sem governanca podem gerar acoplamento permanente.
- Scopes incorretos podem vazar estado entre tenants, workspaces ou requests.
- Lazy loading pode atrasar deteccao de falhas se validacoes iniciais forem insuficientes.
- Substituicoes por plugins podem aumentar superficie de ataque.
- Observabilidade excessiva pode vazar informacoes sensiveis se nao houver classificacao.
- Dependencias circulares podem surgir em services transversais sem modelagem cuidadosa.

## 23. RFCs Dependentes

As seguintes RFCs dependerao desta:

- RFC de SDK e contratos publicos.
- RFC de Runtime Engine.
- RFC de Builder Visual.
- RFC de Module Manifest.
- RFC de Plugin System e Marketplace.
- RFC de Auth e Authorization.
- RFC de Tenancy e Execution Context.
- RFC de Observabilidade.
- RFC de Event Bus.
- RFC de Component Registry.
- RFC de Metadata Engine.
- RFC de Configuration System.
