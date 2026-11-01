# ADR-0005: Module System Bootstrap Integration

Status: Proposed  
Version: 0.1  
Type: ADR  
Owner: Architecture Team  
Reviewers: Architecture Review  
Created: 2026-10-31  
Depends On: RFC-0003, RFC-0006, RFC-0099, OS-GOV-0002, OS-GOV-0003  
Related: OS-IMP-0002  
Supersedes: None

## 1. Context

O checkout atual contém contratos públicos e implementações especializadas para Module Discovery, Manifest Validation, Dependency Resolution, Module Loading, Module Registry, Kernel Bootstrap, Runtime Snapshot e Admin read-only.

O caminho padrão, porém, não integra essas peças. `VeltryxKernel.initialize()` chama `this.dependencies.modules.discover()` e depois o Runtime Bootstrap (`packages/kernel/src/kernel.ts:173-190`). O `KernelModuleLoader` criado no bootstrap publica `candidatesCount: 0` e retorna uma lista vazia (`packages/kernel/src/module-loader.ts:134-164`). Sua resolução padrão devolve a lista registrada sem usar o resolver especializado (`packages/kernel/src/module-loader.ts:203-234`).

O contrato especializado de Discovery recebe candidatos (`packages/contracts/src/modules.ts:130-139`), enquanto o `KernelModuleDiscovery` processa, valida, registra no catálogo e produz reports (`packages/kernel/src/module-system/discovery/module-discovery.ts:25-103`). O resolver especializado constrói grafo, detecta dependências ausentes/ciclos e ordena deterministicamente (`packages/kernel/src/module-system/resolver/dependency-resolver.ts:27-135`). O loader especializado consome uma resolução e registra `LoadedModule` (`packages/kernel/src/module-system/loader/module-loader.ts:28-170`).

RFC-0003 define as fontes de Discovery como autorizadas, o Module Loader como coordenador do lifecycle, o Registry como registro de estado e o Runtime como consumidor de contratos/metadados públicos (`rfc/RFC-0003-module-system-loader.md:219-239,282-328,610-632`). A RFC não define mecanismo físico de armazenamento, formato de package ou implementação de aquisição.

Este ADR prepara a implementação de OS-IMP-0002. Ele não aprova a arquitetura, não cria contrato público e não altera a RFC-0003 Frozen.

## 2. Problema

É necessário escolher, de forma rastreável e compatível, como:

1. candidatos chegam ao Discovery;
2. as etapas especializadas são coordenadas no bootstrap;
3. o primeiro slice de lifecycle é delimitado sem declarar que o lifecycle completo já foi implementado.

Sem essas decisões, o Kernel pode continuar apresentando suporte nominal a módulos, enquanto o Runtime e o Admin recebem snapshots vazios ou parciais sem uma pipeline operacional única.

## 3. Princípios e restrições

- RFC-0003 continua sendo a autoridade do Module System.
- RFC-0099 governa a distinção entre decisão local e decisão estrutural.
- O Kernel não dependerá da estrutura física do monorepo, filesystem, Next.js, banco ou mecanismo de distribuição.
- O Admin consumirá somente snapshots e contratos públicos.
- Discovery não implica instalação; instalação não implica habilitação (`RFC-0003:231-239,619-621`).
- Falhas de validação, dependência, compatibilidade ou segurança não podem permitir `Loaded`/`Running` indevido.
- Não haverá alteração em `packages/contracts/src/modules.ts` nesta proposta.
- A decisão permanece Proposed até revisão, cross-review aplicável e aprovação formal.

## 4. Decisão A — Module Candidate Source

### 4.1 Alternativas consideradas

#### A1 — Descoberta física pelo Kernel

O Kernel varreria `modules/`, pacotes workspace ou filesystem, leria manifests e transformaria os resultados em candidatos.

**Vantagens**

- Experiência local simples.
- Menor código de composição no host inicial.
- Pode descobrir módulos sem registro manual.

**Desvantagens e riscos**

- Acopla Kernel ao monorepo, filesystem ou package manager.
- Mistura aquisição, leitura e validação com o Platform Core.
- Não define confiança, origem, tenant ou fronteira de distribuição.
- Pode transformar presença física em autorização, contrariando o lifecycle de RFC-0003.
- Dificulta adapters futuros e testes determinísticos.

**Compatibilidade:** incompatível com a independência arquitetural desejada se tornar mecanismo obrigatório; também cria uma responsabilidade não definida pela RFC-0003.

#### A2 — Catálogo/provider de candidatos fornecido pelo host

