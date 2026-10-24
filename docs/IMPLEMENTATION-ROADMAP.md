# Implementation Roadmap do Veltryx OS

Revisao documental: 2026-10-24. Baseline `936ddd4`.

## Regras e estado

Roadmap organiza trabalho; nao aprova arquitetura. `Approved` e status documental de RFC/IMP. Estado de entrega usa: Planned, Blocked, Ready, In Progress, Review ou Done. Nesta revisao, entregas com codigo localizado sao descritas como "presente na baseline", sem inventar aceite formal retroativo.

A plataforma tem implementacao ate IMP-0033. O [estado detalhado](DEVELOPMENT-STATUS.md) substitui a antiga orientacao de iniciar bootstrap. Para prioridade de documentos, consultar o [Architecture Index](architecture-index.md).

## Evidencia recente

| IMP / TASK             | Entrega                             | Commit da baseline historica | Estado                         |
| ---------------------- | ----------------------------------- | ---------------------------- | ------------------------------ |
| IMP-0027 / TASK-0311   | Metadata Engine                     | `4d7063e`                    | Presente                       |
| TASK-0312              | Component Registry + UI Composition | `d1d5e9c`                    | Presente                       |
| IMP-0029 / TASK-0313   | Admin Composition Adapter           | `e7170fe`                    | Presente, limitado ao Admin    |
| IMP-0030 / TASK-0314   | Dynamic Admin Shell                 | `ae8f67f`                    | Presente                       |
| IMP-0031 / TASK-0315   | Data Layer                          | `7a50969`                    | Presente em memoria            |
| IMP-0031B / TASK-0315B | Metadata Persistence                | `6d25dfb`                    | Presente                       |
| IMP-0031C / TASK-0315C | Configuration Persistence           | `41df298`                    | Presente                       |
| IMP-0031D / TASK-0315D | Component Persistence               | `4126c7f`                    | Presente                       |
| IMP-0031E / TASK-0315E | UI Composition Persistence          | `cdc65e6`                    | Presente                       |
| IMP-0031F / TASK-0315F | Snapshot Retention/Audit            | `bb69a24`                    | Presente, sem durabilidade     |
| IMP-0032 / TASK-0316   | API read-only                       | `e049ac9`                    | Presente                       |
| IMP-0033 / TASK-0317   | Auth/Tenant Foundation              | `936ddd4`                    | Presente; sem login/isolamento |

As autorizacoes e referencias de RFC dos IMPs existentes permanecem no [indice](architecture-index.md). A aprovacao de um IMP nao estende seus nao objetivos.

## Proxima entrega concreta

**IMP-0034 / TASK-0318 — Permission Engine Foundation** e a proxima proposta recomendada.

- Prioridade: critica. Complexidade: alta. Estado: **Blocked** pela RFC-0010 Draft e revisao formal.
- Resultado: avaliador puro de permissoes com negacao por padrao, provider confiavel em memoria e testes de scope; sem login, banco ou mudanca de rotas atuais.
- Plano completo: [IMP-0034](IMP-0034-permission-engine-foundation.md).
- Para iniciar: aprovar RFC-0010 e IMP-0034 pelo fluxo da RFC-0099 e registrar owner/reviewers, contratos, riscos e aceite. Nao e necessario aprovar todo o roadmap para esta entrega isolada.

Depois, fechar arquitetura de persistencia duravel e auth operacional antes de integrar dados reais. E possivel implementar/testar avaliador puro em memoria sem alegar seguranca multi-tenant end-to-end.

## Sequencia proposta por dependencia

