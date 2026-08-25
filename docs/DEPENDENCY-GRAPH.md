# Dependency Graph do Veltryx OS

## Objetivo

Produzir o mapa oficial de dependencias arquiteturais do Veltryx OS.

Este documento consolida dependencias entre RFCs, modulos, servicos, engines, builders e aplicacoes. Ele deve ser usado para validar se novas RFCs, ADRs, technical specifications e implementacoes respeitam Clean Architecture, SOLID e Dependency Rule.

Este documento e exclusivamente arquitetural. Ele nao define codigo, framework, API concreta, banco de dados ou implementacao.

## Fontes

Documentos considerados:

- RFC-0001 Foundation.
- RFC-0002 Platform Core.
- RFC-0003 Module System & Module Loader.
- RFC-0004 Service Registry & Dependency Injection.
- RFC-0005 Metadata Engine.
- RFC-0006 Runtime Engine.
- RFC-0007 UI Composition System.
- RFC-0099 Architecture Governance.
- Architecture Index.
- Implementation Roadmap.

## Regra Geral de Dependencia

Dependencias devem fluir de camadas externas para contratos de camadas internas, nunca para implementacoes internas.

```text
Applications
    |
    v
Builder
    |
    v
Runtime
    |
    v
Metadata
    |
    v
Platform Core
    |
    v
Infrastructure Contracts
```

Regras obrigatorias:

- Core nunca depende de modulos de negocio.
- Runtime nao depende do Builder.
- Builder depende do Runtime apenas por contratos publicos.
- Modules dependem do Core apenas por contratos publicos.
- Plugins nao acessam implementacao interna do Core.
- Metadata Engine nao depende de componentes visuais concretos.
- UI Composition nao executa regra de dominio.
- Services sao consumidos por tokens e contratos, nao por implementacoes concretas.
- Registries catalogam contratos; nao executam regra de negocio.
- Infrastructure implementa contratos, mas nao define politica de dominio.

## Dependencias entre RFCs

### Grafo Aprovado

```text
RFC-0001 Foundation
        |
        v
RFC-0002 Platform Core
        |
        v
RFC-0003 Module System & Module Loader
        |
        v
RFC-0004 Service Registry & Dependency Injection
        |
        v
RFC-0005 Metadata Engine
        |
        v
RFC-0006 Runtime Engine
        |
        v
RFC-0007 UI Composition System

RFC-0099 Architecture Governance
        |
        +---- governs ----> RFC-0001..RFC-0007
        +---- governs ----> Future RFCs
        +---- governs ----> ADRs
        +---- governs ----> Technical Specifications
```

### RFCs Futuras Planejadas

```text
RFC-0007 UI Composition System
        |
        v
RFC-0008 Builder
        |
        v
RFC-0009 Application Model

RFC-0002 Platform Core
        |
        +----> RFC-0010 Permission Engine
        +----> RFC-0011 Authentication
        +----> RFC-0016 Event System
        +----> RFC-0017 Observability

RFC-0005 Metadata Engine
        |
        +----> RFC-0013 API Engine
        +----> RFC-0014 Query Engine
        +----> RFC-0015 Data Layer

RFC-0016 Event System
        |
        +----> RFC-0012 Workflow Engine

RFC-0017 Observability
        |
        +----> RFC-0018 Deployment
```

## Dependencias entre Modulos

Modulos de negocio dependem de contratos publicos, nunca de outros modulos por implementacao direta.

```text
                 Platform Core Contracts
                           |
                           v
                    Module Registry
                           |
        +------------------+------------------+
        |                  |                  |
     Module A           Module B           Module C
        |                  |                  |
        +-------- public contracts -----------+
                           |
                           v
                    Runtime Consumption
```

Dependencias permitidas entre modulos:

- Dependencia obrigatoria declarada em manifesto.
- Dependencia opcional declarada em manifesto.
- Consumo de Public Contracts.
- Consumo de Public Events.
- Consumo de metadata publica versionada.
- Consumo de providers publicos por Service Tokens.
- Extensao por pontos de extensao declarados.

Dependencias proibidas entre modulos:

- Acesso direto a storage interno de outro modulo.
- Acesso direto a service interno de outro modulo.
- Uso de Internal Contracts como API publica.
- Dependencia circular obrigatoria.
- Compartilhamento de estado interno.
- Override sem ponto de extensao declarado.
- Comunicacao fora de contratos, eventos ou APIs autorizadas.

## Dependencias entre Servicos

Services sao resolvidos por Service Registry e Dependency Injection arquitetural.

```text
Consumer
   |
   v
Service Token
   |
   v
Service Registry
   |
   v
Provider Contract
   |
   v
Resolved Service
```

Dependencias permitidas:

- Consumer depende de token publico.
- Provider satisfaz contrato publico ou interno conforme visibilidade.
- Service pode depender de outro service por token.
- Override pode substituir provider quando contrato permitir.
- Scope controla vida util e visibilidade.

Dependencias proibidas:

- Consumer instancia service diretamente.
- Consumer depende de classe concreta.
- Provider interno e consumido por modulo externo.
- Service global depende de service request-scoped.
- Service tenant-scoped vaza estado entre tenants.
- Override reduz requisitos de seguranca.
- Dependencia circular obrigatoria entre services.

