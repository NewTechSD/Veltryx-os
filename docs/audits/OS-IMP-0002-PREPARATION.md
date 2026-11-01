# OS-IMP-0002 — Preparação para implementação

**Tipo:** proposta técnica preparatória  
**Status:** proposta; não é autorização automática  
**Base:** OS-GOV-0002 e OS-GOV-0003  
**Escopo:** integração do Module System ao bootstrap padrão, sem ampliar contratos nesta tarefa.

## 1. Objetivo

Conectar o caminho operacional do Module System:

```text
Discovery → Validation → Resolution → Loading → Registry → Bootstrap → Runtime Snapshot
```

O objetivo é fazer o Kernel processar candidatos fornecidos por uma fonte explicitamente autorizada, produzir reports consistentes, registrar módulos carregados e expor o resultado ao Runtime Snapshot e ao Admin através dos contratos públicos existentes.

## 2. Escopo permitido

- Definir, após aprovação, uma fonte de candidatos compatível com a arquitetura atual.
- Reutilizar `IModuleDiscovery`, `IModuleDependencyResolver`, `IModuleLoadingService` e `IModuleRegistry` existentes.
- Integrar os componentes especializados ao fluxo do Kernel Bootstrap.
- Preservar `packages/contracts` salvo mudança formalmente aprovada.
- Propagar discovery, resolution e loading reports para o snapshot público existente.
- Adicionar testes unitários e de integração para candidates válidos, inválidos, duplicados, dependência ausente, ciclo e carregamento.
- Atualizar documentação técnica e checklist de implementação após os testes.

## 3. Escopo proibido

- Criar novo contrato público de Discovery nesta implementação.
- Implementar módulos de negócio ou Finance Core.
- Implementar Builder, Hosting, publishing ou Runtime Adapters.
- Alterar schemas, migrations, persistence externa ou autenticação.
- Acessar internals do Kernel a partir do Admin ou de futuros módulos.
- Implementar automaticamente estados posteriores sem decisão sobre o lifecycle.
- Renumerar ou alterar silenciosamente IMPs, RFCs ou ADRs históricas.
- Introduzir dependências externas ou acoplamento a filesystem/framework sem autorização arquitetural.

## 4. Arquivos provavelmente envolvidos

Arquivos a serem avaliados durante a implementação, não modificados por OS-GOV-0003:

- `packages/kernel/src/kernel.ts`
- `packages/kernel/src/module-loader.ts`
- `packages/kernel/src/module-system/discovery/module-discovery.ts`
- `packages/kernel/src/module-system/discovery/module-catalog.ts`
- `packages/kernel/src/module-system/resolver/dependency-resolver.ts`
- `packages/kernel/src/module-system/loader/module-loader.ts`
- `packages/kernel/src/module-system/loader/module-registry.ts`
- `packages/kernel/src/module-system/status/module-system-snapshot-service.ts`
- `packages/contracts/src/modules.ts`
- `packages/contracts/src/runtime.ts`
- `packages/contracts/src/kernel-status.ts`
- `packages/kernel/tests/module-discovery.test.ts`
- `packages/kernel/tests/module-dependency-resolver.test.ts`
- `packages/kernel/tests/module-loader.test.ts`
- `packages/kernel/tests/module-system-snapshot.test.ts`
- `packages/kernel/tests/runtime-bootstrap.test.ts`
- `apps/admin/lib/module-system-adapter.ts`
- `apps/admin/app/modules/page.tsx`

## 5. Dependências arquiteturais

Antes de implementação, a revisão deve confirmar:

1. `RFC-0003` continua sendo a autoridade do Module System.
2. `RFC-0099` governa o processo e a cross-review.
3. O contrato atual de `IModuleDiscovery` é suficiente para o primeiro slice.
4. A fonte de candidatos será injetável e não dependerá de filesystem, pacote externo ou runtime de entrega sem decisão formal.
5. O primeiro slice termina em `loaded` ou haverá uma RFC/ADR para lifecycle posterior.
6. O facade `KernelModuleLoader` será mantido como API compatível ou substituído internamente por uma composição oficial, sem quebrar consumidores.
7. O snapshot público continuará sendo a única fonte do Admin.

Se a decisão sobre fonte, lifecycle ou composição alterar uma fronteira estrutural, OS-IMP-0002 deve ser pausada para RFC/ADR apropriada. Este documento não decide essas questões.

## 6. Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Duas pipelines de Module System | Estados/report divergentes | Escolher um orquestrador oficial e cobrir o fluxo ponta a ponta. |
| Fonte de candidatos indefinida | Discovery continua vazio ou acoplado | Aprovar provider/catalog source antes de código. |
| Lifecycle público maior que implementação | Transições inválidas e falsa prontidão | Fixar o primeiro slice em `loaded` ou aprovar extensão formal. |
| Snapshot sem reports | Admin mostra estado parcial sem causa clara | Propagar reports e diagnostics do pipeline. |
| Colisão IMP-0011 | Critérios históricos ambíguos | Registrar alias/rastreabilidade antes do merge. |
| Ambiente sem dependências | Falsos resultados de validação | Restaurar pnpm/cache em ambiente autorizado e guardar logs. |
| Introdução de módulos reais | Escopo vira domínio de negócio | Usar manifests de teste controlados, sem Finance. |

