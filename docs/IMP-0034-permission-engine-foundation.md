# IMP-0034: Permission Engine Foundation

Status: Blocked

Version: 0.1

Type: Implementation Plan proposto

Owner: Maintainer de Core/Contracts (designacao pendente)

Reviewers: Architecture Owner e reviewer de seguranca (designacao pendente)

Created: 2026-10-24

Last Updated: 2026-10-24

Task proposta: TASK-0318

Depends On: RFC-0010 Draft, RFC-0001, RFC-0002, RFC-0004, RFC-0006, RFC-0011, RFC-0099, IMP-0033

Supersedes: None

## Objetivo e bloqueio

Materializar o avaliador puro descrito na [RFC-0010](../rfc/RFC-0010-permission-engine.md), com negacao por padrao e politicas fornecidas por origem confiavel. A RFC-0010 ainda e Draft: este plano nao autoriza implementacao.

## Escopo proposto

- Contratos declarativos de resource/action, entrada, decisao e provider de politica.
- Catalogo namespaced com owner e versao; concessoes exatas por scope.
- Avaliador deterministico sem dependencia de Next, React, HTTP, banco ou identidade externa.
- Provider em memoria injetado por composition root confiavel apenas para provas de contrato.
- Resultados imutaveis e reasonCodes seguros; falhas do provider negam acesso.
- Testes de isolamento de decisao por principal/tenant/workspace e negativa explicita.

## Fora do escopo

Login, JWT, cookies, sessao real, memberships persistidas, alteracao das rotas publicas atuais, CRUD, grants recebidos por HTTP, wildcard, bypass automatico de system/admin, ABAC generico, cache, banco e claims de isolamento operacional.

## Contratos a fixar antes de iniciar

| Elemento | Decisao proposta                                                                        |
| -------- | --------------------------------------------------------------------------------------- |
| Recurso  | namespace + resource + owner + version; acao registrada explicitamente                  |
| Entrada  | principal confiavel, tenant/workspace, resource/action, policyVersion e objeto opcional |
| Decisao  | allow/deny, reasonCode e policyVersion; sem expor grants completos                      |
| Politica | provider confiavel; grants por principal/role e scope exato; deny prevalece             |
| Falha    | entrada invalida, scope inconsistente ou provider indisponivel resultam em deny seguro  |

Nomes finais de exports/tokens e reasonCodes precisam constar na revisao aprovada deste IMP. Tipos propostos da RFC nao sao exports existentes. Se a decisao demandar contrato estrutural diferente, revisar a RFC antes do codigo.

## Plano de implementacao apos aprovacao

1. Fixar contratos e fixture de politica no contexto da RFC-0010; revisar exports publicos sem alterar os existentes.
2. Implementar catalogo/validator e avaliador sem transporte, efeitos de dominio ou persistencia.
3. Tratar grant ausente, deny explicito, resource/action desconhecido, principal inativo e scope incorreto.
4. Integrar por token publico apenas onde autorizado; nenhuma rota protegida passa a existir por esta etapa.
5. Executar testes, checar imports e atualizar docs tecnicos, status, roadmap e indice.
6. Submeter review tecnico e registrar aceite antes de declarar Done.

## Matriz de testes obrigatoria

| Caso                                                  | Resultado esperado                   |
| ----------------------------------------------------- | ------------------------------------ |
| Sem grants / recurso desconhecido / acao desconhecida | deny                                 |
| Grant exato + principal ativo + scope correto         | allow                                |
| Grant e deny concorrentes                             | deny                                 |
| Grant do tenant A aplicado ao B                       | deny                                 |
| Workspace sem vinculo ao tenant avaliado              | deny                                 |
| Principal inativo / contexto inconsistente            | deny                                 |
| Role `admin` sem grant / principal system sem grant   | deny                                 |
| Provider falha ou retorna politica invalida           | deny e codigo seguro                 |
| Entrada ou politica mutada pelo chamador              | decisao e dados publicados nao mudam |
| Header ou menu sugere permissao                       | nenhuma concessao criada             |

Unit tests validam precedencia/validacao; integration tests validam provider/token/contexto de origem confiavel. E2E web de login e tenant pertence ao IMP operacional futuro, nao a este avaliador puro.

## Verificacoes e documentacao

Executar build, lint, typecheck e suite afetada; aplicar checklist oficial. Criar documentacao tecnica do Permission Engine somente quando os contratos forem materializados, atualizar Development Status, API docs se algum comportamento aprovado mudar e esta trilha de dependencias.

## Riscos e ADRs

- Confundir avaliacao pura com enforcement completo: manter limitacao explicita.
- Aceitar input controlado pelo cliente como grant: proibido.
- Introduzir politica global permissiva para facilitar demo: proibido.
- Cache e armazenamento de politicas ficam fora; se introduzidos, exigem revisao de escopo.
- Nao ha selecao tecnologica local nesta entrega que exija ADR; uma escolha futura deve ser avaliada antes de implementada.

## Gate de inicio e aceite

- [ ] Architecture Owner e reviewers designados.
- [ ] RFC-0010 aprovada via Cross Review.
- [ ] IMP-0034 revisado e aprovado.
- [ ] Nomes finais, tokens, reasonCodes e relacoes de workspace fixados.
- [ ] Contratos atuais preservados e Dependency Graph revisado.
- [ ] Matriz de testes executada e review registrado.
- [ ] Documentacao atualizada e riscos residuais aceitos.

Historico: 2026-10-24 — proposta preparada por Codex; nenhum codigo implementado.