O host de execução fornece uma coleção de candidatos declarativos ao Kernel por uma dependência de composição interna. O Kernel não conhece a origem física; recebe valores, valida-os e produz reports. A fonte pode ser vazia, em memória, pacote autorizado ou adapter futuro, desde que a aquisição permaneça fora do Kernel.

**Vantagens**

- Mantém o Kernel independente de monorepo, filesystem e distribuição.
- Permite testes determinísticos com candidatos controlados.
- Preserva `IModuleDiscovery.discover(candidates)` existente.
- Separa aquisição/autorização de validação/resolução.
- Permite introduzir fontes remotas ou persistentes futuramente por adapters governados.

**Desvantagens e riscos**

- Exige composição adicional no bootstrap.
- A fonte precisa declarar origem e política de ausência.
- Um host mal configurado pode fornecer zero candidatos; isso deve ser observável.
- Pode exigir uma abstração interna de source, mas não deve ser promovida a contrato público sem RFC.

**Compatibilidade:** compatível com RFC-0003: fontes são autorizadas, Discovery recebe candidatos e presença não implica instalação. Não altera contratos públicos se a abstração permanecer interna ao Kernel/host.

#### A3 — Registry/persistence como fonte de candidatos

O Kernel carregaria candidatos de um Module Registry persistido ou de `IPersistenceService` durante o bootstrap.

**Vantagens**

- Mantém histórico e estado entre processos.
- Aproxima-se dos estados Installed/Resolved previstos na RFC-0003.
- Pode suportar atualização e auditoria futuras.

**Desvantagens e riscos**

- Confunde catálogo operacional, persistence e aquisição de packages.
- Exige política de instalação, confiança, migrations, versionamento e recuperação.
- A persistence atual é in-memory e não autoriza distribuição/instalação real.
- Aumenta o escopo e pode exigir RFC de Module Registry persistente.

**Compatibilidade:** possível no futuro, mas não é autorizada como mecanismo obrigatório pelo estado atual de RFC-0015/IMP-0031 e OS-GOV-0003.

### 4.2 Recomendação

Adotar **A2 — Catálogo/provider de candidatos fornecido pelo host**, com estas regras:

1. A aquisição é responsabilidade do host/composer, não do Kernel Core.
2. O Kernel recebe candidatos declarativos e não executa lógica de negócio para descobri-los.
3. Cada candidato deve ser validado pelo parser/validator existente antes de entrar no catálogo.
4. Candidato inválido ou duplicado fica fora do fluxo posterior e aparece em report estruturado.
5. Fonte vazia é um estado observável (`empty`/`partial`, conforme snapshot), não uma falha silenciosa.
6. Origem pode ser carregada como informação diagnóstica, sem tornar filesystem ou monorepo parte do contrato público.
7. Qualquer source público para plugins, packages remotos, assinatura ou persistência exige RFC própria.

Esta recomendação preserva a arquitetura runtime-agnostic, evita que metadata visual seja tratada como autorização e permite OS-IMP-0002 sem inventar um novo contrato público de Discovery.

### 4.3 Emenda operacional de A2 — ingresso por `IModuleLoader.register()`

Para o primeiro slice de OS-IMP-0002, A2 fica formalizada da seguinte maneira:

```text
Composition Root / Host
        |
        | register(manifest, source?)
        v
KernelModuleLoader — candidate staging
        |
        | initialize() / discover()
        v
Discovery → Resolution → Loading → Registry → Snapshot
```

O host ou composition root seleciona os manifests autorizados para a execução e chama `IModuleLoader.register(manifest, source?)` antes de `VeltryxKernel.initialize()`. O host não entrega ao Kernel um caminho de filesystem, diretório do monorepo, pacote remoto ou módulo de negócio; entrega somente manifests declarativos e a origem declarada opcional.

O significado operacional de `register()` neste slice é **admissão e staging de candidato**, não carregamento nem habilitação:

1. O método recebe um `ModuleManifest` já selecionado pelo host.
2. O `KernelModuleManifestParser` executa a validação estrutural/canônica atualmente realizada por `register()` (`packages/kernel/src/module-loader.ts:182-196`). Manifest inválido é rejeitado antes de entrar no staging.
3. O ID é verificado contra o staging atual; duplicidade é rejeitada sem overwrite.
4. O candidato admitido é armazenado como descriptor `discovered`, preservando `source` apenas como informação declarada/diagnóstica.
5. Nenhuma entrada é adicionada ao `KernelModuleRegistry` de carregados nessa etapa.
6. `discover()` consome o conjunto de candidatos admitidos e produz o Discovery Result/report para a pipeline seguinte.

