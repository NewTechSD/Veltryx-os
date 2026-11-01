# OS-ADR-0005-REVIEW — Revisão arquitetural final

**Projeto:** Veltryx OS  
**Data:** 2026-10-31  
**Dependências:** OS-GOV-0003, ADR-0005  
**Conclusão:** **REQUIRES_CHANGES**

## 1. Resumo executivo

O ADR-0005 está bem fundamentado quanto à separação entre aquisição, coordenação e lifecycle. As recomendações B2 (`KernelModuleLoader` como facade/orquestrador interno) e C2 (primeiro slice até `loaded`) são compatíveis com RFC-0003, desde que não alterem o lifecycle oficial nem os contratos públicos.

Há, porém, um ponto insuficientemente especificado para autorização de OS-IMP-0002: a decisão A2 fala em “catálogo/provider de candidatos fornecido pelo host”, mas os contratos atuais não expõem um `ModuleCandidateSource`. O único ingresso público existente para um host é `IModuleLoader.register(manifest, source?)` (`packages/contracts/src/modules.ts:276-284`), enquanto o `KernelModuleLoader.discover()` atual não consome manifests registrados e retorna zero candidatos (`packages/kernel/src/module-loader.ts:134-164`).

Assim, o ADR não deve ser aprovado ainda. Ele precisa explicitar que o primeiro slice usará o ingresso existente de `IModuleLoader.register()` em um loader pré-configurado, ou definir que uma abstração interna não exportada será criada para staging dos candidatos. Se a intenção for criar um source público, instalação, aquisição remota, trust/signature ou novo SPI para plugins, o escopo ultrapassa ADR e exige RFC.

Não foram alterados ADR, contratos, Kernel, Module System, testes ou manifests. Nenhuma funcionalidade foi implementada.

## 2. Documentos e evidências consultados

Foram lidos integralmente para esta revisão:

- `adr/ADR-0005-module-system-bootstrap-integration.md` — status `Proposed`, 358 linhas.
- `rfc/RFC-0003-module-system-loader.md` — status `Frozen`, 681 linhas.
- `rfc/RFC-0099-architecture-governance.md` — status `Approved`, 768 linhas.
- `docs/audits/OS-GOV-0003-RECONCILIATION.md`.
- `docs/audits/OS-IMP-0002-PREPARATION.md`.

Também foram confrontados os contratos e pontos de implementação:

- `packages/contracts/src/modules.ts:106-139,176-210,255-284`.
- `packages/kernel/src/module-loader.ts:126-278`.
- `packages/kernel/src/kernel.ts:53-71,173-190,313-330`.
- `packages/kernel/src/module-system/discovery/module-discovery.ts:25-103`.
- `packages/kernel/src/module-system/resolver/dependency-resolver.ts:27-135`.
- `packages/kernel/src/module-system/loader/module-loader.ts:28-170`.
- `packages/kernel/src/module-system/loader/module-registry.ts:3-29`.
- `packages/kernel/src/core/runtime/runtime-bootstrap-service.ts:44-175`.
- `packages/kernel/src/module-system/status/module-system-snapshot-service.ts`.
- `packages/kernel/tests/module-discovery.test.ts`.
- `packages/kernel/tests/module-dependency-resolver.test.ts`.
- `packages/kernel/tests/module-loader.test.ts`.
- `packages/kernel/tests/module-system-snapshot.test.ts`.
- `packages/kernel/tests/runtime-bootstrap.test.ts`.

## 3. Avaliação das decisões do ADR

### 3.1 Decisão A — Module Candidate Source

**Resultado:** insuficientemente precisa; requer ajuste no ADR.

O contrato atual permite:

```text
Host
  -> IModuleLoader.register(manifest, source?)
  -> KernelModuleLoader
  -> list()/staging interno
  -> Discovery especializada
```

O host pode fornecer um loader completo através de `VeltryxKernelDependencies.modules` (`packages/kernel/src/kernel.ts:53-71`), mas o Kernel default cria `new KernelModuleLoader(undefined, structuralEvents)` (`kernel.ts:313-318`). Não existe no contrato público um método `discover(candidates)` no `IModuleLoader`, nem `IModuleCandidateSource`.

