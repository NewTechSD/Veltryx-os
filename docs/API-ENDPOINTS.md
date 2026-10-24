# API v1: referencia da implementacao atual

Baseline: `936ddd4`. Fontes: `packages/contracts/src/api.ts`, `packages/kernel/src/core/api/runtime-api-bridge.ts` e `apps/admin/app/api/v1/`.

## Escopo

Todas as oito rotas sao GET de leitura estrutural publica. Nao existe autenticacao operacional, enforcement de tenant, API de registros, escrita ou CRUD. Contratos de auth presentes no contexto nao mudam essa limitacao.

| Rota                     | Conteudo principal                                                                   | Limite                                                    |
| ------------------------ | ------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| `/api/v1/health`         | status, appName, appVersion, environment e uptimeMs quando disponivel                | Liveness; nao testa banco, sessao ou prontidao de negocio |
| `/api/v1/status`         | Snapshot sanitizado de status do Kernel                                              | Nao inclui internals nem prova isolamento                 |
| `/api/v1/diagnostics`    | diagnostics, warnings e errors limitados a 50 entradas por grupo                     | Sem stack trace/credenciais                               |
| `/api/v1/runtime/status` | Estado/snapshot sanitizado do Runtime                                                | Estado estrutural                                         |
| `/api/v1/configuration`  | appName, appVersion, environment, runtimeMode, debugEnabled e fontes/chaves publicas | Sem env bruto ou secrets                                  |
| `/api/v1/metadata`       | status e contadores de namespaces/resources/entities/pages, warnings/errors          | Nao retorna registros nem schemas completos               |
| `/api/v1/components`     | status, count, agrupamentos e resumo declarativo dos componentes                     | Nao retorna implementacoes visuais                        |
| `/api/v1/ui-composition` | status, compositionsGenerated, lastSourceType/lastSourceId                           | Nao retorna Composition Tree completa                     |

## Envelope

Sucesso: `ok: true`, `data`, `meta`, `warnings` e `diagnostics`.

Falha: `ok: false`, `error` com `code`, `message`, `statusCode` e detalhes seguros opcionais, alem de `meta`, `warnings` e `diagnostics`.

`meta` inclui apiVersion `v1`, requestId, generatedAt e resumo `auth` quando gerado pelo bridge. runtimeId/environment sao campos opcionais no tipo e nao devem ser presumidos em toda resposta. `meta.auth` atual usa defaults do AuthBridge e hints de scope; nao comprova sessao ou membership.

Respostas do adapter enviam `Cache-Control: no-store` e `X-Content-Type-Options: nosniff`. Nao ha promessa de cache de dados entre requests.

## Headers de contexto

`x-request-id`, `x-correlation-id`, `x-tenant-id` e `x-workspace-id` sao aceitos somente no formato `[a-zA-Z0-9._:-]{1,128}`. Valores invalidos sao descartados. Identificadores de tenant/workspace sao hints estruturais e nao concedem acesso. Modo system e credenciais nao sao lidos de headers pelo adapter.

O requestId aparece na resposta; correlationId entra no contexto de request, mas nao esta no envelope publico atual. O AuthBridge nao interpreta senha, JWT, cookie, OAuth ou sessao real.

## Paginacao: contrato versus HTTP

O bridge valida limit inteiro de 1 a 100 e offset inteiro nao negativo. Apenas `components()` usa esses valores para recortar lista. `metadata()` e `uiComposition()` retornam resumos e validam a entrada sem paginar registros de negocio.

As rotas HTTP atuais passam `{}` ao bridge e **nao interpretam `?limit=` ou `?offset=`**. Portanto query string invalida nao produz, por si so, 400 de paginacao. A validacao 400 pertence ao uso direto do bridge. Paginacao HTTP precisa de implementacao/testes futuros autorizados.

## Falhas e lifecycle

O bridge devolve `api.input.invalidPagination`/400 para entrada invalida direta. `handleApi()` converte excecoes durante a acao em `api.internal.error`/500, sem stack.

As rotas criam/bootstrappam Kernel em `getRuntimeApiBridge()` antes de entrar em `handleApi()`. Uma falha nessa inicializacao nao esta coberta pelo catch do adapter atual; cobertura uniforme exige correcao futura com testes. O novo Kernel por chamada tambem limita a interpretacao de uptime e contadores como estado global do servidor.

Nao ha contrato operacional de 401/403 nesta API publica. Metodos nao implementados e rotas inexistentes ficam sob comportamento do framework; nao sao errors de dominio definidos aqui.

## Exemplos de inspecao local

Com o preview ativo na porta escolhida:

```bash
curl -i http://127.0.0.1:3100/api/v1/health
curl -i http://127.0.0.1:3100/api/v1/status
curl -i -H 'x-request-id: review-001' http://127.0.0.1:3100/api/v1/components
```

Esses comandos sao instrucao de verificacao, nao evidencia de que o servidor foi acessado nesta revisao.

## Fora do contrato atual

OpenAPI completo, API de dados/query, writes, auth enforcement, versionamento de schemas de negocio, rate limiting, idempotencia HTTP e `apps/api` dedicado exigem especificacao e IMP apropriados. [RFC-0013](../rfc/RFC-0013-api-engine.md) nao autoriza esses itens; ver propostas [RFC-0014](../rfc/RFC-0014-query-engine.md), [RFC-0019](../rfc/RFC-0019-operational-auth-tenancy.md) e [RFC-0020](../rfc/RFC-0020-durable-data-access.md).
