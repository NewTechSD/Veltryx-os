export type TenantStatus = "active" | "inactive" | "suspended";

export interface ITenantContext {
  readonly tenantId: string;
  readonly tenantSlug?: string;
  readonly tenantName?: string;
  readonly status: TenantStatus;
}

export interface IWorkspaceContext {
  readonly workspaceId: string;
  readonly workspaceSlug?: string;
  readonly workspaceName?: string;
}

export interface IUserContext {
  readonly userId: string;
  readonly email?: string;
  readonly name?: string;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
}

export interface IRequestContext {
  readonly requestId: string;
  readonly correlationId: string;
  readonly source?: string;
  readonly ip?: string;
  readonly userAgent?: string;
}

export interface TenantContext {
  readonly tenant: string;
  readonly tenantContext: ITenantContext;
}

export interface WorkspaceContext {
  readonly workspace?: string;
  readonly workspaceContext?: IWorkspaceContext;
}

export interface UserContext {
  readonly user?: string;
  readonly userContext?: IUserContext;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
}

export interface RequestContext {
  readonly requestId: string;
  readonly correlationId: string;
  readonly requestContext: IRequestContext;
}

export interface CorrelationContext {
  readonly requestId: string;
  readonly correlationId: string;
}

export interface LocaleContext {
  readonly locale: string;
  readonly timezone: string;
}

export interface ExecutionContextSnapshot {
  readonly auth?: AuthContext;
  readonly tenant: string;
  readonly workspace?: string;
  readonly user?: string;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
  readonly locale: string;
  readonly timezone: string;
  readonly requestId: string;
  readonly correlationId: string;
  readonly tenantContext: ITenantContext;
  readonly workspaceContext?: IWorkspaceContext;
  readonly userContext?: IUserContext;
  readonly requestContext: IRequestContext;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly createdAt: Date;
}

export interface IExecutionContext
  extends TenantContext,
    WorkspaceContext,
    UserContext,
    RequestContext,
    LocaleContext {
  readonly auth?: AuthContext;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly createdAt: Date;
  snapshot(): ExecutionContextSnapshot;
}

export interface ExecutionContextInput {
  readonly auth?: AuthContext;
  readonly tenant?: string;
  readonly tenantContext?: Partial<ITenantContext>;
  readonly tenantId?: string;
  readonly tenantSlug?: string;
  readonly tenantName?: string;
  readonly tenantStatus?: TenantStatus;
  readonly workspace?: string;
  readonly workspaceContext?: Partial<IWorkspaceContext>;
  readonly workspaceId?: string;
  readonly workspaceSlug?: string;
  readonly workspaceName?: string;
  readonly user?: string;
  readonly userContext?: Partial<IUserContext>;
  readonly userId?: string;
  readonly email?: string;
  readonly name?: string;
  readonly roles?: readonly string[];
  readonly permissions?: readonly string[];
  readonly locale?: string;
  readonly timezone?: string;
  readonly requestId?: string;
  readonly correlationId?: string;
  readonly source?: string;
  readonly ip?: string;
  readonly userAgent?: string;
  readonly requestContext?: Partial<IRequestContext>;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly createdAt?: Date;
}

export interface ExecutionContextValidationIssue {
  readonly field: string;
  readonly message: string;
}

export interface ExecutionContextValidationResult {
  readonly valid: boolean;
  readonly issues: readonly ExecutionContextValidationIssue[];
}

export interface IExecutionContextValidator {
  validate(input: ExecutionContextInput | IExecutionContext): ExecutionContextValidationResult;
}

export interface IExecutionContextFactory {
  create(input?: ExecutionContextInput): IExecutionContext;
}
import type { AuthContext } from "./auth.js";