O `source` não é prova de autenticidade, autorização, assinatura, confiança ou origem segura. Ele é apenas uma anotação declarada pelo host para diagnóstico/auditoria. Autorização de módulos, trust, assinatura, instalação e aquisição remota permanecem fora do escopo e exigem RFC própria.

### 4.4 Garantia contra processamento duplicado

O orquestrador interno deverá distinguir três conjuntos, mesmo que a implementação use estruturas existentes:

- **staged:** candidatos admitidos por `register()` e ainda não processados pelo bootstrap;
- **discovered/resolved:** descriptors que completaram as etapas correspondentes;
- **loaded:** módulos presentes no `KernelModuleRegistry` especializado.

`discover()` não deve re-admitir nem re-inserir candidates já consumidos. A validação estrutural feita na admissão deve ser preservada como resultado canônico; a Discovery especializada deve operar sobre esse conjunto canônico e aplicar somente as verificações de catálogo, duplicidade e descoberta necessárias ao seu report. Se a composição interna atual exigir reenviar o manifesto bruto ao validator, essa passagem deve ser idempotente e não pode gerar nova entrada, novo efeito de registro ou novo evento sem justificativa.

Como o contrato público de `IModuleDiscovery` aceita `unknown[]`, não é necessário criar `IModuleCandidateSource`; a adaptação entre descriptors staged e a Discovery especializada permanece interna ao `KernelModuleLoader`. Caso seja impossível preservar essa distinção sem alterar a semântica pública de `register()` ou `discover()`, OS-IMP-0002 deve parar e escalar a questão para RFC, em vez de introduzir um novo contrato implicitamente.

### 4.5 Ausência, falhas e idempotência

- Nenhum `register()` antes de `initialize()` produz um staging vazio; `discover()` conclui sem candidatos, o snapshot permanece `empty`/`partial` conforme os reports disponíveis e as contagens são zero.
- Manifesto inválido falha na admissão e não alcança Discovery, Resolver ou Registry.
- ID duplicado falha na admissão sem substituir o candidato anterior; a falha deve ser observável ao host e/ou no report do pipeline conforme a fronteira pública existente.
- Dependência obrigatória ausente ou ciclo impede `resolved` válido e impede `loaded` para o módulo afetado e seus dependentes.
- Falha de loading/registry não pode deixar módulo simultaneamente reportado como loaded e ausente do `KernelModuleRegistry`.
- Chamadas repetidas a `initialize()` não devem re-carregar módulos já carregados nem duplicar entries/events. O Kernel já protege a ordem de lifecycle de bootstrap; OS-IMP-0002 deve preservar essa proteção e tornar a segunda execução um no-op idempotente ou um resultado diagnóstico explícito, conforme o comportamento existente dos serviços.
- O Registry de carregados é a fonte de verdade para `loaded`; o staging não deve ser contado como módulo carregado.

### 4.6 Responsabilidades

**Host/composition root:** selecionar manifests, decidir quais são autorizados para a execução corrente, fornecer `source` declarada quando disponível, chamar `register()` antes de `initialize()` e tratar rejeições de admissão.

**`KernelModuleLoader`:** manter staging interno, coordenar Discovery → Resolver → Loader → Registry, preservar a API `IModuleLoader`, emitir reports/events existentes e expor snapshot público consistente.

**Discovery/Resolver/Loader/Registry especializados:** validar/diagnosticar o conjunto admitido, resolver dependências deterministicamente, carregar somente resoluções válidas e registrar módulos loaded sem duplicidade.

**Runtime:** consumir somente o snapshot/contexto público produzido pelo bootstrap.

**Admin:** consumir somente `kernel.modules().snapshot()` e adapters públicos; não selecionar candidates nem acessar staging/registry interno.

## 5. Decisão B — Module System Orchestrator

### 5.1 Alternativas consideradas

#### B1 — `VeltryxKernel` coordena todas as etapas

O método `initialize()` chamaria diretamente Discovery, Resolver, Loader, Registry e Snapshot.

**Vantagens:** fluxo explícito; menos uma classe; fácil localizar o bootstrap.  
**Desvantagens:** Kernel passa a conhecer detalhes de cada etapa; aumenta acoplamento e dificulta testes isolados; conflita com a responsabilidade de Module Loader definida na RFC-0003.

#### B2 — `KernelModuleLoader` permanece facade e orquestrador interno

