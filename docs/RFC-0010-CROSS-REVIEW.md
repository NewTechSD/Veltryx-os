# RFC-0010 / IMP-0034: revisao cruzada

Data: 2026-10-24.

Documentos revisados: RFC-0010 v0.2 e IMP-0034 v0.2.

Autor da proposta e da revisao tecnica: Codex. Esta e uma revisao documental do mesmo autor, nao uma aprovacao independente nem aceite do owner. A decisao final esta pendente.

Baseline de codigo: `936ddd4`; primeira revisao documental: `c12bc1c`. Nesta continuidade, somente Markdown foi alterado.

## Resultado e recomendacao

A proposta pode seguir para decisao do Architecture Owner no escopo limitado descrito. Nao restam nomes de contrato, tokens, reasonCodes, scopes, precedencia ou lifecycle para o implementador decidir. RFC-0010 passa de Draft para **Review**; IMP-0034 continua **Blocked para codigo** ate aprovacao nominal.

Recomendacao tecnica: aprovar RFC-0010 v0.2 e IMP-0034 v0.2 para implementar o avaliador de permissoes em memoria, com 26 cenarios de aceite. A recomendacao nao autoriza banco, login, protected APIs, grants administrativos ou isolamento operacional de dados.

## Ambiguidades encontradas e resolvidas

| ID  | Problema da v0.1                                                            | Decisao na v0.2                                                                                       | Testes previstos |
| --- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------- |
| R01 | Roles do Principal nao possuem membership escopada                          | Roles legadas nao concedem acesso; provider fornece bindings para principal/scope exatos              | P13, P15         |
| R02 | Scope tenant poderia ser interpretado como concessao em todos os workspaces | Scopes exatos sem heranca; tipo do recurso limita tipo da operacao                                    | P04, P05, P15    |
| R03 | Principal system/admin poderia ganhar bypass                                | System e sujeito comum com grant explicito; anonymous sempre negado                                   | P02, P16         |
| R04 | Sem precedencia entre allow direto e deny de role                           | Deny sempre prevalece; ordem da lista e irrelevante                                                   | P14, P23         |
| R05 | Revisao da politica era mencionada sem semantica                            | expectedPolicyVersion opcional; conflito gera deny; revisao nunca resolve por latest                  | P10              |
| R06 | Resposta do provider poderia ser de outro principal/tenant                  | Snapshot repete lookup; subject/scope divergentes geram negativas distintas                           | P08, P19         |
| R07 | Erro de regra poderia ser ignorado depois de encontrar allow                | Validar snapshot inteiro, inclusive regras nao correspondentes; malformed fail-closed                 | P07, P09         |
| R08 | ID de objeto estava no escopo sem modelo de ownership                       | Object/field authorization fora do MVP; input extra rejeitado explicitamente                          | P01              |
| R09 | Singleton poderia reter contexto entre chamadas                             | Instancia sem estado de request; lookup por tupla completa e intercalacao de promises                 | P19              |
| R10 | Mutacao durante await alteraria decisao                                     | Projetar entrada e capturar catalog.snapshot() antes do await; provider copia snapshots na construcao | P17, P18         |
| R11 | Tokens e integration points estavam pendentes                               | Tres tokens, facade permissions(), defaults vazios e inputs injetaveis opcionais definidos            | P24, P26         |
| R12 | Compartilhar snapshot de catalogo exigiria acesso privado                   | snapshot() e contrato publico de declaracoes imutaveis; nao inclui grants/roles                       | P20, P25         |
| R13 | Criterios de falha nao tinham codigos observaveis                           | 17 reasonCodes e 2 codigos de catalogo; precedencia e nullability de policyVersion definidos          | P01–P23          |

## Comparacao com contratos e documentos existentes

