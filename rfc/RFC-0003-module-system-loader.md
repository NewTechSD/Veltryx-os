# RFC-0003: Module System & Module Loader do Veltryx OS

Status: Frozen  
Version: 1.0  
Type: RFC arquitetural  
Owner: Architecture Team  
Reviewers: Architecture Review  
Created: 2026-08-03  
Last Updated: 2026-08-03  
Depends On: RFC-0001, RFC-0002  
Impacts: RFC-0004, RFC-0005, RFC-0006, RFC-0007, RFC-0099  
Supersedes: None
## Indice

1. [Visao Geral](#1-visao-geral)
2. [Objetivos](#2-objetivos)
3. [Nao Objetivos](#3-nao-objetivos)
4. [Conceitos](#4-conceitos)
5. [Arquitetura Geral](#5-arquitetura-geral)
6. [Module Lifecycle](#6-module-lifecycle)
7. [Module Manifest](#7-module-manifest)
8. [Module Discovery](#8-module-discovery)
9. [Dependency Resolution](#9-dependency-resolution)
10. [Module Loader](#10-module-loader)
11. [Public Contracts](#11-public-contracts)
12. [Internal Contracts](#12-internal-contracts)
13. [Event Registration](#13-event-registration)
14. [Component Registration](#14-component-registration)
15. [Metadata Registration](#15-metadata-registration)
16. [Seguranca](#16-seguranca)
17. [Versionamento](#17-versionamento)
18. [Diagramas](#18-diagramas)
19. [Glossario](#19-glossario)
20. [Decisoes Arquiteturais](#20-decisoes-arquiteturais)
21. [RFCs Dependentes](#21-rfcs-dependentes)
22. [Resumo Executivo](#22-resumo-executivo)
23. [Riscos](#23-riscos)
24. [Duvidas Arquiteturais](#24-duvidas-arquiteturais)
25. [Impacto sobre Proximas RFCs](#25-impacto-sobre-proximas-rfcs)

## 1. Visao Geral

O Module System e o modelo arquitetural que permite ao Veltryx OS descobrir, validar, instalar, resolver, carregar, inicializar, habilitar, executar, desabilitar, descarregar, atualizar e remover modulos e plugins de forma governada.

O Module Loader e o subsistema do Platform Core responsavel por coordenar o ciclo de vida operacional dos modulos. Ele nao executa regras de negocio, nao interpreta metadados como Runtime Engine e nao edita metadados como Builder. Sua responsabilidade e garantir que apenas modulos validos, compativeis, autorizados e corretamente resolvidos fiquem disponiveis para os demais subsistemas.

Esta RFC aprofunda as decisoes da RFC-0001 e da RFC-0002. O Core continua independente de modulos de negocio. O Runtime continua responsavel pela interpretacao de metadados em tempo de execucao. Modulos continuam sendo unidades independentes de capacidade de negocio ou extensao.

## 2. Objetivos

Os objetivos desta RFC sao:

- definir o conceito arquitetural de Module, Plugin, Package, Extension e Manifest;
- estabelecer diferenca entre modulos e plugins;
- definir o ciclo de vida completo de modulos;
- especificar descoberta, validacao, instalacao, resolucao, carregamento, inicializacao, atualizacao, desligamento e desinstalacao;
- definir como dependencias sao declaradas, resolvidas e rejeitadas;
- definir como modulos registram servicos, eventos, componentes e metadados;
- definir como modulos interagem com Platform Core e Runtime;
- definir contratos publicos e contratos internos;
- preservar isolamento, seguranca, observabilidade e compatibilidade;
- fornecer base suficiente para uma futura implementacao do Module Loader sem novas decisoes arquiteturais fundacionais.

## 3. Nao Objetivos

Esta RFC nao define nem autoriza:

- codigo de implementacao;
- sintaxe concreta de manifesto;
- formato JSON, YAML ou qualquer serializacao especifica;
- APIs HTTP concretas;
- schema de banco de dados;
- implementacao em NestJS, Prisma, Next.js ou qualquer framework;
- Docker, CI/CD ou infraestrutura de deploy;
- marketplace funcional;
- instalacao remota de pacotes;
- estrategia comercial de distribuicao de plugins;
- execucao de codigo nao confiavel em sandbox;
- mecanismo fisico de armazenamento de artefatos;
- motor avancado de workflow.

Esta RFC define contratos, responsabilidades, fronteiras e comportamento esperado.

## 4. Conceitos

### Module

Um Module e uma unidade independente, instalavel e versionavel de capacidade de negocio ou capacidade funcional da plataforma. Um modulo pode declarar metadados, rotas, permissoes, eventos, providers, componentes, migrations e seeds.

Um modulo deve possuir manifesto e ciclo de vida explicito. Ele pode representar dominios como CRM, Financeiro, Estoque, RH ou Projetos, mas tambem pode representar uma capacidade transversal que nao pertence ao Core.

### Plugin

Um Plugin e uma extensao instalavel que adiciona, substitui ou especializa capacidades da plataforma por pontos de extensao formais. Um plugin pode conter um ou mais modulos, componentes, conectores, providers, metadados ou integracoes.

Plugins devem declarar permissoes, compatibilidade e dependencias. Plugins nao acessam implementacoes internas do Core e nao podem comprometer isolamento entre tenants.

### Diferenca entre Module e Plugin

Module e a unidade arquitetural de capacidade reconhecida pelo Module Registry. Plugin e o mecanismo de extensao e distribuicao que pode entregar modulos ou capacidades adicionais.

Todo modulo instalavel deve ser registrado como Module. Nem todo plugin precisa representar um dominio de negocio completo; ele pode apenas adicionar componentes, providers ou integracoes. Quando um plugin entrega capacidade executavel de negocio, essa capacidade deve ser modelada como um modulo ou como extensao declarada de um modulo existente.

### Package

Package e o artefato distribuivel que transporta um modulo, plugin ou conjunto de extensoes. Ele e uma unidade de entrega, nao necessariamente uma unidade de dominio.

Um package pode conter manifestos, metadados, componentes, providers, migrations, seeds e documentacao. Esta RFC nao define formato fisico de package.

### Extension

Extension e uma contribuicao limitada a um ponto de extensao existente. Ela pode adicionar uma acao, componente, provider, evento, metadado, rota ou integracao a um modulo ou ao Runtime, desde que exista contrato publico permitindo essa extensao.

Extensions nao devem alterar implementacoes internas do Core, Runtime ou de outros modulos.

### Manifest

Manifest e o contrato declarativo minimo que descreve um modulo ou plugin. Ele permite que a plataforma avalie identidade, versao, compatibilidade, dependencias, permissoes, metadados, eventos, componentes, providers e impacto operacional antes de qualquer execucao.

## 5. Arquitetura Geral

O Module System opera como uma camada governada entre Platform Core, Module Loader, Module Registry, Runtime e modulos.

```text
                      Veltryx OS
                          |
                  +-------v-------+
                  | Platform Core |
                  +-------+-------+
                          |
        +-----------------+-----------------+
        |                                   |
 +------v-------+                   +-------v------+
 |Module Loader |                   |Module Registry|
 +------+-------+                   +-------+------+
        |                                   |
        +-----------------+-----------------+
                          |
                  +-------v-------+
                  |    Modules    |
                  +-------+-------+
                          |
                   public contracts
                          |
                  +-------v-------+
                  |    Runtime    |
                  +---------------+
```

Responsabilidades de alto nivel:

- Platform Core fornece contratos, registries, contexto, seguranca, configuracao, eventos e observabilidade.
- Module Loader coordena descoberta, validacao, resolucao, carregamento, inicializacao e encerramento de modulos.
- Module Registry mantem estado, capacidades declaradas e historico operacional dos modulos.
- Modules fornecem capacidades declaradas por manifesto.
- Runtime consome metadados, componentes, rotas, permissoes, providers e eventos por contratos publicos.

## 6. Module Lifecycle

O ciclo de vida de modulo define estados obrigatorios e transicoes governadas. Nenhum modulo deve ser executado apenas por estar presente em um package, diretorio, registro ou repositorio.

Estados:

- Discovered: o modulo foi encontrado por um mecanismo de descoberta, mas ainda nao foi validado.
- Validated: o manifesto e a estrutura conceitual do modulo foram verificados quanto a identidade, completude, compatibilidade basica e integridade.
- Installed: o modulo foi registrado como disponivel para a plataforma, mas ainda nao necessariamente resolvido ou carregado.
- Resolved: dependencias, conflitos, compatibilidade, permissoes e capacidades foram resolvidos em relacao ao ambiente corrente.
- Loaded: os contratos declarados pelo modulo foram carregados pelo Module Loader e disponibilizados para registries apropriados.
- Initialized: o modulo concluiu sua preparacao conceitual para uso, incluindo registro de providers, eventos, metadados e componentes.
- Enabled: o modulo foi habilitado em um escopo valido, como plataforma, tenant ou workspace.
- Running: o modulo participa de operacoes ativas por meio do Runtime, eventos, providers ou interfaces publicas.
- Disabled: o modulo permanece instalado, mas suas capacidades nao estao disponiveis no escopo desabilitado.
- Unloaded: o modulo foi removido da memoria operacional ou do conjunto de contratos ativos, preservando seu registro instalado quando aplicavel.
- Uninstalled: o modulo foi removido do registro operacional da plataforma, respeitando auditoria, dependencias, dados, retencao e politicas de reversao.

Regras:

- transicoes devem ser explicitas e observaveis;
- estados devem ser registrados no Module Registry;
- falhas devem preservar integridade do Core;
- operacoes destrutivas devem avaliar dependencias reversas;
- habilitacao pode ser diferente por tenant ou workspace;
- desabilitar nao equivale a desinstalar;
- descarregar nao equivale a remover dados persistidos.

## 7. Module Manifest

O Module Manifest e o contrato conceitual usado pelo Module System para conhecer um modulo antes de executa-lo. Esta RFC nao define sintaxe, arquivo, serializacao ou mecanismo fisico do manifesto.

Informacoes minimas:

- id: identificador unico, estavel e imutavel do modulo no ecossistema.
- name: nome legivel usado em interfaces administrativas, logs e documentacao.
- version: versao publicada do modulo para compatibilidade, upgrades e auditoria.
- description: descricao da finalidade e das capacidades do modulo.
- author: responsavel, fornecedor ou mantenedor do modulo.
- compatibility: requisitos de compatibilidade com Platform Core, Runtime, contratos publicos e outros modulos.
- dependencies: dependencias obrigatorias, opcionais e faixas de versao aceitas.
- permissions: recursos, acoes, escopos e permissoes declaradas ou requeridas.
- events: eventos publicados, eventos consumidos e contratos publicos de evento.
- metadata: entidades, campos, layouts, menus, validacoes, recursos e modelos declarativos.
- providers: servicos ou capacidades publicados por contrato.
- routes: rotas de navegacao, superficies de UI ou endpoints conceituais autorizados.
- components: componentes visuais publicos, privados ou substituiveis por contrato.
- migrations: evolucoes de persistencia ou estrutura de dados associadas ao modulo.
- seeds: dados iniciais necessarios para ativacao, configuracao minima ou demonstracao.

Responsabilidades do manifesto:

- permitir descoberta sem execucao de logica de negocio;
- permitir validacao antes de instalacao;
- permitir resolucao de dependencias;
- declarar impacto em seguranca e permissao;
- declarar capacidades expostas ao Runtime;
- declarar contratos publicos e privados;
- permitir auditoria, versionamento, atualizacao e desinstalacao;
- permitir que plugins sejam avaliados sem acesso a implementacoes internas.

## 8. Module Discovery

Module Discovery e o processo pelo qual a plataforma identifica modulos ou packages candidatos a instalacao ou atualizacao.

Etapas conceituais:

- Descoberta: localiza packages ou definicoes de modulos em fontes autorizadas.
- Registro inicial: cria uma entrada candidata no Module Registry.
- Validacao: verifica manifesto, identidade, integridade, compatibilidade basica e assinatura quando aplicavel.
- Cache: armazena resultado de descoberta e validacao para reduzir custo operacional e permitir rastreabilidade.
- Atualizacao: compara versoes descobertas com versoes instaladas e sinaliza upgrades, downgrades ou conflitos.

Regras:

- descoberta nao implica instalacao;
- instalacao nao implica habilitacao;
- descoberta deve ser auditavel;
- fontes de descoberta devem ser autorizadas;
- modulos duplicados por id devem ser tratados como conflito;
- cache de discovery nao deve substituir validacao no momento de instalacao ou atualizacao;
- modulos nao confiaveis ou incompletos devem permanecer fora do estado Installed.

## 9. Dependency Resolution

Dependency Resolution e o processo de avaliar se um modulo pode ser instalado, carregado, atualizado ou removido considerando suas dependencias e os contratos disponiveis.

Tipos de dependencias:

- Obrigatorias: sem elas o modulo nao pode atingir estado Resolved.
- Opcionais: habilitam capacidades adicionais quando presentes, sem impedir funcionamento minimo.
- De contrato: exigem uma interface publica, provider, evento, componente ou metadado especifico.
- De versao: exigem faixas de compatibilidade com Core, Runtime ou outros modulos.
- De escopo: exigem disponibilidade em plataforma, tenant ou workspace.

Conflitos:

- dois modulos nao podem declarar o mesmo identificador;
- dois providers publicos nao podem ocupar o mesmo contrato sem regra explicita de substituicao;
- componentes substituiveis devem obedecer precedencia declarada;
- permissoes conflitantes devem falhar por padrao;
- metadados conflitantes devem ser rejeitados ou exigir resolucao explicita por RFC futura.

Versoes incompativeis:

- impedem resolucao quando a dependencia for obrigatoria;
- podem degradar capacidades quando a dependencia for opcional;
- devem ser relatadas com motivo, origem e impacto;
- nao devem ser ignoradas silenciosamente.

Ciclos de dependencia:

- ciclos entre dependencias obrigatorias devem ser rejeitados;
- ciclos entre dependencias opcionais devem ser resolvidos por capacidades degradadas ou rejeicao explicita;
- ciclos indiretos devem ser detectados;
- a ordem final de carregamento deve ser deterministica.

Comportamento esperado:

- falha de resolucao impede Loaded;
- falha em dependencia obrigatoria impede Enabled;
- remocao de modulo deve avaliar dependencias reversas;
- atualizacao deve reavaliar todo o grafo afetado.

## 10. Module Loader

O Module Loader e o coordenador operacional do lifecycle de modulos. Ele pertence ao Platform Core e atua sobre manifestos, registries, contratos publicos e estados declarados.

Responsabilidades:

- participar do bootstrap da plataforma;
- consultar Module Registry;
- ordenar carregamento por grafo de dependencias;
- carregar contratos declarados;
- inicializar registros de servicos, eventos, componentes e metadados;
- aplicar tratamento de falhas;
- coordenar rollback conceitual quando uma transicao falhar;
- desligar modulos de forma ordenada;
- descarregar contratos ativos;
- preservar observabilidade e auditoria.

Ordem de carregamento:

- Core deve estar em estado compativel com carregamento;
- configuracoes base devem estar resolvidas;
- modulos devem estar Validated ou Installed;
- dependencias obrigatorias devem ser resolvidas antes dos dependentes;
- providers publicos devem ser registrados antes de consumidores;
- metadados devem ser registrados antes de uso pelo Runtime;
- eventos consumidos devem ser validados contra contratos publicados.

Inicializacao:

- inicializacao deve registrar capacidades, nao executar fluxo de negocio;
- cada modulo deve receber apenas contratos publicos autorizados;
- o Execution Context deve existir para operacoes que dependam de tenant, user ou workspace;
- falha de inicializacao deve impedir Enabled.

Tratamento de falhas:

- falhas devem ser classificadas como validacao, dependencia, compatibilidade, seguranca, inicializacao, runtime ou desligamento;
- falhas devem ser observaveis;
- falhas parciais nao devem comprometer o Core;
- dependentes nao devem ser habilitados se uma dependencia obrigatoria falhar.

Rollback:

- transicoes incompletas devem ser revertidas conceitualmente para o ultimo estado consistente;
- registros criados durante uma inicializacao falha devem ser removidos ou marcados como invalidos;
- eventos de rollback devem ser auditaveis;
- rollback nao deve apagar dados sem politica explicita.

## 11. Public Contracts

Public Contracts sao interfaces e declaracoes suportadas para consumo por Core, Runtime, Builder, modulos, plugins e SDKs.

Categorias:

- Servicos publicos: providers expostos por um modulo para consumo autorizado.
- APIs publicas: capacidades acessiveis por contrato documentado.
- Eventos publicos: fatos publicados com contrato estavel e versionavel.
- Metadados publicos: entidades, recursos, menus, layouts ou configuracoes declaradas para uso pelo Runtime ou por outros modulos.
- Componentes publicos: componentes registrados para composicao ou substituicao controlada.

Regras:

- contratos publicos devem ser documentados no manifesto ou em referencia associada;
- contratos publicos devem possuir identificador estavel;
- alteracoes incompativeis exigem versionamento;
- consumo deve respeitar permissao, tenancy e escopo;
- contratos publicos nao devem expor implementacao interna;
- contratos publicos devem ser observaveis quando usados em fluxo critico.

## 12. Internal Contracts

Internal Contracts sao contratos privados de um modulo. Eles podem organizar a implementacao interna futura do modulo, mas nao constituem superficie suportada para outros modulos.

Diretrizes:

- servicos privados nao devem ser registrados como providers publicos;
- detalhes internos nao devem ser consumidos por Runtime, Builder ou outros modulos;
- nomes internos nao devem ser usados como contrato de integracao;
- encapsulamento deve ser preservado entre modulos;
- isolamento deve impedir acesso lateral a storage, cache, configuracao ou estado interno de outro modulo;
- promover contrato interno para publico exige decisao explicita e versionamento.

Internal Contracts ajudam a organizar modulos, mas nao fazem parte da API publica do ecossistema.

## 13. Event Registration

Modulos podem declarar eventos publicados e eventos consumidos. O registro ocorre por manifesto e pelo Event Bus do Platform Core.

Eventos publicados:

- representam fatos relevantes do dominio ou da operacao do modulo;
- podem ser publicos ou internos;
- devem possuir identificador estavel;
- devem declarar versao de contrato;
- devem declarar escopo e classificacao quando aplicavel.

Eventos consumidos:

- devem referenciar contratos publicados;
- devem declarar dependencia obrigatoria ou opcional;
- devem respeitar permissoes e contexto;
- nao devem depender de detalhes internos do produtor.

Contratos:

- eventos publicos devem ter contratos tratados como imutaveis dentro de uma versao;
- evolucao incompativel deve criar nova versao;
- consumidores devem declarar versoes suportadas;
- eventos devem preservar correlationId e tenant quando aplicavel.

Event Registration nao define tecnologia de transporte, broker ou serializacao.

## 14. Component Registration

Component Registration e o processo pelo qual modulos tornam componentes conhecidos pelo Component Registry.

Tipos:

- Componentes publicos: podem ser resolvidos pelo Runtime ou por outros modulos dentro de contratos autorizados.
- Componentes privados: usados apenas dentro do modulo que os declara.
- Componentes substituiveis: podem ser substituidos por plugins quando o contrato permitir.
- Componentes especializados: adaptacoes para contexto, tenant, workspace, permissao ou capacidade especifica.

Regras:

- todo componente registrado deve possuir identificador unico;
- Runtime resolve componentes pelo Component Registry;
- Builder nunca instancia componentes diretamente;
- Builder referencia componentes por identificador e contrato;
- plugins podem substituir componentes apenas por ponto de extensao declarado;
- conflitos de componentes devem ser detectados antes de Running;
- componentes nao devem conter regras de dominio que pertencem a providers ou servicos de aplicacao.

## 15. Metadata Registration

Metadata Registration e o processo pelo qual modulos declaram modelos consumiveis pela Metadata Engine e pelo Runtime.

Categorias:

- entidades: recursos de dominio representados declarativamente;
- campos: atributos, tipos conceituais, validacoes e propriedades exibiveis;
- menus: pontos de navegacao e organizacao de experiencia;
- permissoes: recursos, acoes, escopos e politicas associadas;
- layouts: composicao visual declarativa para telas e componentes;
- workflows: declaracoes simples de fluxo quando suportadas por RFC futura;
- rotas: superficies de navegacao ou acesso;
- relacionamentos: associacoes entre entidades e recursos;
- validacoes: regras declarativas aplicaveis a entrada, exibicao ou persistencia.

Regras:

- metadados de modulo devem passar pelo pipeline definido na RFC-0001;
- registro nao implica ativacao imediata;
- conflitos devem impedir resolucao ou exigir decisao explicita;
- overrides por tenant ou workspace devem respeitar regras de tenancy;
- metadados publicos devem ser versionaveis;
- Runtime consome metadados registrados, nao manifestos brutos;
- Builder produz metadados, mas nao controla carregamento de modulos.

## 16. Seguranca

Seguranca do Module System deve seguir o principio negar por padrao.

Requisitos:

- modulos devem declarar permissoes requeridas;
- modulos devem declarar recursos protegidos que introduzem;
- acesso ao Core deve ocorrer apenas por interfaces publicas autorizadas;
- acesso ao Runtime deve ocorrer por contratos publicos;
- plugins e modulos nao devem acessar implementacoes internas do Core;
- habilitacao por tenant ou workspace deve respeitar Authorization e Execution Context;
- discovery, install, update, disable e uninstall devem ser auditaveis;
- eventos e providers nao devem burlar autorizacao;
- dados e configuracoes sensiveis devem ser protegidos;
- falhas de seguranca devem impedir transicoes para Enabled ou Running.

Isolamento:

- modulos nao devem compartilhar estado interno diretamente;
- comunicacao deve ocorrer por eventos, providers publicos, APIs autorizadas ou metadados registrados;
- contexto operacional deve ser propagado por contrato;
- dependencia entre modulos nao concede automaticamente acesso a todos os recursos do modulo dependido.

## 17. Versionamento

Versionamento garante evolucao controlada de modulos, plugins e contratos publicos.

Compatibilidade:

- modulos devem declarar compatibilidade com Platform Core e Runtime;
- dependencias devem declarar faixas de versao suportadas;
- contratos publicos devem possuir politica de compatibilidade;
- atualizacoes devem reavaliar o grafo de dependencias.

Breaking changes:

- mudancas incompativeis em contratos publicos exigem nova versao;
- remocao de evento, provider, permissao, componente ou metadado publico deve ser tratada como potencial breaking change;
- mudancas de comportamento observavel devem ser documentadas;
- consumidores afetados devem ser identificados antes da atualizacao.

Migracao:

- migrations devem ser declaradas no manifesto quando aplicavel;
- execucao de migrations deve ser governada por RFC futura de dados;
- falha de migration deve impedir Running;
- rollback de migration exige politica explicita e nao deve ser assumido.

Depreciacao:

- contratos publicos podem ser marcados como depreciados;
- depreciacao deve manter compatibilidade por periodo definido;
- consumidores devem conseguir identificar contratos depreciados;
- remocao de contrato depreciado exige versao incompativel.

## 18. Diagramas

### Lifecycle

```text
Discovered
    |
    v
Validated
    |
    v
Installed
    |
    v
Resolved
    |
    v
Loaded
    |
    v
Initialized
    |
    v
Enabled
    |
    v
Running
    |
    +---------> Disabled
    |              |
    v              v
Unloaded <----- Uninstalled
```

### Discovery

```text
Authorized Sources
        |
        v
 Package Candidates
        |
        v
 Manifest Read
        |
        v
 Validation
        |
        v
 Module Registry
        |
        v
 Discovery Cache
```

### Loading

```text
Module Registry
       |
       v
Dependency Resolution
       |
       v
Load Public Contracts
       |
       v
Register Providers / Events / Components / Metadata
       |
       v
Initialize Module
       |
       v
Enable by Scope
       |
       v
Runtime Consumption
```

### Dependency Graph

```text
        Platform Core
             |
     +-------+-------+
     |               |
  Module A        Module B
     |               |
     +-------+-------+
             |
          Module C

Rule: dependencies flow through declared contracts.
Rule: cycles in required dependencies are rejected.
```

## 19. Glossario

- Module: unidade instalavel, versionavel e independente de capacidade de negocio ou funcional.
- Plugin: extensao instalavel que adiciona, substitui ou especializa capacidades por pontos de extensao.
- Package: artefato distribuivel que transporta modulos, plugins ou extensoes.
- Extension: contribuicao limitada a um ponto de extensao declarado.
- Manifest: contrato declarativo que descreve identidade, compatibilidade, dependencias e capacidades.
- Module Loader: subsistema do Core que coordena ciclo de vida operacional de modulos.
- Module Registry: registro de modulos, estados, capacidades e historico.
- Dependency Resolution: processo de resolver dependencias, versoes, conflitos e ciclos.
- Public Contract: contrato suportado para consumo por outros componentes da plataforma.
- Internal Contract: contrato privado sem garantia para consumidores externos ao modulo.
- Provider: servico ou capacidade exposto por contrato.
- Component Registry: registro de componentes resolvidos pelo Runtime.
- Metadata Registration: registro de metadados de modulo para validacao e consumo pelo Runtime.
- Enabled Scope: escopo no qual um modulo esta habilitado, como plataforma, tenant ou workspace.

## 20. Decisoes Arquiteturais

- Module System e Module Loader pertencem ao Platform Core.
- Module Loader coordena lifecycle, mas nao executa regras de negocio.
- Module Registry mantem estado e capacidades declaradas, mas nao executa comportamento de dominio.
- Module e unidade de capacidade; Plugin e mecanismo de extensao e distribuicao.
- Um plugin pode entregar modulos, componentes, providers, metadados ou integracoes.
- Todo modulo deve possuir manifesto conceitual.
- Manifesto nao tera sintaxe definida nesta RFC.
- Discovery nao implica instalacao.
- Instalacao nao implica habilitacao.
- Habilitacao pode variar por plataforma, tenant ou workspace.
- Ciclos em dependencias obrigatorias devem ser rejeitados.
- Dependencias opcionais podem degradar capacidades sem impedir funcionamento minimo.
- Contratos publicos devem ser estaveis, versionaveis e documentados.
- Contratos internos nao podem ser consumidos por outros modulos como API suportada.
- Eventos publicos devem ter contratos imutaveis dentro de uma versao.
- Componentes sao resolvidos pelo Runtime via Component Registry.
- Builder nao instancia componentes e nao controla carregamento de modulos.
- Runtime consome metadados registrados, nao manifestos brutos.
- Atualizacao reavalia compatibilidade, dependencias, migrations e consumidores afetados.
- Desinstalacao deve avaliar dependencias reversas, auditoria, dados e retencao.
- Falhas em validacao, dependencia, compatibilidade ou seguranca impedem Running.

## 21. RFCs Dependentes

As seguintes RFCs futuras dependerao desta:

- RFC de Manifesto de Modulo.
- RFC de Module Loader operacional.
- RFC de Module Registry persistente.
- RFC de Plugin System e Marketplace.
- RFC de Metadata Engine.
- RFC de Runtime Engine.
- RFC de Component Registry.
- RFC de Event Bus e contratos de eventos.
- RFC de Auth, Authorization e permissoes.
- RFC de Tenancy e Execution Context.
- RFC de versionamento, compatibilidade e migrations.
- RFC de SDK de modulos.

## 22. Resumo Executivo

Esta RFC define o Module System como o contrato arquitetural que permite ao Veltryx OS operar modulos e plugins de forma segura, modular, versionavel e governada. Ela especifica conceitos, lifecycle, manifestos, discovery, dependency resolution, loader, registros de eventos, componentes e metadados, alem de fronteiras com Platform Core e Runtime.

O Module Loader e definido como coordenador de ciclo de vida pertencente ao Platform Core. Ele carrega contratos e capacidades declaradas, mas nao executa regras de negocio. O Runtime continua responsavel por interpretar metadados registrados e materializar comportamento dinamico.

## 23. Riscos

- Complexidade excessiva do lifecycle pode elevar custo de implementacao inicial.
- Contratos publicos mal versionados podem bloquear evolucao de modulos.
- Dependencias opcionais podem gerar comportamento inconsistente se nao forem comunicadas claramente.
- Falhas em migrations podem dificultar rollback e atualizacao.
- Plugins com capacidades amplas podem aumentar superficie de ataque.
- Conflitos de metadados e componentes podem exigir politicas adicionais de precedencia.
- Habilitacao por tenant ou workspace pode aumentar complexidade operacional.

## 24. Duvidas Arquiteturais

- Qual sera a politica formal de versionamento de contratos publicos?
- Como sera definida a precedencia entre extensoes de componentes concorrentes?
- Qual sera a estrategia de assinatura, confianca e origem de packages?
- Como migrations de modulos serao coordenadas com isolamento multi-tenant?
- Quais capacidades poderao ser habilitadas por workspace alem de tenant?
- Como contratos depreciados serao comunicados ao Builder, Runtime e SDK?
- Qual sera o nivel minimo de isolamento exigido para plugins de terceiros?

## 25. Impacto sobre Proximas RFCs

Esta RFC estabelece base direta para as RFCs de Manifesto de Modulo, Module Loader operacional, Plugin System, Component Registry, Metadata Engine, Runtime Engine, Event Bus, Auth e Authorization, Tenancy e SDK.

As proximas RFCs devem respeitar as fronteiras aqui definidas: Core fornece contratos e registries; Module Loader coordena lifecycle; Module Registry registra estado; Runtime consome metadados e componentes registrados; modulos e plugins interagem apenas por contratos publicos, eventos autorizados e contexto operacional.