O `KernelModuleLoader`, já usado como `IModuleLoader` no bootstrap (`packages/kernel/src/kernel.ts:317`), compõe internamente Discovery, Resolver, Loader especializado, Registry e Snapshot. Sua API pública existente permanece; a implementação deixa de usar o caminho simplificado de lista vazia/ordem direta.

**Vantagens:** alinha-se diretamente à RFC-0003, que atribui coordenação ao Module Loader; preserva o contrato `IModuleLoader`; mantém Kernel e Admin desacoplados dos internals; concentra reports e lifecycle em uma fronteira existente.

**Desvantagens:** a classe atual precisará ser reorganizada internamente; pode exigir separar código legado do orquestrador; compatibilidade de métodos `register`, `discover`, `resolveDependencies` e `snapshot` precisa ser testada.

#### B3 — Novo `KernelModuleSystemOrchestrator` interno

Uma classe nova coordenaria as etapas e `KernelModuleLoader` seria um adapter/facade fino.

**Vantagens:** separação clara de responsabilidades; testes de orquestração independentes; evolução futura mais explícita.

**Desvantagens:** mais uma abstração e mais wiring; risco de duas fontes de verdade entre facade e orquestrador; pode introduzir contrato interno sem necessidade no primeiro slice.

### 5.2 Recomendação

Adotar **B2 — `KernelModuleLoader` como facade e orquestrador interno**.

O fluxo oficial proposto é:

```text
Host Candidate Source
        |
        v
KernelModuleLoader / Module Orchestrator
        |
        +--> KernelModuleDiscovery
        |       +--> Manifest Parser / Validators
        |       +--> Module Catalog
        |
        +--> KernelModuleDependencyResolver
        |       +--> Graph / Cycle Detector / Topological Sort
        |
        +--> KernelResolvedModuleLoader
        |       +--> KernelModuleRegistry
        |
        +--> ModuleSystemSnapshotService
        |
        +--> Runtime Bootstrap / Kernel Status Snapshot
        |
        +--> Admin public adapters
```

O `VeltryxKernel` deve somente iniciar o serviço de módulos e consumir seu resultado público, sem coordenar detalhes internos. O Runtime deve receber o snapshot/contexto público; o Admin deve continuar consumindo `kernel.modules().snapshot()`.

### 5.3 Tratamento de erros

- Erros de candidate/manifest: report de Discovery; candidato não avança.
- Duplicidade: report de Discovery e nenhuma duplicação no catálogo.
- Dependência ausente obrigatória: resolução falha para o módulo afetado; não carregar dependentes.
- Ciclo obrigatório: resolução rejeitada; ordem não é inventada.
- Falha de loading/registro: módulo não deve aparecer como carregado; estado consistente e diagnóstico preservado.
- Falha de snapshot: erro observável no snapshot, sem comprometer a integridade do Core.

Essas regras concretizam RFC-0003: falhas são observáveis, a ordem é determinística e nenhum módulo inválido alcança estado operacional indevido.

## 6. Decisão C — Lifecycle Scope

### 6.1 Alternativas consideradas

#### C1 — Implementar o lifecycle completo agora

Implementar `discovered`, `validated`, `installed`, `resolved`, `loaded`, `initialized`, `enabled`, `running`, `disabled`, `unloaded` e `uninstalled`, incluindo instalação, habilitação por escopo e descarregamento.

**Vantagens:** aproximação máxima da RFC-0003; menor lacuna conceitual futura.  
**Desvantagens:** exige decisões ainda ausentes sobre instalação, persistência, segurança, tenancy, rollback, providers, migrations e execução de módulos; extrapola OS-IMP-0002 e o ambiente atual.

#### C2 — Primeiro slice operacional até `loaded`

Implementar apenas `discovered → validated → resolved → loaded`, usando candidatos fornecidos pelo host. `installed`, `initialized`, `enabled`, `running`, `disabled`, `unloaded` e `uninstalled` permanecem fora de OS-IMP-0002.

**Vantagens:** entrega integração verificável; aproveita contratos e testes existentes; não inventa instalação, execução ou persistence de módulos; reduz risco.

**Desvantagens:** não implementa o lifecycle completo; `installed` previsto na RFC-0003 não será usado neste slice; exige documentação clara para não confundir loaded com running.

#### C3 — Implementar até `initialized`

Além do loading, registrar providers, eventos, components e metadata e concluir preparação conceitual do módulo.

**Vantagens:** aproxima o Runtime do consumo de capacidades declaradas.

