# RFC-0005: Metadata Engine do Veltryx OS

Status: Frozen  
Version: 1.0  
Type: RFC arquitetural  
Owner: Architecture Team  
Reviewers: Architecture Review  
Created: 2026-08-03  
Last Updated: 2026-08-03  
Depends On: RFC-0001, RFC-0002, RFC-0003, RFC-0004  
Impacts: RFC-0006, RFC-0007, RFC-0099  
Supersedes: None
## Indice

1. [Visao Geral](#1-visao-geral)
2. [Objetivos](#2-objetivos)
3. [Nao Objetivos](#3-nao-objetivos)
4. [Conceitos](#4-conceitos)
5. [Arquitetura Geral](#5-arquitetura-geral)
6. [Metadata Model](#6-metadata-model)
7. [Entity Definition](#7-entity-definition)
8. [Field Definition](#8-field-definition)
9. [Relations](#9-relations)
10. [Validation Engine](#10-validation-engine)
11. [Metadata Registry](#11-metadata-registry)
12. [Metadata Resolver](#12-metadata-resolver)
13. [Metadata Inheritance](#13-metadata-inheritance)
14. [Metadata Overrides](#14-metadata-overrides)
15. [Metadata Versioning](#15-metadata-versioning)
16. [Metadata Lifecycle](#16-metadata-lifecycle)
17. [Namespaces](#17-namespaces)
18. [Metadata Cache](#18-metadata-cache)
19. [Metadata Events](#19-metadata-events)
20. [Seguranca](#20-seguranca)
21. [Observabilidade](#21-observabilidade)
22. [Diagramas](#22-diagramas)
23. [Glossario](#23-glossario)
24. [Decisoes Arquiteturais](#24-decisoes-arquiteturais)
25. [Riscos](#25-riscos)
26. [Duvidas](#26-duvidas)
27. [RFCs Dependentes](#27-rfcs-dependentes)

## 1. Visao Geral

Metadata Engine e o subsistema do Veltryx OS responsavel por validar, registrar, resolver, versionar, publicar e disponibilizar metadados declarativos para o Runtime Engine, Builder, modulos, plugins e demais consumidores autorizados.

Metadata e a fonte declarativa de entidades, campos, relacoes, validacoes, recursos, permissoes, menus, paginas, formularios, listas, views, eventos, dashboards, settings e extensoes. A plataforma deve tratar metadata como contrato arquitetural, nao como configuracao informal.

O Builder produz metadata. Modulos e plugins declaram metadata por manifesto. A Metadata Engine valida, normaliza, registra e resolve metadata. O Runtime consome metadata resolvida para gerar comportamento dinamico. A Application materializa esse comportamento em interfaces, APIs, menus, permissoes e experiencias operacionais.

Esta RFC nao define sintaxe, parser, banco, ORM ou implementacao. Ela define o modelo conceitual e o comportamento esperado para que o Runtime Engine possa ser especificado e implementado posteriormente sem novas decisoes fundacionais sobre metadata.

## 2. Objetivos

Os objetivos desta RFC sao:

- definir o conceito de metadata no Veltryx OS;
- definir entidades, campos, relacoes, validacoes, constraints, schemas, resources, namespaces, registries, resolvers, overrides e extensions;
- definir o modelo declarativo minimo consumivel pelo Runtime;
- estabelecer como metadata e organizada, validada, registrada, resolvida, herdada, sobrescrita, versionada, publicada e consumida;
- definir responsabilidades da Metadata Registry e do Metadata Resolver;
- definir lifecycle de metadata;
- definir isolamento por namespace e escopos de override;
- definir eventos emitidos pela Metadata Engine;
- definir requisitos de seguranca e observabilidade;
- preservar compatibilidade com Platform Core, Module System, Service Registry, Runtime e Builder.

## 3. Nao Objetivos

Esta RFC nao define nem autoriza:

- banco de dados;
- tabelas;
- JSON;
- YAML;
- parser;
- ORM;
- codigo;
- formato fisico de arquivos;
- APIs HTTP concretas;
- implementacao da Metadata Engine;
- implementacao do Runtime Engine;
- implementacao do Builder;
- linguagem de workflow;
- engine de regras complexas;
- estrategia fisica de cache;
- sintaxe de migrations.

O documento e exclusivamente arquitetural.

## 4. Conceitos

### Metadata

Metadata e a descricao declarativa de capacidades, estruturas, comportamentos e superficies de experiencia do Veltryx OS. Ela descreve o que a plataforma deve conhecer, validar, expor ou renderizar, sem prescrever uma implementacao concreta.

### Entity

Entity e a representacao declarativa de um conceito ou recurso de dominio, incluindo identidade, campos, relacoes, acoes, permissoes, validacoes e comportamento esperado.

### Field

Field e uma unidade declarativa de informacao pertencente a uma entity, form, list, view ou outro modelo. Ele descreve tipo conceitual, obrigatoriedade, visibilidade, validacoes, formatacao e comportamento.

### Relation

Relation e a associacao declarativa entre entities ou resources. Ela descreve cardinalidade, direcao conceitual, ownership e regras de composicao ou agregacao.

### Validation

Validation e a verificacao declarativa ou contratual aplicada a metadata, dados, campos, relacoes, permissoes ou estruturas derivadas.

### Constraint

Constraint e uma regra restritiva que deve permanecer verdadeira para que uma metadata seja valida. Constraints podem expressar unicidade, obrigatoriedade, compatibilidade, limite, formato, escopo, relacao ou seguranca.

### Schema

Schema e a definicao estrutural que descreve a forma conceitual esperada de uma metadata. Ele permite validacao, compatibilidade, versionamento e interpretacao segura.

### Resource

Resource e qualquer objeto protegivel, enderecavel ou consumivel pela plataforma, como entity, action, route, menu, component, dashboard, setting, API conceitual ou provider.

### Namespace

Namespace e a fronteira logica que organiza metadata por owner, como Core, modulo, plugin, tenant ou workspace. Namespaces evitam colisao de identificadores e tornam ownership explicito.

### Registry

Registry e o catalogo governado de metadata validada, registrada e disponivel para resolucao. A Metadata Registry e a fonte de leitura para metadata registrada.

### Resolver

Resolver e o mecanismo conceitual que calcula a versao efetiva da metadata para um contexto, aplicando namespace, heranca, overrides, extensions, versao, permissao e escopo.

### Override

Override e uma sobrescrita declarada e governada de metadata existente. Ele altera a metadata efetiva para um escopo permitido sem modificar necessariamente a definicao base.

### Extension

Extension e uma adicao declarativa a uma metadata existente, como novo campo, acao, item de menu, componente, evento ou validacao, desde que exista ponto de extensao permitido.

## 5. Arquitetura Geral

```text
Builder
   |
   v
Metadata
   |
   v
Metadata Registry
   |
   v
Metadata Resolver
   |
   v
Runtime
   |
   v
Application
```

Fluxo conceitual:

- Builder produz ou altera metadata por experiencia visual governada.
- Modulos e plugins declaram metadata por manifesto.
- Metadata Engine valida e normaliza metadata antes do registro.
- Metadata Registry armazena metadata validada e versionada.
- Metadata Resolver calcula a metadata efetiva por contexto.
- Runtime consome metadata resolvida, nao metadata bruta.
- Application materializa interfaces, APIs, menus, permissoes e comportamento dinamico.

Arquitetura com Core:

```text
                 Platform Core
                       |
        +--------------+--------------+
        |                             |
 Metadata Engine              Service Registry
        |
 +------+-------+
 |              |
Registry     Resolver
 |              |
 +------+-------+
        |
      Runtime
        |
   Application
```

## 6. Metadata Model

O Metadata Model define as categorias conceituais de metadata suportadas pela plataforma.

- Entity: recurso ou conceito de dominio descrito declarativamente.
- Field: atributo ou unidade de informacao associada a entity, form, list ou view.
- Relation: associacao entre entities ou resources.
- Action: operacao permitida sobre resource, entity ou fluxo.
- Menu: estrutura de navegacao exibida pelo Runtime.
- Page: superficie de interface composta por layouts, views, forms, lists ou componentes.
- Form: estrutura declarativa para entrada, edicao ou visualizacao de dados.
- List: estrutura declarativa para colecoes, tabelas, cards ou agrupamentos.
- View: representacao configurada de leitura, filtro, ordenacao ou apresentacao.
- Permission: regra declarativa de acesso a resource, action, field, view ou operacao.
- Workflow: declaracao de fluxo simples ou ponto de integracao com workflow futuro.
- Event: fato publicado ou consumido por modulo, plugin, Core ou Runtime.
- Dashboard: composicao declarativa de indicadores, widgets, filtros e fontes.
- Settings: configuracoes declarativas globais, por tenant, workspace, modulo, plugin ou usuario.

O modelo deve ser extensivel, mas toda extensao deve possuir namespace, owner, versao e validacao.

## 7. Entity Definition

Uma entity define a estrutura conceitual de um recurso de dominio.

Responsabilidades:

- declarar identidade unica dentro de um namespace;
- declarar nome tecnico e nome legivel;
- declarar ownership por modulo, plugin ou Core;
- declarar fields;
- declarar relations;
- declarar actions permitidas;
- declarar permissions associadas;
- declarar validacoes e constraints aplicaveis;
- declarar eventos relacionados quando aplicavel;
- declarar comportamento de exibicao basico para Runtime;
- declarar compatibilidade e versao;
- indicar se aceita extension ou override;
- preservar rastreabilidade de origem.

Uma entity nao deve conter implementacao de persistencia, ORM, query concreta ou logica imperativa de negocio. Regras complexas devem ser expostas por providers ou servicos de aplicacao via contratos publicos.

## 8. Field Definition

Um field descreve uma unidade de informacao em metadata.

Responsabilidades:

- tipos: declarar tipo conceitual do valor, sem acoplar a tipo fisico de banco ou linguagem;
- nullable: indicar se ausencia de valor e permitida;
- default: declarar valor padrao ou estrategia conceitual de default;
- validation: associar validacoes aplicaveis ao campo;
- computed: indicar se o valor e derivado de outra informacao ou provider;
- readonly: indicar se o campo pode ser exibido mas nao editado;
- hidden: indicar se o campo deve permanecer oculto para determinados contextos;
- required: indicar obrigatoriedade em criacao, atualizacao ou fluxo especifico;
- mask: declarar mascara de entrada ou exibicao quando aplicavel;
- formatter: declarar formatacao de apresentacao sem alterar o valor semantico.

Regras:

- field deve pertencer a uma entity, form, view ou estrutura declarativa equivalente;
- field deve possuir identificador estavel dentro de seu owner;
- validacoes de field devem ser avaliadas antes de publicacao;
- fields sensiveis devem declarar classificacao ou restricao;
- fields computed devem declarar dependencia conceitual;
- hidden nao substitui autorizacao;
- formatter nao deve alterar regra de dominio.

## 9. Relations

Relations descrevem associacoes entre entities ou resources.

Tipos:

- One-to-One: uma instancia conceitual de uma entity relaciona-se com no maximo uma instancia de outra entity.
- One-to-Many: uma instancia conceitual de uma entity relaciona-se com multiplas instancias de outra entity.
- Many-to-Many: multiplas instancias de uma entity relacionam-se com multiplas instancias de outra entity.
- Composition: relacao forte em que o ciclo de vida do elemento composto depende do owner conceitual.
- Aggregation: relacao fraca em que entities associadas preservam ciclo de vida independente.

Regras:

- relation deve declarar origem, destino, cardinalidade e ownership conceitual;
- relation entre namespaces deve depender de contrato publico;
- relation nao deve expor storage interno de outro modulo;
- ciclos de relation devem ser validados quanto a navegacao, carregamento e exibicao;
- composition deve explicitar impacto em ciclo de vida;
- aggregation nao deve assumir ownership de dados externos.

## 10. Validation Engine

Validation Engine e a parte da Metadata Engine responsavel por verificar consistencia, integridade, compatibilidade e seguranca dos metadados.

Elementos:

- validators: unidades conceituais que avaliam uma condicao de validade;
- constraints: regras restritivas aplicadas a metadata;
- pipeline: sequencia governada de validacoes;
- hooks: pontos de extensao controlados para validacoes adicionais.

Pipeline conceitual:

1. Validar estrutura contra schema.
2. Validar namespace e ownership.
3. Validar identificadores e unicidade.
4. Validar referencias internas.
5. Validar referencias externas por contratos publicos.
6. Validar permissoes e resources.
7. Validar relations e ciclos.
8. Validar compatibilidade de versao.
9. Validar overrides e extensions.
10. Produzir resultado validado ou falha explicita.

Hooks:

- devem ser registrados por contrato publico;
- nao devem modificar metadata silenciosamente;
- devem ser deterministicos;
- devem ser observaveis;
- nao devem burlar autorizacao ou tenancy.

## 11. Metadata Registry

Metadata Registry e o catalogo governado de metadata validada, versionada e registrada.

Responsabilidades:

- registrar metadata validada;
- armazenar owner, namespace, versao, status e origem;
- diferenciar metadata bruta, validada, publicada e ativa;
- expor metadata registrada para resolucao;
- manter historico necessario para auditoria;
- impedir registro de metadata conflitante;
- associar metadata a modulo, plugin, tenant ou workspace;
- disponibilizar indices conceituais por namespace, resource, entity e versao;
- invalidar cache quando metadata relevante mudar;
- emitir eventos de ciclo de vida.

O Metadata Registry nao interpreta UI final, nao executa workflow e nao aplica regra imperativa de negocio. Ele cataloga metadata confiavel para consumo pelo Resolver e pelo Runtime.

## 12. Metadata Resolver

Metadata Resolver calcula a metadata efetiva para um Execution Context.

Algoritmo conceitual:

1. Receber solicitacao com resource, namespace, versao desejada e Execution Context.
2. Validar permissao de leitura da metadata.
3. Localizar metadata base no Metadata Registry.
4. Resolver dependencias de namespace, module e plugin.
5. Selecionar versao compativel.
6. Aplicar heranca declarada.
7. Aplicar extensions permitidas.
8. Aplicar overrides por ordem de escopo.
9. Validar resultado efetivo.
10. Consultar ou atualizar cache quando aplicavel.
11. Retornar metadata resolvida ou falha explicita.

Ordem conceitual de escopo para resultado efetivo:

```text
Base
  |
Global Override
  |
Module Extension
  |
Plugin Extension
  |
Tenant Override
  |
Workspace Override
  |
Runtime Context
```

O Resolver nao deve consumir manifestos brutos como fonte final. Ele deve operar sobre metadata registrada e validada.

## 13. Metadata Inheritance

Metadata Inheritance permite criar definicoes derivadas de uma base sem duplicar toda a declaracao.

Conceitos:

- base: metadata original usada como ponto de partida;
- override: ajuste governado de uma propriedade ou subestrutura;
- merge: combinacao de metadata base com extensoes compativeis;
- replace: substituicao explicita de uma subestrutura permitida.

Regras:

- heranca deve ser declarada explicitamente;
- base deve estar registrada e compativel;
- merge deve preservar identificadores estaveis;
- replace deve ser permitido pelo owner da metadata base;
- conflitos devem falhar por padrao;
- heranca nao deve permitir acesso a metadata privada de outro namespace;
- resultado herdado deve passar por validacao.

Heranca e um mecanismo de composicao declarativa, nao de heranca de codigo.

## 14. Metadata Overrides

Overrides alteram a metadata efetiva em escopos permitidos sem modificar necessariamente a definicao base.

Escopos:

- Global: sobrescrita aplicavel a toda a plataforma.
- Tenant: sobrescrita aplicavel a um tenant.
- Workspace: sobrescrita aplicavel a um workspace.
- Module: sobrescrita ou extensao declarada por modulo autorizado.
- Plugin: sobrescrita ou extensao declarada por plugin autorizado.

Regras:

- override deve declarar alvo, owner, escopo, motivo e compatibilidade;
- override deve ser permitido pela metadata alvo;
- override nao pode reduzir requisitos de seguranca;
- override nao pode expor field, resource ou action sem permissao;
- override deve ser versionado e auditavel;
- conflitos entre overrides devem ser resolvidos por politica deterministica;
- override de tenant nao deve afetar outro tenant;
- override de workspace nao deve afetar outro workspace;
- plugins so podem aplicar overrides em pontos de extensao declarados.

Overrides devem ser aplicados pelo Metadata Resolver, nao diretamente pelo Builder ou Runtime.

## 15. Metadata Versioning

Metadata Versioning governa evolucao, compatibilidade, migracao, breaking changes e rollback.

Compatibilidade:

- metadata publica deve declarar versao;
- consumers devem poder solicitar versoes compativeis;
- Runtime deve consumir metadata resolvida compativel com sua versao;
- modulos e plugins devem declarar compatibilidade com metadata que consomem.

Migracao:

- mudancas de metadata podem exigir migracao conceitual;
- migrations de dados permanecem sob RFC futura de dados;
- migracao de metadata deve preservar rastreabilidade;
- falha de migracao deve impedir publicacao ou ativacao.

Breaking changes:

- remocao de entity, field, relation, action, permission, route, component, event ou resource publico deve ser tratada como potencial breaking change;
- alteracao de significado de field, relation, permission ou action deve ser tratada como breaking change;
- mudancas incompativeis exigem nova versao;
- consumidores afetados devem ser identificados antes de publicacao.

Rollback:

- rollback deve retornar metadata para versao previamente registrada e valida;
- rollback nao deve assumir reversao automatica de dados;
- rollback deve invalidar cache relevante;
- rollback deve emitir evento e gerar trilha de auditoria.

## 16. Metadata Lifecycle

O lifecycle de metadata define estados obrigatorios:

- Draft: metadata em edicao, ainda nao validada para registro.
- Validated: metadata passou pelas validacoes exigidas.
- Registered: metadata foi registrada no Metadata Registry.
- Published: metadata foi publicada para consumo por escopo permitido.
- Active: metadata e a versao efetiva em uso pelo Runtime para determinado contexto.
- Deprecated: metadata continua disponivel, mas foi marcada para substituicao futura.
- Archived: metadata foi removida do uso ativo e preservada apenas para historico, auditoria ou compatibilidade limitada.

Regras:

- Draft nao deve ser consumido pelo Runtime;
- Validated nao implica Published;
- Registered nao implica Active;
- Published deve possuir escopo e versao;
- Active deve ser resultado de resolucao;
- Deprecated deve preservar compatibilidade conforme politica declarada;
- Archived nao deve ser selecionado pelo Resolver sem solicitacao explicita autorizada.

## 17. Namespaces

Namespaces isolam metadata por owner e reduzem colisao entre modulos, plugins, tenants e Core.

Regras:

- toda metadata deve pertencer a um namespace;
- namespace deve possuir owner explicito;
- identificadores devem ser unicos dentro do namespace;
- referencias entre namespaces devem usar contratos publicos;
- metadata privada nao deve ser resolvida por outro namespace;
- plugins devem declarar namespace proprio ou extensao autorizada de namespace existente;
- conflitos de namespace devem impedir registro;
- namespace deve participar de auditoria, eventos e versionamento.

Namespaces sao fronteiras de organizacao e governanca; nao substituem Authorization nem Tenancy.

## 18. Metadata Cache

Metadata Cache otimiza leitura e resolucao de metadata sem substituir o Metadata Registry como fonte de verdade.

Responsabilidades:

- armazenar resultados resolvidos quando permitido;
- armazenar indices de leitura frequente;
- reduzir custo de validacao repetida;
- respeitar tenant, workspace, locale, timezone, versao e permissao;
- invalidar entradas quando metadata, override, extension, modulo ou plugin mudar;
- preservar consistencia frente a publicacao, depreciacao, rollback e archive;
- expor sinais de observabilidade sobre hit, miss, invalidacao e erro.

Regras:

- cache nao pode servir metadata sem validacao previa;
- cache nao pode vazar metadata entre tenants ou workspaces;
- cache nao pode ocultar mudancas de permissao;
- falha de cache nao deve corromper metadata registrada.

## 19. Metadata Events

Metadata Engine deve emitir eventos para tornar mudancas rastreaveis e permitir integracao de baixo acoplamento.

Eventos conceituais:

- MetadataDraftCreated;
- MetadataValidated;
- MetadataValidationFailed;
- MetadataRegistered;
- MetadataPublished;
- MetadataActivated;
- MetadataDeprecated;
- MetadataArchived;
- MetadataRollbackRequested;
- MetadataRolledBack;
- MetadataOverrideApplied;
- MetadataExtensionApplied;
- MetadataCacheInvalidated;
- MetadataConflictDetected.

Regras:

- eventos devem preservar tenant, workspace, requestId e correlationId quando aplicavel;
- eventos publicos devem possuir contrato versionado;
- eventos internos podem ser usados para coordenacao da Engine;
- eventos nao devem expor metadata sensivel sem autorizacao;
- eventos de falha devem conter motivo e origem em nivel apropriado para diagnostico.

## 20. Seguranca

Seguranca da Metadata Engine deve seguir negar por padrao.

Requisitos:

- validar permissao para criar, editar, registrar, publicar, depreciar, arquivar e resolver metadata;
- impedir acesso a metadata privada de outro namespace;
- respeitar tenant e workspace em leitura, override e publicacao;
- impedir override que reduza seguranca;
- classificar fields, resources e settings sensiveis;
- auditar alteracoes relevantes;
- preservar origem de Builder, modulo, plugin ou Core;
- validar references externas por contratos publicos;
- impedir que metadata gere actions, menus, pages ou APIs sem permissao declarada;
- garantir que Runtime consuma metadata ja validada e autorizada.

Hidden, readonly e formatter sao propriedades de experiencia e nao substituem autorizacao.

## 21. Observabilidade

Metadata Engine deve ser observavel desde sua inicializacao.

Sinais obrigatorios:

- validacoes executadas e falhas;
- registros criados ou rejeitados;
- tempo de resolucao;
- conflitos detectados;
- overrides aplicados;
- extensions aplicadas;
- invalidacoes de cache;
- publicacoes, ativacoes, depreciacoes, archives e rollbacks;
- consumo pelo Runtime;
- falhas de permissao;
- impacto por namespace, modulo, plugin, tenant e workspace.

Logs, metricas e traces devem usar requestId e correlationId quando disponiveis. Observabilidade nao deve vazar metadata sensivel, valores de fields sensiveis, secrets ou detalhes internos de modulos.

## 22. Diagramas

### Pipeline

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
      Registry
          |
          v
      Resolver
          |
          v
       Runtime
          |
          v
     Application
```

### Registry

```text
Validated Metadata
        |
        v
+-------------------+
| Metadata Registry |
+---------+---------+
          |
 +--------+--------+
 |        |        |
Entity  View   Permission
Index   Index     Index
 |        |        |
 +--------+--------+
          |
   Versioned Records
```

### Resolver

```text
Request + Execution Context
          |
          v
Find Base Metadata
          |
          v
Apply Inheritance
          |
          v
Apply Extensions
          |
          v
Apply Overrides
          |
          v
Validate Effective Metadata
          |
          v
Return Resolved Metadata
```

### Lifecycle

```text
Draft
  |
  v
Validated
  |
  v
Registered
  |
  v
Published
  |
  v
Active
  |
  +-------> Deprecated
              |
              v
           Archived
```

### Overrides

```text
Base Metadata
     |
     v
Global Override
     |
     v
Module Extension
     |
     v
Plugin Extension
     |
     v
Tenant Override
     |
     v
Workspace Override
     |
     v
Effective Metadata
```

### Inheritance

```text
Base Definition
      |
      v
Inherited Definition
      |
      +---- Merge allowed fields
      |
      +---- Replace allowed blocks
      |
      v
Validated Result
```

## 23. Glossario

- Metadata: descricao declarativa de estruturas, recursos, interfaces, permissoes e comportamento.
- Entity: representacao declarativa de um recurso ou conceito de dominio.
- Field: unidade declarativa de informacao em uma entity ou estrutura de UI.
- Relation: associacao declarativa entre entities ou resources.
- Validation: verificacao de conformidade, integridade, seguranca ou compatibilidade.
- Constraint: regra restritiva que deve permanecer verdadeira.
- Schema: definicao estrutural esperada de uma metadata.
- Resource: objeto protegivel, enderecavel ou consumivel pela plataforma.
- Namespace: fronteira logica de ownership e isolamento de metadata.
- Registry: catalogo governado de metadata validada.
- Resolver: mecanismo que calcula metadata efetiva para um contexto.
- Override: sobrescrita declarada de metadata em escopo permitido.
- Extension: adicao declarativa a um ponto de extensao existente.
- Effective Metadata: metadata final apos heranca, extensions, overrides e validacao.
- Metadata Cache: cache de metadata registrada ou resolvida.

## 24. Decisoes Arquiteturais

- Metadata Engine pertence ao Platform Core como subsistema fundacional.
- Builder produz metadata, mas nao publica diretamente comportamento ativo.
- Runtime consome metadata resolvida, nao metadata bruta.
- Modulos e plugins declaram metadata por manifesto e passam pelo Module Loader.
- Metadata Registry e fonte governada de metadata validada e versionada.
- Metadata Resolver calcula metadata efetiva por Execution Context.
- Toda metadata deve possuir namespace e owner.
- Overrides devem ser aplicados pelo Resolver, nao pelo Runtime diretamente.
- Extensions exigem ponto de extensao declarado.
- Hidden, readonly e formatter nao substituem Authorization.
- Metadata publica deve ser versionavel.
- Breaking changes de metadata publica exigem nova versao.
- Cache nao e fonte de verdade e nao pode vazar entre tenants ou workspaces.
- Eventos de metadata devem ser emitidos para lifecycle, falhas, overrides, extensions e cache.
- Esta RFC nao define JSON, YAML, parser, ORM, banco ou implementacao.

## 25. Riscos

- Modelo declarativo amplo pode aumentar complexidade de validacao.
- Overrides concorrentes podem gerar resultados dificeis de diagnosticar.
- Heranca excessiva pode reduzir previsibilidade da metadata efetiva.
- Cache incorreto pode servir metadata obsoleta ou fora de escopo.
- Versionamento fraco pode quebrar Runtime, Builder ou modulos consumidores.
- Metadata sensivel pode vazar por logs, eventos ou interfaces administrativas.
- Ambiguidade entre extension e override pode gerar acoplamento entre modulos.
- Workflow declarado prematuramente pode ultrapassar o escopo fundacional.

## 26. Duvidas

- Qual sera a politica formal de compatibilidade semantica para metadata publica?
- Como sera definida a precedencia final entre overrides de modulo e plugin?
- Quais tipos conceituais de field serao suportados inicialmente?
- Qual sera o limite entre validation declarativa e regra de dominio por provider?
- Como migrations de metadata serao coordenadas com migrations de dados?
- Como o Builder apresentara impacto de alteracoes antes de publicacao?
- Quais eventos de metadata serao publicos e quais serao internos?
- Qual granularidade de cache sera exigida por tenant, workspace e permission?

## 27. RFCs Dependentes

As seguintes RFCs dependerao desta:

- RFC de Runtime Engine.
- RFC de Builder Visual.
- RFC de Metadata Schema.
- RFC de Metadata Storage.
- RFC de Metadata Validation.
- RFC de Metadata Versioning e Migration.
- RFC de Component Registry.
- RFC de Permission Model.
- RFC de API Generation.
- RFC de Menu e Navigation Model.
- RFC de Dashboard Model.
- RFC de Workflow Model.
- RFC de SDK de Metadata.