| Fonte                                                            | Regra / evidencia                                                  | Avaliacao da proposta                                                               |
| ---------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| RFC-0001, secoes 13 e 14                                         | Scope tenant e negar por padrao                                    | Atende no nivel da decisao; nao reivindica isolamento de storage                    |
| RFC-0002, secoes 2 e 11                                          | Authorization pertence ao Core e expoe contrato publico            | Avaliador e porta de Core, sem regras de modulo                                     |
| RFC-0004, secoes 7–10 e 14                                       | Tokens, ownership, scope e DI                                      | Usa tokens versionados e singleton sem estado por request; nao altera lifecycles    |
| RFC-0006, secao 13                                               | Permission Resolution antes de acao/exposicao; hidden nao autoriza | Fornece mecanismo futuro; enforcement do pipeline permanece outra entrega           |
| RFC-0011                                                         | Identidade/contexto sem login ou autorizacao                       | Reutiliza tipos; nao transforma AuthBridge em identity provider                     |
| RFC-0013                                                         | API estrutural read-only                                           | Nenhuma rota passa a exigir grants nesta entrega; nenhuma write API adicionada      |
| RFC-0015                                                         | Provider de dados em memoria nao e duravel                         | Permission provider nao usa storage, transacao ou banco por engano                  |
| ADR-0004                                                         | Core/Contracts agnosticos de runtime/framework                     | Nenhum import Next/React/HTTP ou mapping concreto                                   |
| RFC-0099, secoes 4, 6 e 12                                       | Review precede aprovacao; mudancas rastreaveis                     | Revisao registrada, owner ainda precisa decidir; sem promocao automatica a Approved |
| `packages/contracts/src/auth.ts` / `tenant.ts`                   | Principal.roles sem scope; contexts possuem statuses/IDs           | Roles do principal ignoradas; bindings apenas no snapshot confiavel                 |
| `packages/contracts/src/services.ts` / `dependency-injection.ts` | category kernel e lifecycle singleton ja existem                   | Nenhuma extensao incidental de tipos; tres tokens novos e aditivos                  |
| `packages/kernel/src/kernel.ts`                                  | Factories, dependencia injetavel e facade atuais                   | Defaults vazios e campos opcionais preservam callers atuais                         |

As RFCs Approved/Frozen foram usadas como referencia e nao editadas. Os contracts propostos nao existem no codigo; a revisao de compatibilidade e documental, nao compilacao da futura implementacao.

## Dependencias e ausencia de ciclo proposto

Evaluator depende de catalogo e policy provider. Ambos dependem somente de contracts. A facade do Kernel depende do evaluator. Nenhuma dependencia inversa em AuthBridge, Runtime, metadata ou Admin e criada. As RFCs-0019/0020/0017 podem consumir/evoluir a capacidade depois, mas nao sao pre-condicoes deste avaliador isolado.

## Riscos residuais que acompanham a decisao

- A origem confiavel de identidade/contexto/provider e pre-condicao do chamador; a tipagem nao prova autenticacao.
- `allow` nao autoriza automaticamente objeto/field e nao e credencial reutilizavel.
- Nao ha protecao atomica contra revogacao entre decisao e efeito; isso depende de integracao operacional futura.
- Politica invalida bloqueia todo o snapshot, reduzindo disponibilidade em configuracao incorreta de forma deliberada.
- Politicas e catalogos em memoria nao persistem nem substituem um sistema de administracao de grants.

Esses limites estao explicitamente fora do MVP; nenhum foi usado para justificar uma concessao permissiva ou um fallback para outro scope.

## Decisao proposta ao owner

Aprovar **RFC-0010 v0.2** e **IMP-0034 v0.2** para autorizar somente os contratos, catalogo, provider em memoria, avaliador, tokens/facade e testes especificados. Registrar identidade do aprovador, data, versoes e aceite dos riscos residuais. Apos esse registro, promover a RFC para Approved e o IMP para Ready/Approved conforme o registro adotado, sincronizando indice e roadmap.

Aprovador: pendente. Decisao final: pendente. Merge do PR documental e aprovacao arquitetural sao atos distintos; nao inferir um do outro.

## Verificacao desta continuidade

Revisao de nomes/exportacoes existentes, regras de DI, tipos de identidade/scope e dependencias; checagem de links/anchors, formatacao e diff exclusivamente documental. Os 466 testes da baseline foram executados na primeira revisao e nao precisam ser repetidos por esta mudanca de texto. Os 26 cenarios de permissions sao plano de testes futuros, nao testes ja executados.