**Desvantagens:** introduz efeitos de registro, rollback e autorização antes de existir uma decisão completa sobre contratos de módulo e escopos; amplia OS-IMP-0002 e pode demandar RFCs dependentes.

### 6.2 Recomendação

Adotar **C2 — primeiro slice até `loaded`**, com uma ressalva de governança:

- C2 é um limite de implementação de OS-IMP-0002, não uma alteração do lifecycle oficial da RFC-0003.
- A implementação não deve apresentar `loaded` como `initialized`, `enabled` ou `running`.
- `installed` e estados posteriores permanecem suportados conceitualmente pelo contrato/RFC, mas não são exercitados pelo primeiro slice.
- Transições deste slice são somente `discovered → validated → resolved → loaded`.
- Não haverá `loaded → running`, habilitação por tenant/workspace, instalação remota, migrations de módulo, execução de lógica de negócio ou unload.
- Qualquer decisão para redefinir o lifecycle oficial, remover estados, alterar semântica ou tornar `installed` obrigatório no bootstrap exige nova RFC ou RFC substituta, pois RFC-0003 está Frozen.

## 7. Impacto em contratos

### Sem alteração autorizada neste ADR

- `IModuleDiscovery`, `IModuleDependencyResolver`, `IModuleLoadingService`, `IModuleRegistry` e `IModuleLoader` permanecem os contratos públicos existentes.
- `ModuleLifecycleState` mantém os estados atuais.
- `ModuleLoadingState` continua representando o pipeline operacional limitado.
- Reports, snapshots e diagnostics existentes devem ser reutilizados.

### Possíveis extensões futuras

Uma interface pública de `IModuleCandidateSource`, assinatura/trust, package acquisition, installation service ou lifecycle orchestration público não está autorizada por este ADR. Qualquer uma dessas extensões precisa de RFC por afetar extensibilidade, fronteiras, segurança, compatibilidade ou roadmap (`rfc/RFC-0099-architecture-governance.md:192-216`).

Uma abstração interna de source ou opções de composição pode ser criada durante OS-IMP-0002 somente se não for exportada como contrato suportado e não alterar a API pública. Se isso não for possível, a implementação deve parar e escalar para RFC.

Esta emenda não cria uma abstração pública de source. O ingresso oficial do primeiro slice é `IModuleLoader.register(manifest, source?)`; qualquer alternativa que substitua esse ingresso por um SPI público, filesystem discovery obrigatório ou mecanismo de instalação deve ser tratada como mudança estrutural.

## 8. Consequências

### Positivas

- O Kernel permanece independente da estrutura física do monorepo.
- A pipeline especializada torna-se única e testável.
- O Admin e o Runtime continuam consumindo snapshots públicos.
- Candidatos inválidos, duplicados, dependências ausentes e ciclos têm representação observável.
- OS-IMP-0002 fica delimitada a integração operacional, sem inventar instalação ou execução.
- A evolução futura pode adicionar lifecycle sem quebrar consumidores existentes, se for aditiva e versionada.

### Negativas

- O host precisa fornecer explicitamente candidatos.
- O primeiro bootstrap continuará sem módulos se o host não configurar candidatos, mas isso será um estado observável e documentado.
- A implementação interna do facade atual ficará mais complexa.
- O lifecycle completo da RFC-0003 continuará parcialmente não implementado.

## 9. Compatibilidade com RFCs e ADRs

| Documento | Compatibilidade |
|---|---|
| RFC-0003 | Compatível: fontes autorizadas, Module Loader como coordenador, Registry como estado, Runtime por contratos públicos, falhas observáveis e ordem determinística. O ADR delimita um slice; não altera o lifecycle oficial. |
| RFC-0006 | Compatível: Runtime consome contexto/snapshot e não acessa internals do Module System. |
| RFC-0004 | Compatível: composição usa Service Registry/DI por tokens e contracts; nenhum módulo acessa internals. |
| RFC-0005/0007 | Compatível: metadata/components só são consumidos conforme o estágio permitido; nenhum registro de negócio é introduzido por este ADR. |
| RFC-0099 | Compatível como ADR Proposed se a decisão permanecer local à composição da implementação; qualquer alteração de contrato, fronteira, lifecycle ou extensibilidade deve ser elevada a RFC. |
| ADR-0004 | Compatível: nenhuma dependência de Builder, React, Next, DOM, Hosting ou Delivery Plane. |

## 10. Riscos

