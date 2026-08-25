import type { ExecutionContextSnapshot, IExecutionContext } from "@veltryx/contracts";

export function createExecutionContextSnapshot(context: IExecutionContext): ExecutionContextSnapshot {
  return deepFreeze({
    tenant: context.tenant,
    workspace: context.workspace,
    user: context.user,
    roles: [...context.roles],
    permissions: [...context.permissions],
    locale: context.locale,
    timezone: context.timezone,
    requestId: context.requestId,
    correlationId: context.correlationId,
    tenantContext: { ...context.tenantContext },
    workspaceContext: context.workspaceContext ? { ...context.workspaceContext } : undefined,
    userContext: context.userContext
      ? {
          ...context.userContext,
          roles: [...context.userContext.roles],
          permissions: [...context.userContext.permissions]
        }
      : undefined,
    requestContext: { ...context.requestContext },
    metadata: cloneValue(context.metadata) as Readonly<Record<string, unknown>>,
    createdAt: new Date(context.createdAt.getTime())
  });
}

function cloneValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(cloneValue);
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, cloneValue(nestedValue)])
    );
  }

  return value;
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }

  for (const nestedValue of Object.values(value)) {
    deepFreeze(nestedValue);
  }

  return Object.freeze(value);
}