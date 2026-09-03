import type {
  AuthContext,
  ExecutionContextSnapshot,
  IExecutionContext,
  IRequestContext,
  ITenantContext,
  IUserContext,
  IWorkspaceContext
} from "@veltryx/contracts";

import { createExecutionContextSnapshot } from "./context-snapshot.js";

export class KernelExecutionContext implements IExecutionContext {
  readonly tenant: string;
  readonly workspace?: string;
  readonly user?: string;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
  readonly requestId: string;
  readonly correlationId: string;
  readonly metadata: Readonly<Record<string, unknown>>;

  constructor(
    readonly tenantContext: ITenantContext,
    readonly workspaceContext: IWorkspaceContext | undefined,
    readonly userContext: IUserContext | undefined,
    readonly requestContext: IRequestContext,
    roles: readonly string[],
    permissions: readonly string[],
    readonly locale: string,
    readonly timezone: string,
    metadata: Readonly<Record<string, unknown>>,
    readonly createdAt: Date
    , readonly auth?: AuthContext
  ) {
    this.tenant = tenantContext.tenantId;
    this.workspace = workspaceContext?.workspaceId;
    this.user = userContext?.userId;
    this.roles = Object.freeze([...roles]);
    this.permissions = Object.freeze([...permissions]);
    this.requestId = requestContext.requestId;
    this.correlationId = requestContext.correlationId;
    this.metadata = deepFreeze(cloneValue(metadata)) as Readonly<Record<string, unknown>>;
    Object.freeze(this);
  }

  snapshot(): ExecutionContextSnapshot {
    return createExecutionContextSnapshot(this);
  }
}
function cloneValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(cloneValue);
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [key, cloneValue(nestedValue)]));
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