## Dependencias entre Engines

Engines transformam contratos declarativos em resultados governados. Nenhuma engine deve assumir responsabilidade de outra.

```text
Metadata Engine
      |
      v
Runtime Engine
      |
      v
UI Composition System
      |
      v
Renderer Contract
      |
      v
Application
```

### Metadata Engine

Depende de:

- Platform Core contracts.
- Module Registry.
- Service Registry quando validadores ou providers forem resolvidos por contrato.
- Event Bus por contrato.
- Configuration por contrato.

Nao depende de:

- Runtime implementation.
- Builder implementation.
- Component implementation.
- Application implementation.

### Runtime Engine

Depende de:

- Platform Core contracts.
- Metadata Registry.
- Metadata Resolver.
- Service Registry.
- Component Registry.
- Module Registry.
- Authorization contracts.
- Event Bus contracts.
- Configuration contracts.
- Observability contracts.

Nao depende de:

- Builder implementation.
- Module internal implementation.
- Plugin internal implementation.
- Renderer concreto.
- Infrastructure concreta.

### UI Composition System

Depende de:

- Metadata resolvida.
- Runtime Context.
- Component Registry.
- Service Registry por contratos para actions.
- Permission Resolution.
- Theme e Design Token contracts.

Nao depende de:

- React.
- CSS.
- Tailwind.
- DOM.
- Implementacao interna de componentes.
- Regras de dominio.

## Dependencias entre Builders

Builder e produtor governado de metadata. Ele nao controla Runtime, Module Loader ou Component Registry.

```text
Builder
   |
   v
Metadata Draft
   |
   v
Metadata Validation
   |
   v
Metadata Registry
   |
   v
Runtime
```

Dependencias permitidas:

- Builder depende de contratos publicos do Core.
- Builder depende de Metadata Engine para validacao.
- Builder depende de Component Registry para descoberta de componentes disponiveis.
- Builder depende de Runtime apenas por contratos publicos de preview ou validacao.
- Builder consome Service Registry apenas por tokens publicos.

Dependencias proibidas:

- Builder instancia componentes diretamente.
- Builder publica comportamento ativo sem Metadata Engine.
- Builder controla carregamento de modulos.
- Builder acessa implementacao interna do Runtime.
- Builder grava metadata ativa sem validacao.

## Dependencias entre Aplicacoes

Applications sao superficies executaveis ou experiencias finais. Elas consomem contratos do Runtime e nao devem conhecer detalhes internos de engines.

```text
Application
     |
     v
Runtime Contract
     |
     v
Resolved Metadata
     |
     v
Resolved Components
     |
     v
Services by Contract
```

Dependencias permitidas:

- Application depende de Runtime Contract.
- Application consome arvore abstrata, menus, APIs conceituais e layouts resolvidos.
- Application propaga requestId e correlationId.
- Application respeita tenant, workspace, user e permissions.

Dependencias proibidas:

- Application acessa Metadata Registry diretamente sem Runtime.
- Application resolve providers internos.
- Application acessa storage de modulo.
- Application ignora Permission Resolution.
- Application modifica metadata publicada diretamente.

## Diagramas ASCII

### Kernel

```text
                         Kernel
                           |
                 +---------+---------+
                 | Platform Core     |
                 +---------+---------+
                           |
    +----------+-----------+-----------+----------+
    |          |           |           |          |
   Auth   Authorization  Tenancy   Configuration Observability
    |          |           |           |          |
    +----------+-----------+-----------+----------+
                           |
    +----------+-----------+-----------+----------+
    |          |           |           |          |
 Service    Module       Event      Metadata   Runtime
 Registry   Registry      Bus       Contracts  Contracts
```

### Metadata

```text
Builder / Module / Plugin
          |
          v
      Metadata
          |
          v
      Validation
          |
          v
 Metadata Registry
          |
          v
 Metadata Resolver
          |
          v
      Runtime
```

### Runtime

```text
Client / Application
          |
          v
      Runtime
          |
   +------+------+------+------+
   |      |      |      |      |
Metadata Service Component Module
Resolver Registry Registry Registry
   |      |      |      |
   +------+------+------+
          |
          v
   Execution Tree
```

### UI

```text
Resolved Metadata
        |
        v
Component Reference
        |
        v
Component Registry
        |
        v
Composition Engine
        |
        v
Abstract UI Tree
        |
        v
Renderer Contract
```

### Builder

```text
Builder
   |
   +----> Core Public Contracts
   |
   +----> Metadata Validation
   |
   +----> Component Discovery
   |
   +----> Runtime Preview Contract
   |
   v
Metadata Draft
```

### Applications

```text
Applications
     |
     v
Runtime Contract
     |
     v
Resolved Menus / APIs / Layouts / Components
     |
     v
User Experience
```

## Matriz de Dependencia

Legenda:

- `D`: depende de.
- `G`: governa.
- `-`: nao depende diretamente.
- `P`: dependencia planejada ou futura.

