# RFC-0018: Deployment e Release

Status: Draft

Version: 0.1

Type: RFC arquitetural

Owner: Architecture Owner (designacao nominal pendente)

Reviewers: Maintainers dos contratos impactados (designacao pendente)

Created: 2026-10-24

Last Updated: 2026-10-24

Depends On: RFC-0001, RFC-0004, RFC-0017, RFC-0099

Impacts: Core, Runtime, Contracts e consumidores descritos abaixo

Supersedes: None

Proposta para revisao. Nao autoriza implementacao nem altera RFC Approved/Frozen.

## Indice

1. [Visao geral](#1-visao-geral)
2. [Objetivos e fronteiras](#2-objetivos-e-fronteiras)
3. [Arquitetura proposta](#3-arquitetura-proposta)
4. [Contratos publicos](#4-contratos-publicos)
5. [Seguranca e observabilidade](#5-seguranca-e-observabilidade)
6. [Compatibilidade e alternativas](#6-compatibilidade-e-alternativas)
7. [Criterios de aceite](#7-criterios-de-aceite)
8. [Riscos e decisoes pendentes](#8-riscos-e-decisoes-pendentes)
9. [Glossario e referencias](#9-glossario-e-referencias)
10. [Revisao e aprovacao](#10-revisao-e-aprovacao)

## 1. Visao geral

O repositorio tem um preview PM2 e instrucoes operacionais. A proposta define release rastreavel e reversivel do Control Plane; delivery de sites continua limitado pela RFC-0008.

## 2. Objetivos e fronteiras

Operacao do Control Plane; sem publicar sites, escolher Kubernetes, CI provider ou alterar infraestrutura do servidor nesta tarefa.

A capacidade pertence ao owner descrito pelos contratos; transporte, UI e infraestrutura concreta ficam nas bordas. Modules e Plugins consomem apenas contratos publicos. Nenhuma regra de negocio passa a pertencer ao Kernel por esta proposta.

## 3. Arquitetura proposta

Release identifica commit, lockfile, versoes de runtime e configuracao publica, checks executados e artefato imutavel. Secrets ficam fora do artefato e sao injetados por ambiente em fronteira de infraestrutura. Development, preview e production usam configuracoes distintas.

O pipeline prepara dependencias com lockfile congelado, executa build, lint, typecheck e testes, produz artefato e promove a mesma revisao. A versao ativa deve ser verificavel. Deploy inclui smoke tests e readiness das capacidades anunciadas. Falha interrompe promocao e preserva ou restaura a versao anterior.

Rollback de codigo nao desfaz dados. Migrations futuras seguem expand/contract e politica de compatibilidade, backup e restauracao testada conforme RFC-0020. Migracao irreversivel impede promessa de rollback automatico.

Preview atual permanece sem dados reais de clientes. Antes de producao com dados protegidos, sao obrigatorias autenticacao, permission enforcement, isolamento de tenant, persistencia duravel, gestao de secrets, auditoria e plano de recuperacao. Esta RFC nao transforma o preview em producao por renomear uma variavel.

Fluxo conceitual:

Pinned Source -> Checks -> Immutable Artifact -> Environment -> Readiness -> Promote / Restore.

## 4. Contratos publicos

Nomes propostos, ainda nao exportados nem garantidos como API estavel:

| Contrato proposto            | Responsabilidade                                     |
| ---------------------------- | ---------------------------------------------------- |
| ReleaseManifest              | Commit, artefato, runtime, checks e compatibilidade  |
| DeploymentResult             | Ambiente, revisao, status e correlacao               |
| PromotionGate / RollbackPlan | Evidencias e limites para promover ou restaurar      |
| RecoveryEvidence             | Backup, restore ensaiado e dependencia de migrations |

Novos tokens, entradas e resultados devem ser fixados por IMP apos aprovacao arquitetural. Resultados esperados devem distinguir sucesso, negativa, conflito, indisponibilidade e entrada invalida quando aplicavel.

## 5. Seguranca e observabilidade

Contexto operacional nao e prova de autorizacao. Tenant/workspace, principal e permissoes precisam de origem confiavel em operacoes protegidas. Nao registrar secrets, credenciais ou payloads sensiveis em diagnostics. Falhas esperadas produzem codigo seguro, resultado e correlacao. Auditoria duravel nao pode ser prometida pelo provider em memoria.

Revisoes de contratos e resultados devem permitir rastrear operacao, owner, requestId/correlationId e scope quando aplicavel. A RFC-0017 propoe portas de sinais; sua ausencia nao dispensa erros seguros no MVP.

## 6. Compatibilidade e alternativas

A proposta e aditiva; nao remove nem altera exports atuais. Consumo de nova capacidade depende de declaracao explicita, nunca de deteccao silenciosa. Contratos publicados preservam semantica e versionamento; incompatibilidade exige major, migracao e nova revisao conforme RFC-0099.

Forward compatibility nao permite ignorar campos de seguranca, capabilities obrigatorias ou versoes desconhecidas: estes casos falham de forma explicita. Migracao e rollout sao responsabilidade do IMP consumidor; nao ha migracao executada nesta alteracao documental.

Alternativas consideradas: acoplar a capacidade ao Admin simplifica o primeiro consumidor, mas impede reuso e viola as fronteiras; expandir implicitamente contratos existentes evita novos nomes, mas esconde mudanca de semantica. A proposta prefere portas pequenas e explicitas.

## 7. Criterios de aceite

- Reproduzir artefato com lockfile e runtime registrados.
- Falha de smoke/readiness impede promocao.
- Identificar revisao ativa e restaurar anterior em ensaio documentado.
- Nenhum secret aparece em artefato, frontend ou logs publicos.
- Ensaio de restore valida backup antes de anunciar recuperacao.
- Declarar indisponibilidade tolerada e rollback de dados separadamente do codigo.

## 8. Riscos e decisoes pendentes

RPO, RTO, janela de manutencao e metas de disponibilidade devem ser aprovados pelo operador. O PM2 existente usa PORT=3100 e nao declara bind 127.0.0.1; exposicao deve ser verificada.

Escopo excessivo e aprovacao conjunta sem revisar dependencias podem criar falsa prontidao. Aprovar a RFC nao significa aprovar todos os adapters ou IMPs consumidores. A sequencia esta em [Implementation Roadmap](../docs/IMPLEMENTATION-ROADMAP.md).

## 9. Glossario e referencias

Release: artefato rastreavel. Promotion: tornar revisao ativa. RPO/RTO: perdas e tempo de recuperacao aceitos.

Dependencias normativas: RFC-0001, RFC-0004, RFC-0017, RFC-0099. Relacoes de consumo e dependencias opcionais estao no [Dependency Graph](../docs/DEPENDENCY-GRAPH.md). A [revisao documental](../docs/DOCUMENTATION-REVIEW.md) registra compatibilidade preliminar e bloqueios. Decisoes desta RFC permanecem propostas ate aprovacao.

## 10. Revisao e aprovacao

- [x] Objetivo, escopo, contratos, alternativas e criterios de aceite documentados.
- [x] Riscos, seguranca, tenancy e compatibilidade avaliados preliminarmente.
- [ ] Owners/reviewers nominais designados.
- [ ] Dependencias Draft aprovadas para a entrega pretendida.
- [ ] Cross Review formal concluido pelos owners afetados.
- [ ] Pendencias do IMP correspondente resolvidas.
- [ ] Decisao de aprovacao registrada pelo Architecture Owner.

Historico: 2026-10-24 — proposta documental preparada por Codex; sem implementacao, aprovacao ou mudanca de status de contratos existentes.
