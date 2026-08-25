# Execution Context

## Objetivo

Documentar o Execution Context oficial implementado na TASK-0301 / IMP-0012.

Execution Context representa o contexto operacional de uma execucao na plataforma. Ele fornece dados estruturais de tenant, workspace, usuario, roles, permissions, locale, timezone, requestId, correlationId, metadata e createdAt para consumo futuro por Runtime, Event Bus, Metadata Engine, Permission Engine, Auth e modulos.

Esta implementacao nao cria autenticacao, autorizacao, usuarios, sessoes, tokens, banco, API ou middleware HTTP.

## Componentes

- `KernelExecutionContext`: estrutura principal do contexto operacional.
- `KernelTenantContext`: representacao estrutural do tenant.
- `KernelWorkspaceContext`: representacao opcional do workspace.
- `KernelUserContext`: representacao estrutural de uma identidade autenticavel futuramente.
- `KernelRequestContext`: representacao estrutural de request e correlacao.
- `KernelExecutionContextFactory`: factory para criacao controlada de contextos validos.
- `KernelExecutionContextValidator`: validador estrutural do contexto.
- `createExecutionContextSnapshot`: gera snapshot imutavel para logs, eventos e auditoria futura.

## Contratos

Contratos publicos em `@veltryx/contracts`:

- `IExecutionContext`
- `ITenantContext`
- `IWorkspaceContext`
- `IUserContext`
- `IRequestContext`
- `IExecutionContextFactory`
- `IExecutionContextValidator`
- `ExecutionContextSnapshot`

## Estrutura

O contexto principal preserva compatibilidade com os campos historicos:

- `tenant`
- `workspace`
- `user`
- `roles`
- `permissions`
- `locale`
- `timezone`
- `requestId`
- `correlationId`

E adiciona estruturas oficiais:

- `tenantContext`
- `workspaceContext`
- `userContext`
- `requestContext`
- `metadata`
- `createdAt`
- `snapshot()`

## Defaults

A factory aplica defaults estruturais:

- tenant padrao: `system`;
- locale padrao: `en-US`;
- timezone padrao: `UTC`;
- roles padrao: lista vazia;
- permissions padrao: lista vazia;
- metadata padrao: objeto vazio;
- requestId e gerado quando ausente;
- correlationId usa valor informado ou o requestId quando ausente.

## Validacao

O validator executa somente validacao estrutural:

- tenant deve existir apos normalizacao;
- requestId deve existir apos criacao;
- correlationId deve existir apos criacao;
- locale deve ter formato estrutural simples;
- timezone deve ter formato estrutural simples;
- roles devem ser lista de strings nao vazias;
- permissions devem ser lista de strings nao vazias.

Nao ha validacao de usuario real, permissao real, tenant em banco ou sessao autenticada.

## Snapshot

Snapshot e uma copia imutavel do contexto para:

- auditoria futura;
- propagacao para eventos;
- logs estruturais;
- protecao contra mutacao acidental.

O snapshot nao deve ser usado como mecanismo de autorizacao.

## Fora do escopo

- Auth.
- Login.
- Sessions.
- JWT.
- OAuth.
- RBAC real.
- ABAC real.
- Permission Engine.
- Tenant Repository.
- User Repository.
- Banco.
- API.
- Middleware HTTP.
- Runtime Execution.
- Event Bus operacional.
- Metadata Engine.

## Event Bus

O Event Bus em memoria aceita ExecutionContextSnapshot em EventEnvelope.contextSnapshot e preserva campos estruturais como equestId, correlationId, 	enantId, workspaceId e userId quando informados. O contexto propagado em eventos nao implementa Auth, autorizacao ou Permission Engine.