O `IModuleDiscovery.discover(candidates)` existente é suficiente para a etapa especializada, mas está abaixo do facade público e não define como o host entrega os candidatos ao bootstrap. Portanto, a afirmação do ADR de que A2 não altera contratos é válida somente se o ponto de entrada for explicitamente um mecanismo já existente.

#### Ajuste obrigatório recomendado

O ADR deve especificar uma variante concreta de A2 para OS-IMP-0002:

1. O host registra manifests declarativos por `IModuleLoader.register(manifest, source?)` antes de `VeltryxKernel.initialize()`; ou fornece uma implementação de `IModuleLoader` já preparada.
2. `KernelModuleLoader` mantém os manifests/candidates em staging interno e, em `discover()`, encaminha-os à `KernelModuleDiscovery` especializada.
3. Nenhum método público novo de candidate source é criado.
4. A origem `source` é diagnóstica e não constitui autorização por si só.
5. Ausência de registros produz snapshot `empty`/`partial` observável; não é tratada como módulo carregado.

Se essa forma de ingresso não for aceitável, o ADR deve ser classificado como `REQUIRES_RFC`, pois um source público seria uma decisão de extensibilidade/contrato.

### 3.2 Decisão B — Module System Orchestrator

**Resultado:** aprovada tecnicamente como recomendação, condicionada ao ajuste de A2.

B2 é a alternativa mais compatível com RFC-0003: a RFC define o Module Loader como coordenador do lifecycle (`rfc/RFC-0003-module-system-loader.md:282-328`). O `KernelModuleLoader` já implementa `IModuleLoader`, é criado no bootstrap e é exposto por `VeltryxKernelDependencies.modules`.

O orquestrador interno deverá compor:

1. staging de candidatos/manifests;
2. `KernelModuleDiscovery` e seu validator/catalog;
3. `KernelModuleDependencyResolver`;
4. `KernelResolvedModuleLoader`;
5. `KernelModuleRegistry`;
6. `ModuleSystemSnapshotService`;
7. reports/events estruturais.

O `VeltryxKernel.initialize()` deve continuar chamando apenas a API do loader (`kernel.ts:173-190`), sem conhecer internals de Discovery, Resolver ou Registry. Isso preserva a interface pública e evita a alternativa B1, que acoplaria o Kernel ao pipeline.

#### Condições de compatibilidade

- Preservar as assinaturas de `discover`, `register`, `validate`, `resolveDependencies`, `transition`, `list` e `snapshot`.
- Não expor `KernelModuleDiscovery`, `KernelModuleDependencyResolver` ou `KernelModuleRegistry` como dependências do Admin.
- Fazer `resolveDependencies()` usar o resolver especializado, não apenas retornar a lista registrada.
- Fazer o loading consumir o `ModuleDependencyResolutionResult` real.
- Não marcar descriptors como carregados antes do registro bem-sucedido.
- Manter reports de falhas e resultados consistentes para o snapshot público.

### 3.3 Decisão C — Lifecycle Scope

**Resultado:** suficiente para OS-IMP-0002, com ressalva já corretamente indicada no ADR.

C2 é um limite de implementação, não uma alteração da RFC-0003. O primeiro slice pode terminar em:

```text
discovered -> validated -> resolved -> loaded
```

O contrato público já distingue `ModuleLifecycleState` de `ModuleLoadingState`, e `ModuleLoadingState` contém exatamente os quatro estados operacionais (`packages/contracts/src/modules.ts:210-216`). O validator atual suporta as transições correspondentes (`packages/kernel/src/module-system/loader/module-state.ts:4-31`).

`installed`, `initialized`, `enabled`, `running`, `disabled`, `unloaded` e `uninstalled` devem permanecer fora de OS-IMP-0002. Em especial, `loaded` não pode ser interpretado como execução, habilitação, registro completo de providers ou disponibilidade por tenant/workspace.

Uma mudança que remova estados, altere a ordem oficial, torne `installed` obrigatório no bootstrap ou introduza semântica de execução exigirá RFC, porque RFC-0003 está Frozen e RFC-0099 classifica lifecycle, extensibilidade e fronteiras como decisões estruturais (`rfc/RFC-0099-architecture-governance.md:192-216,231-241`).

## 4. Capacidade do host usando contratos existentes

### O que é possível hoje