## 7. Plano incremental proposto

### Fase 0 — Pré-condições

- Recuperar clone oficial ou fonte remota em diretório separado, sem sobrescrever este checkout.
- Instalar dependências com `corepack pnpm install --frozen-lockfile` em ambiente com acesso permitido.
- Executar baseline de typecheck, lint, tests e build.
- Registrar a decisão arquitetural sobre a fonte de candidatos.

### Fase 1 — Orquestração interna

- Compor Discovery especializado, resolver especializado, loader especializado e registry.
- Alimentar Discovery com candidatos controlados por uma dependência injetável.
- Preservar as interfaces públicas existentes.
- Produzir reports de cada estágio.

### Fase 2 — Kernel Bootstrap

- Fazer `VeltryxKernel.initialize()` executar o pipeline na ordem aprovada.
- Propagar resultado ao Module System Snapshot e Runtime Bootstrap.
- Garantir que falhas não sejam convertidas em “zero módulos” silencioso.
- Manter o Runtime dependente apenas de snapshots/contratos públicos.

### Fase 3 — Admin

- Confirmar que `/modules` exibe os estados reais do snapshot.
- Testar empty, partial, ready e error.
- Verificar que o adapter não acessa registry ou loader internals.

### Fase 4 — Documentação e governança

- Atualizar `MODULE-DISCOVERY.md`, `DEPENDENCY-RESOLVER.md`, `MODULE-LOADER.md`, `MODULE-SYSTEM-SNAPSHOT.md` e `KERNEL-BOOTSTRAP.md`.
- Atualizar o IMP autorizado sem reescrever o histórico.
- Registrar a decisão sobre lifecycle e IDs conflitantes.

## 8. Testes necessários

### Unitários

- Discovery recebe candidates válidos, inválidos e duplicados.
- Manifest parser/validator rejeita estrutura inválida.
- Resolver detecta missing dependency, optional dependency e cycles.
- Loader rejeita resolution inválida, estados inválidos e duplicidades.
- Registry lista, encontra e impede duplicidade.
- Snapshot agrega reports, warnings, errors e métricas.

### Integração

- Kernel bootstrap com pelo menos um manifest de teste válido.
- Fluxo completo produz `discovered`, `resolved`, `loaded` e registry populated.
- Dependência ausente/ciclo falha de modo estruturado.
- Runtime Snapshot informa o resultado do Module System.
- Admin `/modules` consome apenas o snapshot e exibe os estados esperados.

### Gates

Executar, sem `--force` e sem modificar lockfile deliberadamente:

```text
corepack pnpm install --frozen-lockfile
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
corepack pnpm build
```

## 9. Critérios de aceite

OS-IMP-0002 somente poderá ser considerada concluída quando:

1. A fonte de candidatos estiver formalmente decidida e injetável.
2. O bootstrap padrão executar Discovery → Validation → Resolution → Loading → Registry.
3. O resolver especializado for usado no caminho oficial, com detecção de ciclos e dependências ausentes.
4. O loader especializado consumir o resultado da resolução.
5. O registry receber os módulos carregados sem duplicidade.
6. O Runtime Snapshot expuser contagens e diagnostics coerentes.
7. O Admin exibir o snapshot sem acessar internals.
8. Testes unitários e de integração cobrirem sucesso, invalidez, duplicidade, missing e cycle.
9. Typecheck, lint, testes e build passarem, ou falhas remanescentes forem explicitamente classificadas e aceitas.
10. Nenhum contrato público, schema, migration, Finance, Builder ou Hosting tiver sido alterado fora do escopo aprovado.
11. Documentação e checklist estiverem atualizados com evidência de execução.

## 10. Bloqueios para implementação

Implementação não deve iniciar enquanto permanecerem sem decisão:

- origem oficial dos candidatos;
- orquestrador único da pipeline;
- limite do lifecycle inicial;
- tratamento formal da colisão `IMP-0011`;
- disponibilidade de ambiente para executar os gates;
- revisão de compatibilidade contra RFC-0003, RFC-0099 e ADRs relacionadas.

## 11. Relação com FIN-REC-0001

OS-IMP-0002 não depende de Finance e não deve criar pontos de extensão específicos para Finance. `FIN-REC-0001` só poderá iniciar quando houver:

- confirmação do checkout oficial e recuperação de artefatos históricos, se existirem;
- decisão de produto sobre o domínio financeiro;
- RFC/contratos aprovados para Finance;
- definição de manifest, eventos, services, repositories e persistence;
- estratégia de integração com Kernel por contratos públicos;
- testes e critérios de aceite próprios.

Na situação atual, Finance permanece **Not Implemented** e **Blocked for reconstruction**.

