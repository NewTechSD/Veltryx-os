import { randomUUID } from "node:crypto";

import type {
  ExecutionContextInput,
  IExecutionContext,
  IExecutionContextFactory,
  IExecutionContextValidator,
  ITenantContext,
  IUserContext,
  IWorkspaceContext
} from "@veltryx/contracts";

import { KernelExecutionContext } from "./execution-context.js";
import { KernelRequestContext } from "./request-context.js";
import { KernelTenantContext } from "./tenant-context.js";
import { KernelExecutionContextValidator } from "./context-validator.js";
import { KernelUserContext } from "./user-context.js";
import { KernelWorkspaceContext } from "./workspace-context.js";

export class KernelExecutionContextFactory implements IExecutionContextFactory {
  constructor(
    private readonly validator: IExecutionContextValidator = new KernelExecutionContextValidator(),
    private readonly idGenerator: () => string = randomUUID,
    private readonly now: () => Date = () => new Date()
  ) {}

  create(input: ExecutionContextInput = {}): IExecutionContext {
    const requestId = input.requestContext?.requestId ?? input.requestId ?? this.idGenerator();
    const correlationId =
      input.requestContext?.correlationId ?? input.correlationId ?? requestId;
    const tenantContext = createTenantContext(input);
    const workspaceContext = createWorkspaceContext(input);
    const userContext = createUserContext(input);
    const roles = input.roles ?? input.auth?.principal.roles ?? userContext?.roles ?? [];
    const permissions = input.permissions ?? userContext?.permissions ?? [];
    const locale = input.locale ?? "en-US";
    const timezone = input.timezone ?? "UTC";
    const createdAt = input.createdAt ? new Date(input.createdAt.getTime()) : this.now();

    const normalizedInput: ExecutionContextInput = {
      ...input,
      tenant: tenantContext.tenantId,
      tenantContext,
      workspace: workspaceContext?.workspaceId,
      workspaceContext,
      user: userContext?.userId,
      userContext,
      roles,
      permissions,
      locale,
      timezone,
      requestId,
      correlationId,
      requestContext: {
        requestId,
        correlationId,
        source: input.requestContext?.source ?? input.source,
        ip: input.requestContext?.ip ?? input.ip,
        userAgent: input.requestContext?.userAgent ?? input.userAgent
      },
      metadata: input.metadata ?? {},
      createdAt,
      auth: input.auth
    };
    const validation = this.validator.validate(normalizedInput);

    if (!validation.valid) {
      throw new Error(
        `Invalid execution context: ${validation.issues.map((issue) => issue.message).join("; ")}`
      );
    }

  return new KernelExecutionContext(
      tenantContext,
      workspaceContext,
      userContext,
      new KernelRequestContext(
        requestId,
        correlationId,
        normalizedInput.requestContext?.source,
        normalizedInput.requestContext?.ip,
        normalizedInput.requestContext?.userAgent
      ),
      roles,
      permissions,
      locale,
      timezone,
      input.metadata ?? {},
      createdAt,
      input.auth
    );
  }
}

function createTenantContext(input: ExecutionContextInput): ITenantContext {
  return new KernelTenantContext(
    input.auth?.tenant.id ?? input.tenantContext?.tenantId ?? input.tenantId ?? input.tenant ?? "system",
    input.auth?.tenant.slug ?? input.tenantContext?.tenantSlug ?? input.tenantSlug,
    input.auth?.tenant.name ?? input.tenantContext?.tenantName ?? input.tenantName,
    input.tenantContext?.status ?? input.tenantStatus ?? "active"
  );
}

function createWorkspaceContext(input: ExecutionContextInput): IWorkspaceContext | undefined {
  const workspaceId = input.auth?.workspace.id ?? input.workspaceContext?.workspaceId ?? input.workspaceId ?? input.workspace;

  if (!workspaceId) {
    return undefined;
  }

  return new KernelWorkspaceContext(
    workspaceId,
    input.auth?.workspace.slug ?? input.workspaceContext?.workspaceSlug ?? input.workspaceSlug,
    input.auth?.workspace.name ?? input.workspaceContext?.workspaceName ?? input.workspaceName
  );
}

function createUserContext(input: ExecutionContextInput): IUserContext | undefined {
  const userId = input.auth?.principal.kind === "anonymous" ? undefined : input.auth?.principal.id ?? input.userContext?.userId ?? input.userId ?? input.user;

  if (!userId) {
    return undefined;
  }

  return new KernelUserContext(
    userId,
    input.userContext?.email ?? input.email,
    input.userContext?.name ?? input.name,
    input.auth?.principal.roles ?? input.userContext?.roles ?? input.roles ?? [],
    input.userContext?.permissions ?? input.permissions ?? []
  );
}