| Ordem | Entrega futura                           | Base arquitetural                                          | Gate antes de codigo                                                                      |
| ----- | ---------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1     | Permission Engine Foundation             | RFC-0010 + RFCs fundacionais aprovadas                     | RFC-0010 e IMP-0034 aprovados                                                             |
| 2     | Data adapter duravel e consistency ports | RFC-0015 + RFC-0020                                        | RFC-0020 aprovada; ADR de tenancy fisica/adapter; IMP especifico                          |
| 3     | Login, sessao, memberships e isolamento  | RFC-0011 + RFC-0019 + RFC-0010 + RFC-0020                  | RFC-0019 aprovada, estrategia de identidade e IMP; testes cross-tenant                    |
| 4     | Query e futuras APIs de dados            | RFC-0014 + RFC-0010; RFC-0019/0020 para dados reais        | RFC-0014 e extensao de API de dados aprovadas; nao usar RFC-0013 como autorizacao de CRUD |
| 5     | Builder/Application Model                | RFC-0009 + RFC-0005/0006/0007                              | RFC-0009 e IMP aprovados; ativacao protegida depende de 2/3                               |
| 6     | Observabilidade e release operacional    | RFC-0017 + RFC-0018                                        | Sinais, metas e gates aprovados; completar antes de producao                              |
| 7     | Delivery e publicacao de sites           | RFC-0008 + RFC-0009; release/permissions quando aplicaveis | RFC-0008 aprovada, contrato de artifact/adapter, IMP por target                           |
| 8     | Eventos duraveis e workflow              | RFC-0016 + RFC-0012 + RFC-0020                             | Contratos e IMPs aprovados; retry, idempotencia, contexto e recuperacao testados          |
| 9     | Primeiro modulo de negocio               | RFC de dominio propria + contratos da plataforma           | Dominio, regras e aceite especificos; sem presumir Finance Core de outro repositorio      |

A ordem expressa prioridade para integracao operacional, nao uma cadeia de dependencias de compilacao. Observabilidade pode ser especificada e implementada em paralelo logico com as etapas anteriores, por IMP proprio, sem introduzir dependencia do Core em infraestrutura.

## Arquitetura ainda em Draft

RFC-0008, RFC-0009, RFC-0010, RFC-0012, RFC-0014, RFC-0016, RFC-0017, RFC-0018, RFC-0019 e RFC-0020 exigem revisao. Ver [analise preliminar e pendencias](DOCUMENTATION-REVIEW.md). Nao aprovar em lote sem avaliar dependencias e escopo de cada entrega.

## Registro historico de colisoes IMP

Os documentos antigos reaproveitam numeros. Esta revisao preserva os arquivos e registra as colisoes, sem inventar equivalencia ou renumerar entregas aprovadas.

| Numero   | Uso no antigo roadmap macro | Uso na sprint/documentacao tecnica             |
| -------- | --------------------------- | ---------------------------------------------- |
| IMP-0008 | Runtime Adapters            | Module Manifest, SPRINT-0002                   |
| IMP-0009 | Application Model           | Module Discovery, TASK-0202                    |
| IMP-0010 | Auth                        | Dependency Resolver, TASK-0203                 |
| IMP-0011 | RBAC                        | Event Bus, SPRINT-0002                         |
| IMP-0012 | Users                       | Execution Context, TASK-0301                   |
| IMP-0013 | Organizations               | Metadata Registry, SPRINT-0002                 |
| IMP-0014 | Tenants                     | Runtime Context, SPRINT-0002                   |
| IMP-0018 | Queue                       | Event Bus, TASK-0302 no roadmap antigo         |
| IMP-0019 | SDK                         | Structural Events, TASK-0303 no roadmap antigo |
| IMP-0020 | CLI                         | Module Snapshot, TASK-0304 no roadmap antigo   |

Usar caminho + titulo + TASK para interpretar esses registros; numero isolado e ambiguo. As entregas macro futuras acima nao reutilizam esses identificadores. IMP-0034/TASK-0318 e uma nova proposta identificada nesta revisao; seguintes numeros devem ser reservados no indice antes de uso.

## Entregas de longo prazo preservadas como intencao

Organizations/Users/Tenants operacionais dependem da RFC-0019 e contratos de dominio apropriados. Scheduler/Queue dependem do Event System e infraestrutura aprovada. SDK, CLI, plugins e marketplace exigem escopo e IMPs proprios, alem de politica de confianca/versionamento. Nenhum desses itens e anunciado como concluido pelo Shell, pelo discovery em memoria ou pelo Event Bus local.

## Definition of Done para cada entrega

RFC e IMP aprovados; dependencias resolvidas; contratos e ownership definidos; testes unitarios/integracao e E2E quando aplicavel; documentacao atualizada; review e checklist de aceite registrados; riscos residuais declarados; verificacoes de seguranca/tenancy proporcionais ao escopo. Somente entao marcar Done. Detalhes no [Implementation Checklist](IMPLEMENTATION-CHECKLIST.md).

## Historico editorial

2026-10-24 — Codex: substituida a mistura de roadmap macro obsoleto e notas incrementais por baseline com evidencias, registro de colisoes, gates e continuidade proposta. Nenhum status de RFC foi promovido e nenhum aceite de implementacao foi fabricado.
