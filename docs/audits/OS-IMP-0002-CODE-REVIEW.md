# OS-IMP-0002 — Code Review técnico

**Status:** APPROVED_WITH_NOTES

**Data:** 2026-10-31

**Referência:** ADR-0005 (Approved), RFC-0003 e RFC-0099

**Escopo:** revisão da integração do Module System ao Kernel Bootstrap

## 1. Resumo executivo

A integração atende A2, B2 e C2 do ADR-0005. O host admite manifests por
`IModuleLoader.register(manifest, source?)`; o `KernelModuleLoader` coordena as
implementações especializadas de Discovery, Dependency Resolution, Loading e
Registry; e o snapshot público é consumido pelo Runtime e pelo Admin.

A revisão encontrou dois problemas objetivos e uma lacuna de concorrência:

1. registros feitos depois do início da pipeline eram aceitos, mas não seriam
   processados;
2. o facade não encaminhava eventos estruturais de Resolution e Loading;
3. chamadas concorrentes a `discover()` poderiam executar a pipeline mais de
   uma vez.

Os três pontos foram corrigidos sem alterar contratos públicos. O retorno
histórico vazio de `discover()` foi preservado por compatibilidade; os
resultados operacionais permanecem disponíveis por `resolveDependencies()`,
`list()` e `snapshot()`.

## 2. Arquivos analisados

- `adr/ADR-0005-module-system-bootstrap-integration.md`
- `rfc/RFC-0003-module-system-loader.md`
- `rfc/RFC-0099-architecture-governance.md`
- `docs/audits/OS-IMP-0002-PREPARATION.md`
- `docs/audits/OS-GOV-0003-RECONCILIATION.md`
- `docs/MODULE-LOADER.md`
- `docs/KERNEL-BOOTSTRAP.md`
- `packages/contracts/src/modules.ts`
- `packages/contracts/src/module-system-status.ts`
- `packages/kernel/src/kernel.ts`
- `packages/kernel/src/module-loader.ts`
- `packages/kernel/src/module-system/discovery/*`
- `packages/kernel/src/module-system/resolver/*`
- `packages/kernel/src/module-system/loader/*`
- `packages/kernel/src/module-system/status/module-system-snapshot-service.ts`
- testes do Kernel, Runtime e Admin relacionados ao Module System, Bootstrap,
  snapshots e eventos

## 3. Auditoria Git

- Branch atual: `feature/os-imp-0002-module-bootstrap`.
- Alterações unstaged: documentação técnica, Kernel e facade do Module System.
- Arquivo novo não rastreado: `packages/kernel/tests/module-bootstrap-integration.test.ts`.
- Arquivo novo desta revisão: este relatório.
- Alterações staged: nenhuma.
- Exclusões: nenhuma.
- `git diff --check`: aprovado.
- O teste de integração existe e será incluído no futuro commit quando o
  commit for autorizado.
- Não houve commit, push, reset, clean ou operação destrutiva.

## 4. Matriz de conformidade com ADR-0005

| Área                            | Evidência                                                  | Resultado                                           |
| ------------------------------- | ---------------------------------------------------------- | --------------------------------------------------- |
| A2 — source fornecida pelo host | `packages/kernel/src/module-loader.ts:182-205`             | Conforme; staging interno, sem filesystem discovery |
| B2 — facade/orquestrador        | `packages/kernel/src/module-loader.ts:142-180`             | Conforme; reutiliza componentes especializados      |
| C2 — lifecycle limitado         | `packages/kernel/src/module-system/loader/module-state.ts` | Conforme; somente até `loaded`                      |
| Discovery/Validation            | `module-loader.ts:142-178`, Discovery especializada        | Conforme                                            |
| Resolution                      | `module-system/resolver/dependency-resolver.ts`            | Conforme; missing, ciclos e ordem determinística    |
| Loading/Registry                | `module-system/loader/module-loader.ts`                    | Conforme; registry é fonte de verdade de loaded     |
| Bootstrap                       | `packages/kernel/src/kernel.ts:173-191`                    | Conforme; pipeline antes do Runtime Bootstrap       |
| Snapshot                        | `module-loader.ts:233-240`, Snapshot Service               | Conforme; reports e registry propagados             |
| Independência do Kernel         | busca por imports de módulos de negócio/filesystem         | Conforme                                            |

## 5. Achados e correções

### CR-001 — Registro após início da pipeline — corrigido — Médio

Antes, `register()` aceitava um novo manifesto depois de `discover()` ter
concluído. Como `pipelineExecuted` fazia chamadas posteriores retornarem sem
processar novos candidatos, o registro ficava em staging sem chegar ao
Discovery, Resolver ou Registry.

Correção em `packages/kernel/src/module-loader.ts:182-185`: registros são
rejeitados quando a pipeline já iniciou ou terminou, com erro explícito
`Module registration is closed after pipeline execution`.

Teste: `module-bootstrap-integration.test.ts`, cenário de registro após
pipeline.

### CR-002 — Eventos de Resolution e Loading não eram propagados — corrigido — Médio

O facade havia criado Resolver e Loader especializados sem publisher, embora
ambos suportem os eventos previstos em `structural-event-names.ts` e já
possuam testes de eventos próprios.