1. **Fonte vazia mascarada como sucesso:** mitigação por report de source, `empty/partial` explícito e teste de ausência.
2. **Facade continuar usando pipeline simplificada:** mitigação por testes de integração que comprovem uso do resolver/loader especializados.
3. **Confusão entre loaded e running:** mitigação por estados separados, labels do Admin e documentação.
4. **Abstração interna virar API acidental:** mitigação por exports controlados e revisão de contratos.
5. **Decisão local ser estrutural:** se source público, instalação, trust, tenancy ou lifecycle forem introduzidos, pausar ADR e criar RFC.
6. **Validação não executável:** restaurar pnpm/dependências antes de declarar OS-IMP-0002 concluída; nenhum teste é presumido.

## 11. Plano de validação

### Documental

- Revisar contra RFC-0003 Frozen e RFC-0099 Approved.
- Confirmar que nenhuma alternativa assume mecanismo físico não autorizado.
- Confirmar que os estados fora de escopo estão explicitamente separados do lifecycle oficial.
- Registrar owner, reviewers, status e decisão de escalada ADR/RFC.

### Testes de unidade

- Source vazio, candidatos válidos, inválidos e duplicados.
- Parser/validator e reports de Discovery.
- Missing dependency, optional dependency, conflito e ciclo.
- Ordem determinística do resolver.
- Loader consumindo a resolução e registrando módulos sem duplicidade.
- Snapshot agregando reports e diagnostics.

### Testes de integração

- Host fornece dois manifests válidos; Kernel bootstrap produz descriptors e módulos loaded.
- Host fornece candidate inválido; módulo fica rejeitado e não chega ao Registry.
- Dependência obrigatória ausente/ciclo; nenhum dependente é carregado.
- Runtime Snapshot expõe contagens coerentes.
- Admin `/modules` consome somente snapshot e diferencia empty, partial, ready e error.

### Gates de ambiente

Executar em ambiente com dependências disponíveis, sem `--force` e sem alterar lockfile deliberadamente:

```text
corepack pnpm install --frozen-lockfile
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
corepack pnpm build
```

No checkout atual, esses gates estão bloqueados porque Corepack não conseguiu baixar `pnpm@9.15.0` por erro de rede `EACCES` e não há `node_modules`.

## 12. Escopo de OS-IMP-0002

### Dentro do escopo

- Compor a fonte interna de candidatos autorizada.
- Fazer `KernelModuleLoader` coordenar Discovery → Resolution → Loading → Registry.
- Reutilizar contracts e reports existentes.
- Integrar o resultado ao Runtime Bootstrap e snapshots.
- Cobrir sucesso, invalid/duplicate, missing/cycle, loading rejection e snapshot.
- Atualizar documentação técnica após implementação e testes.

### Fora do escopo

- Alterar `packages/contracts` sem RFC.
- Source público para packages/plugins.
- `ModuleCandidateSource` público ou outro SPI público de aquisição.
- Filesystem scan obrigatório ou package manager integration.
- Installation, update, enablement, running, disable, unload ou uninstall completos.
- Execução de providers/regras de negócio de módulos.
- Finance, Builder, Hosting, publishing, migrations e persistence externa.
- Assinatura, trust store, sandbox ou marketplace.

## 13. Pendências para aprovação

1. Architecture Owner deve confirmar que A2 e B2 são decisões locais compatíveis com RFC-0003.
2. Architecture Review deve confirmar que C2 é apenas limite do primeiro slice, não redução do lifecycle oficial.
3. Deve ser confirmado que `IModuleLoader.register(manifest, source?)` é o ingresso oficial do primeiro slice e que `source` é apenas informação declarada.
4. Deve ser definido, na implementação, como descriptors staged serão adaptados à Discovery especializada sem reprocessamento observável ou efeitos duplicados.
5. Se essa adaptação exigir novo contrato público, abrir RFC antes de OS-IMP-0002.
6. Deve ser definida a nomenclatura/rastreabilidade para os usos conflitantes de `IMP-0011`.
7. Deve ser recuperado o repositório oficial ou registrada a impossibilidade de verificar OS-AUDIT-0001, OS-GOV-0001 e RFC-0009.
8. Deve haver ambiente capaz de executar os gates antes de aprovar a implementação como concluída.
9. Reviewers devem verificar que a decisão não cria dependência de Finance, Builder ou Hosting.

## 14. Status

Este documento permanece **Proposed**. Não autoriza implementação, não aprova OS-IMP-0002 e não altera RFC-0003, RFC-0099, ADRs, IMPs ou contratos públicos.