- O host pode fornecer uma implementação de `IModuleLoader` através de `VeltryxKernelDependencies.modules`.
- O host pode chamar `register(manifest, source?)` nessa implementação antes do bootstrap.
- O parser/validator público do loader pode validar manifests.
- O Discovery especializado pode receber candidatos diretamente, mas esse método não está no `IModuleLoader` público.

### O que não é possível hoje sem ajuste interno

- Passar uma lista de candidates diretamente para `VeltryxKernel.initialize()`.
- Configurar um `ModuleCandidateSource` através de contrato público existente.
- Fazer o `KernelModuleLoader` default descobrir manifests do workspace sem acoplamento novo.
- Garantir que `register()` atual seja simultaneamente staging de candidate e entrada da Discovery especializada, pois hoje ele já parseia e insere um `ModuleDescriptor` no mapa (`packages/kernel/src/module-loader.ts:182-196`).

### Conclusão

O host consegue fornecer manifests usando `IModuleLoader.register()`, mas o ADR precisa transformar isso na decisão operacional explícita. A alteração necessária é de composição interna e sem novo contrato público, desde que o comportamento público e as assinaturas sejam preservados.

## 5. Arquivos precisos para OS-IMP-0002

### Núcleo provavelmente modificado

- `packages/kernel/src/module-loader.ts` — transformar o facade atual no orquestrador; adicionar staging interno ou composição dos serviços; preservar API.
- `packages/kernel/src/kernel.ts` — somente se a composição padrão precisar receber candidatos/loader pré-configurado; evitar alterações no fluxo público de bootstrap.

### Componentes reutilizados e possivelmente ajustados internamente

- `packages/kernel/src/module-system/discovery/module-discovery.ts`.
- `packages/kernel/src/module-system/discovery/discovery-validator.ts`.
- `packages/kernel/src/module-system/discovery/module-catalog.ts`.
- `packages/kernel/src/module-system/resolver/dependency-resolver.ts`.
- `packages/kernel/src/module-system/loader/module-loader.ts`.
- `packages/kernel/src/module-system/loader/module-registry.ts`.
- `packages/kernel/src/module-system/status/module-system-snapshot-service.ts`.

Esses arquivos só devem ser modificados se a integração exigir correção de composição ou propagação de reports; não devem receber novos contratos públicos.

### Testes a modificar/adicionar

- `packages/kernel/tests/module-discovery.test.ts`.
- `packages/kernel/tests/module-dependency-resolver.test.ts`.
- `packages/kernel/tests/module-loader.test.ts`.
- `packages/kernel/tests/module-system-snapshot.test.ts`.
- `packages/kernel/tests/kernel.test.ts`.
- `packages/kernel/tests/runtime-bootstrap.test.ts`.
- Novo teste de integração do bootstrap de módulos somente se o padrão do repositório permitir; o teste deve permanecer em `packages/kernel/tests`.

### Arquivos que não devem ser modificados no primeiro slice

- `packages/contracts/src/modules.ts`, salvo escalada formal para RFC.
- `apps/admin` — somente testes/documentação podem ser atualizados caso o snapshot público altere dados já previstos; não deve haver acesso a internals.
- manifests de negócio, Finance, Builder, Hosting, schemas e migrations.

## 6. Testes mínimos obrigatórios

| Cenário | Verificação mínima | Resultado esperado |
|---|---|---|
| Inicialização sem candidatos | Bootstrap default sem `register()` | Pipeline conclui sem módulos; snapshot `empty`/`partial`, contagens zero e reports disponíveis; nenhum erro falso. |
| Módulo válido | Host registra manifest válido antes de `initialize()` | Discovery encontra; validation aprova; resolver retorna ordem; loader registra `LoadedModule`; snapshot informa loaded. |
| Manifesto inválido | Candidate com id/name/version/dependency/compatibility inválidos | Candidate rejeitado no Discovery/validation; não chega ao resolver/registry; erro contém campo/origem. |
| Identificador duplicado | Dois candidates com mesmo id, ou registro repetido | Duplicidade reportada; apenas uma entrada válida; nenhum overwrite silencioso. |
| Dependência obrigatória ausente | Módulo A depende de B ausente | Resolution inválida para A; A não é loaded; dependentes também não são carregados. |
| Dependência circular | A depende de B e B depende de A | Cycle detectado; ordem não produzida como válida; nenhum módulo do ciclo é loaded. |
| Ordem de carregamento | A depende de B e C depende de A | `B → A → C` determinístico; report e registry preservam essa ordem. |
| Snapshot consistente | Após sucesso, empty, invalid, missing e cycle | Discovery/resolution/loading reports, warnings/errors, contadores e estados não se contradizem. |
| Falha sem estado parcial indevido | Falha no resolver, loader ou registry | Nenhum módulo reportado como `loaded` sem registro concluído; Core permanece íntegro; falha é observável. |