Correção em `packages/kernel/src/module-loader.ts:147-148`: o publisher
estrutural é encaminhado ao Resolver e ao Loader. O bootstrap agora emite,
quando aplicável, Discovery Started/Completed, Resolution Started/Completed e
Loading Started/Completed. Falhas continuam emitindo os eventos `*.failed`
pelas implementações especializadas.

Teste de regressão: `packages/kernel/tests/structural-events.test.ts`.

### CR-003 — Corrida entre chamadas concorrentes a `discover()` e `initialize()` — corrigido — Médio

Sem coordenação, duas chamadas concorrentes poderiam observar
`pipelineExecuted === false` e processar o mesmo staging. Além disso, duas
chamadas concorrentes a `VeltryxKernel.initialize()` poderiam entrar ao mesmo
tempo no `RuntimeBootstrapService`, cuja máquina de estados rejeita a segunda
transição.

Correção em `packages/kernel/src/module-loader.ts:136-169`: uma Promise interna
de execução é compartilhada entre chamadas concorrentes; apenas uma pipeline é
executada por instância. Correção complementar em
`packages/kernel/src/kernel.ts:174-188`: o Kernel compartilha a Promise de
inicialização e libera o lock após sucesso ou falha.

Teste: `module-bootstrap-integration.test.ts`, cenários de discovery concorrente
e inicialização concorrente do Kernel.

### CR-004 — Retorno vazio de `discover()` — nota de compatibilidade — Baixo

O método executa a pipeline operacional, mas preserva retorno vazio. Isso é
verificável pelo teste legado em `packages/kernel/tests/module-manifest.test.ts:212-220`.
O contrato público não declara que o retorno de `discover()` seja o relatório
completo; o resultado operacional é exposto por snapshot e resolução.

Decisão: não alterar automaticamente a semântica pública. Uma mudança para
retornar descriptors exigiria revisão de compatibilidade e atualização formal
dos consumidores.

### CR-005 — Staging e Registry mantêm estados diferentes — conforme

`KernelModuleLoader.list()` representa os descriptors admitidos pelo host,
enquanto `KernelResolvedModuleLoader.getRegistry().list()` representa somente
`LoadedModule`. O snapshot mescla ambos e usa os reports para apresentar o
estado público final. Essa separação é intencional e compatível com o ADR-0005:
staging não é contado como loaded; Registry é a fonte de verdade de loaded.

## 6. Fluxo verificado

```text
register(manifest, source?)
  -> staging validado
  -> Discovery/Validation
  -> Dependency Resolution
  -> Loading
  -> Module Registry
  -> ModuleSystemSnapshotService
  -> Runtime Bootstrap / Admin adapters
```

Não há importação automática de módulos de negócio, filesystem discovery,
instalação remota, trust, assinatura ou execução de código durante staging.

## 7. Testes verificados

Os testes cobrem:

1. bootstrap sem candidatos;
2. manifest válido;
3. manifest inválido;
4. identificador duplicado;
5. dependência obrigatória ausente;
6. dependência opcional ausente;
7. dependência circular;
8. ordem determinística;
9. snapshot consistente;
10. inicialização repetida;
11. registro após pipeline;
12. falha de Discovery nos testes especializados;
13. falha de Resolution nos testes especializados;
14. falha de Loading nos testes especializados;
15. estados após falhas;
16. eventos estruturais;
17. compatibilidade dos testes anteriores;
18. concorrência entre discovery e initialize;
19. Kernel → Runtime → Admin por snapshots públicos.

## 8. Resultados dos gates

Após as correções, executar novamente na raiz:

| Gate               | Resultado                                                           |
| ------------------ | ------------------------------------------------------------------- |
| `pnpm typecheck`   | Aprovado; 6 tasks bem-sucedidas                                     |
| `pnpm lint`        | Aprovado; 6 tasks bem-sucedidas                                     |
| `pnpm test`        | Aprovado; Kernel 31 arquivos/406 testes, Admin 9 arquivos/73 testes |
| `pnpm build`       | Aprovado; 4 tasks bem-sucedidas, incluindo Next.js Admin            |
| `git diff --check` | Aprovado nesta revisão                                              |

Os quatro gates foram executados após as correções, sem falhas. Uma tentativa
paralela intermediária sofreu OOM do ambiente por executar TypeScript, ESLint,
Vitest e Next.js simultaneamente; os gates foram rerodados isoladamente e
passaram. O build direto de `@veltryx/kernel` também passou.

## 9. Riscos residuais

- `discover()` mantém retorno vazio por compatibilidade histórica.
- Falhas excepcionais internas do Resolver/Loader são propagadas ao caller;
  falhas normais de dependência são representadas por reports e snapshots.
- O Registry é in-memory e não representa instalação ou persistência.
- `source` é apenas diagnóstico declarado; não representa trust ou autorização.
- O host deve registrar candidatos antes do início do bootstrap.

## 10. Fora do escopo

Instalação, atualização, assinatura, trust, marketplace, filesystem discovery,
persistência externa, Finance, Builder, Hosting e estados posteriores a
`loaded` permanecem fora da OS-IMP-0002.

## 11. Recomendação

**APPROVED_WITH_NOTES.** As correções são mínimas, internas e compatíveis com
ADR-0005. Recomenda-se aprovar o commit somente após os quatro gates finais
serem registrados como aprovados e após revisão do diff pelo responsável do
branch.