| RFC | RFC-0001 | RFC-0002 | RFC-0003 | RFC-0004 | RFC-0005 | RFC-0006 | RFC-0007 | RFC-0099 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RFC-0001 Foundation | - | - | - | - | - | - | - | - |
| RFC-0002 Platform Core | D | - | - | - | - | - | - | - |
| RFC-0003 Module System | D | D | - | - | - | - | - | - |
| RFC-0004 Service Registry | D | D | D | - | - | - | - | - |
| RFC-0005 Metadata Engine | D | D | D | D | - | - | - | - |
| RFC-0006 Runtime Engine | D | D | D | D | D | - | - | - |
| RFC-0007 UI Composition | D | D | D | D | D | D | - | - |
| RFC-0099 Governance | D | D | D | D | D | D | D | - |

### Matriz Simplificada

| RFC | RFC A | RFC B | RFC C |
| --- | --- | --- | --- |
| RFC A | - | Permitida se A for camada externa consumindo contrato publico de B | Proibida se criar ciclo ou acessar implementacao interna |
| RFC B | Nao deve depender de A se A for camada externa | - | Permitida por contrato publico |
| RFC C | Nao deve depender de A/B sem contrato publico | Nao deve criar ciclo com B | - |

## Matriz por Camada

| Camada | Pode depender de | Nao pode depender de |
| --- | --- | --- |
| Applications | Runtime contracts, APIs publicas, UI output resolvido | Metadata Registry direto, services internos, storage de modulo |
| Builder | Core contracts, Metadata Engine, Component Registry, Runtime preview contract | Runtime implementation, Module Loader control, componentes concretos |
| UI Composition | Runtime Context, metadata resolvida, Component Registry, Service Registry por tokens | React, CSS, DOM, dominio, implementacao interna de componentes |
| Runtime Engine | Core contracts, Metadata Resolver, registries, Authorization, Event Bus | Builder, modulo interno, plugin interno, renderer concreto |
| Metadata Engine | Core contracts, Module Registry, Service Registry por contrato | Runtime implementation, Builder implementation, componente visual concreto |
| Service Registry | Core contracts, Module Loader declarations | Regras de dominio, consumers concretos |
| Module System | Platform Core contracts, manifestos, registries | Runtime implementation, Builder implementation, storage interno de modulo |
| Platform Core | Infrastructure contracts | Business Modules, plugin implementations, dominio especifico |
| Infrastructure | Contracts definidos pela arquitetura | Regras de dominio, politica arquitetural |

## Validacao de Ciclos

Resultado da validacao conceitual:

- Nao existem ciclos no grafo aprovado de RFCs `RFC-0001` a `RFC-0007`.
- `RFC-0099` governa o processo, mas nao cria dependencia operacional circular.
- Dependencias planejadas devem permanecer bloqueadas ate suas RFCs existirem e serem aprovadas.
- Dependencias entre modulos devem rejeitar ciclos obrigatorios.
- Dependencias entre services devem rejeitar ciclos obrigatorios de resolucao.
- Dependencias entre engines devem fluir de Runtime para contratos de Metadata, nao para implementacao de Metadata.
- Builder nao participa do caminho de execucao obrigatorio do Runtime.

## Dependencias Proibidas

As seguintes dependencias sao proibidas:

- Platform Core -> Business Module.
- Platform Core -> Plugin implementation.
- Runtime -> Builder implementation.
- Runtime -> Module internal implementation.
- Runtime -> Metadata raw manifest.
- Metadata Engine -> Runtime implementation.
- Metadata Engine -> UI concrete component.
- Builder -> Component concrete implementation.
- Builder -> Module Loader control.
- Application -> Metadata Registry direto.
- Application -> Service provider interno.
- Module -> Module internal storage de outro modulo.
- Plugin -> Core internal implementation.
- Service -> concrete provider de outro owner sem token publico.
- Infrastructure -> Domain policy.

## Conformidade Arquitetural

### Clean Architecture

O grafo preserva separacao entre dominio, aplicacao, interfaces e infraestrutura. Dependencias externas devem apontar para contratos internos, e infraestrutura deve implementar contratos sem definir politica.

### SOLID

O grafo reforca:

- Single Responsibility: cada engine e registry possui responsabilidade delimitada.
- Open/Closed: extensoes ocorrem por contratos, slots, providers, events e metadata.
- Liskov Substitution: overrides devem preservar contrato publico.
- Interface Segregation: consumidores usam contratos publicos especificos.
- Dependency Inversion: consumidores dependem de tokens e contratos, nao implementacoes.

### Dependency Rule

Dependencias devem seguir a direcao:

```text
External Details -> Public Contracts -> Core Policies
```

Qualquer inversao dessa direcao exige RFC ou ADR conforme impacto.

## Decisao

O grafo arquitetural aprovado para o estado atual nao contem ciclos conhecidos e nao exige dependencias proibidas.

Novas RFCs, ADRs e IMPs devem atualizar este documento quando:

- criarem novo subsistema;
- alterarem dependencias entre engines;
- criarem contrato publico novo;
- alterarem lifecycle;
- introduzirem breaking change;
- alterarem roadmap;
- criarem dependencia entre modulos, services, builders ou applications.