Também são necessários testes de compatibilidade da interface pública: `register`, `discover`, `validate`, `resolveDependencies`, `transition`, `list` e `snapshot` devem manter assinaturas e semântica documentada.

## 7. Necessidade de nova RFC

### Não exige RFC antes de OS-IMP-0002, se o ADR for ajustado

- Usar `IModuleLoader.register(manifest, source?)` como ingresso de host.
- Compor internamente Discovery, Resolver, Loader e Registry dentro do `KernelModuleLoader`.
- Limitar o primeiro slice a `loaded` sem alterar o lifecycle oficial.
- Propagar resultados para snapshots já existentes.

### Exige nova RFC antes de implementação

- Criar/exportar `IModuleCandidateSource` ou outro SPI público.
- Fazer o Kernel descobrir automaticamente filesystem, monorepo, package manager ou packages remotos.
- Introduzir instalação, atualização, assinatura, trust, marketplace, sandbox ou persistência durável de packages.
- Alterar semântica/ordem dos estados da RFC-0003.
- Introduzir habilitação por tenant/workspace, execução de módulo ou lifecycle posterior.
- Alterar contratos públicos de Discovery, Loading, Registry ou Runtime.

## 8. Bloqueios de ambiente e Git

- O checkout não possui `.git`; `git status`, `git remote -v` e `git rev-parse --show-toplevel` não são utilizáveis.
- O remoto oficial não pode ser identificado localmente.
- Node.js está disponível (`v24.21.0`), mas `pnpm` não está instalado diretamente.
- O projeto declara `pnpm@9.15.0` no `package.json`.
- `corepack pnpm install --frozen-lockfile` falhou ao baixar do registry npm por `EACCES` de rede.
- `node_modules` não existe.
- Typecheck, lint, testes e build não foram executados; nenhum resultado deve ser presumido.

Implementação segura requer restaurar um clone oficial em diretório separado, preservar este checkout, instalar dependências em ambiente com acesso permitido e executar todos os gates antes da conclusão de OS-IMP-0002.

## 9. Ajustes requeridos no ADR-0005

Antes da aprovação, o ADR deve:

1. Substituir a formulação genérica “provider/catálogo fornecido pelo host” por um mecanismo concreto baseado em `IModuleLoader.register(manifest, source?)` ou declarar explicitamente a abstração interna não exportada.
2. Descrever como manifests registrados ficam disponíveis para a Discovery especializada sem duplicação ou bypass de validação.
3. Definir se a composição padrão recebe um loader pré-configurado ou se o loader default possui staging interno vazio.
4. Declarar que não existe `IModuleCandidateSource` público no primeiro slice.
5. Acrescentar os nove cenários mínimos de teste e os testes de compatibilidade da interface.
6. Diferenciar “decisão aprovável por ADR” de “decisão que exige RFC” na seção A.
7. Manter `Status: Proposed` até revisão e aprovação formal.

## 10. Conclusão

**REQUIRES_CHANGES.**

O ADR-0005 não deve ser aprovado no estado atual porque A2 não define precisamente como o host fornece candidatos usando os contratos existentes. B2 e C2 são tecnicamente adequadas e podem permanecer como decisões propostas. O ajuste necessário é documental e de escopo: fixar `IModuleLoader.register()`/loader pré-configurado como ingresso do primeiro slice, proibir source público e explicitar que qualquer extensão de contrato ou mudança de lifecycle escala para RFC.

Após esses ajustes, OS-IMP-0002 poderá iniciar somente com os arquivos e testes delimitados neste relatório, sem alterar contratos públicos. A plataforma continua não pronta para produção enquanto Git remoto, dependências e gates de validação não forem restaurados e executados.

