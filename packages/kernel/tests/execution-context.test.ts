import { describe, expect, it } from "vitest";
import type { ExecutionContextInput } from "@veltryx/contracts";

import {
  KernelExecutionContextFactory,
  KernelExecutionContextValidator,
  KernelRequestContext,
  KernelTenantContext,
  KernelUserContext,
  KernelWorkspaceContext,
  createExecutionContext,
  createExecutionContextSnapshot
} from "../src/index.js";

const createdAt = new Date("2026-08-18T12:00:00.000Z");

function factory(ids: readonly string[] = ["req-generated", "corr-generated"]): KernelExecutionContextFactory {
  let index = 0;

  return new KernelExecutionContextFactory(
    undefined,
    () => ids[index++] ?? "generated-id",
    () => createdAt
  );
}

describe("KernelExecutionContextFactory", () => {
  it("creates a valid execution context", () => {
    const context = factory().create({
      tenantId: "tenant-1",
      tenantSlug: "acme",
      tenantName: "Acme",
      workspaceId: "workspace-1",
      workspaceSlug: "ops",
      workspaceName: "Operations",
      userId: "user-1",
      email: "user@example.com",
      name: "User One",
      roles: ["admin"],
      permissions: ["kernel.read"],
      locale: "pt-BR",
      timezone: "America/Sao_Paulo",
      requestId: "req-1",
      correlationId: "corr-1",
      source: "unit-test",
      ip: "127.0.0.1",
      userAgent: "vitest",
      metadata: { trace: { sampled: true } }
    });

    expect(context).toMatchObject({
      tenant: "tenant-1",
      workspace: "workspace-1",
      user: "user-1",
      roles: ["admin"],
      permissions: ["kernel.read"],
      locale: "pt-BR",
      timezone: "America/Sao_Paulo",
      requestId: "req-1",
      correlationId: "corr-1",
      createdAt
    });
    expect(context.tenantContext).toEqual({
      tenantId: "tenant-1",
      tenantSlug: "acme",
      tenantName: "Acme",
      status: "active"
    });
    expect(context.workspaceContext).toEqual({
      workspaceId: "workspace-1",
      workspaceSlug: "ops",
      workspaceName: "Operations"
    });
    expect(context.userContext).toEqual({
      userId: "user-1",
      email: "user@example.com",
      name: "User One",
      roles: ["admin"],
      permissions: ["kernel.read"]
    });
    expect(context.requestContext).toEqual({
      requestId: "req-1",
      correlationId: "corr-1",
      source: "unit-test",
      ip: "127.0.0.1",
      userAgent: "vitest"
    });
  });

  it("creates a minimum context with defaults", () => {
    const context = factory(["req-generated"]).create();

    expect(context).toMatchObject({
      tenant: "system",
      roles: [],
      permissions: [],
      locale: "en-US",
      timezone: "UTC",
      requestId: "req-generated",
      correlationId: "req-generated",
      metadata: {},
      createdAt
    });
    expect(context.workspace).toBeUndefined();
    expect(context.workspaceContext).toBeUndefined();
    expect(context.user).toBeUndefined();
    expect(context.userContext).toBeUndefined();
  });

  it("preserves legacy tenant, workspace and user inputs", () => {
    const context = factory().create({ tenant: "tenant-legacy", workspace: "workspace-legacy", user: "user-legacy" });

    expect(context.tenant).toBe("tenant-legacy");
    expect(context.tenantContext.tenantId).toBe("tenant-legacy");
    expect(context.workspace).toBe("workspace-legacy");
    expect(context.workspaceContext?.workspaceId).toBe("workspace-legacy");
    expect(context.user).toBe("user-legacy");
    expect(context.userContext?.userId).toBe("user-legacy");
  });

  it("generates requestId and correlationId when absent", () => {
    const context = factory(["req-1"]).create({ tenant: "tenant-1" });

    expect(context.requestId).toBe("req-1");
    expect(context.correlationId).toBe("req-1");
  });


  it("prefers structured nested context input when provided", () => {
    const explicitCreatedAt = new Date("2026-08-18T13:00:00.000Z");
    const context = factory().create({
      tenant: "tenant-legacy",
      tenantId: "tenant-flat",
      tenantContext: {
        tenantId: "tenant-structured",
        tenantSlug: "structured",
        tenantName: "Structured Tenant",
        status: "suspended"
      },
      workspace: "workspace-legacy",
      workspaceId: "workspace-flat",
      workspaceContext: {
        workspaceId: "workspace-structured",
        workspaceSlug: "structured-workspace",
        workspaceName: "Structured Workspace"
      },
      user: "user-legacy",
      userId: "user-flat",
      userContext: {
        userId: "user-structured",
        email: "structured@example.com",
        name: "Structured User",
        roles: ["owner"],
        permissions: ["kernel.manage"]
      },
      roles: ["ignored-role"],
      permissions: ["ignored-permission"],
      requestId: "ignored-request",
      correlationId: "ignored-correlation",
      requestContext: {
        requestId: "structured-request",
        correlationId: "structured-correlation",
        source: "structured-source",
        ip: "10.0.0.1",
        userAgent: "structured-agent"
      },
      metadata: { list: ["before"] },
      createdAt: explicitCreatedAt
    });

    explicitCreatedAt.setFullYear(2030);

    expect(context).toMatchObject({
      tenant: "tenant-structured",
      workspace: "workspace-structured",
      user: "user-structured",
      roles: ["ignored-role"],
      permissions: ["ignored-permission"],
      requestId: "structured-request",
      correlationId: "structured-correlation",
      createdAt: new Date("2026-08-18T13:00:00.000Z")
    });
    expect(context.tenantContext.status).toBe("suspended");
    expect(context.requestContext).toMatchObject({
      source: "structured-source",
      ip: "10.0.0.1",
      userAgent: "structured-agent"
    });
    expect(context.metadata).toEqual({ list: ["before"] });
  });
  it("rejects invalid normalized contexts", () => {
    expect(() => factory().create({ tenant: "", requestId: "req-1", correlationId: "corr-1" })).toThrow(
      "Invalid execution context: tenant must be a non-empty string"
    );
  });

  it("creates immutable context data protected from input mutation", () => {
    const roles = ["admin"];
    const permissions = ["kernel.read"];
    const metadata = { nested: { value: "before" } };
    const context = factory().create({ roles, permissions, metadata });

    roles.push("mutated");
    permissions.push("kernel.write");
    metadata.nested.value = "after";

    expect(context.roles).toEqual(["admin"]);
    expect(context.permissions).toEqual(["kernel.read"]);
    expect(context.metadata).toEqual({ nested: { value: "before" } });
    expect(Object.isFrozen(context)).toBe(true);
    expect(Object.isFrozen(context.roles)).toBe(true);
    expect(Object.isFrozen(context.metadata)).toBe(true);
  });
});

describe("KernelExecutionContextValidator", () => {
  it("accepts a valid context input", () => {
    const validator = new KernelExecutionContextValidator();

    expect(
      validator.validate({ tenant: "tenant-1", requestId: "req-1", correlationId: "corr-1", locale: "en-US", timezone: "UTC" })
    ).toEqual({ valid: true, issues: [] });
  });

  it("rejects invalid requestId and correlationId", () => {
    const validator = new KernelExecutionContextValidator();

    expect(validator.validate({ tenant: "tenant-1", requestId: "", correlationId: "" }).issues).toEqual(
      expect.arrayContaining([
        { field: "requestId", message: "requestId must be a non-empty string" },
        { field: "correlationId", message: "correlationId must be a non-empty string" }
      ])
    );
  });

  it("rejects invalid locale and timezone", () => {
    const validator = new KernelExecutionContextValidator();

    const result = validator.validate({
      tenant: "tenant-1",
      requestId: "req-1",
      correlationId: "corr-1",
      locale: "portuguese",
      timezone: "Sao_Paulo"
    });

    expect(result.issues).toEqual(
      expect.arrayContaining([
        { field: "locale", message: "locale must use a structural locale format" },
        { field: "timezone", message: "timezone must use a structural timezone format" }
      ])
    );
  });

  it("rejects malformed roles and permissions", () => {
    const validator = new KernelExecutionContextValidator();
    const input = {
      tenant: "tenant-1",
      requestId: "req-1",
      correlationId: "corr-1",
      roles: ["admin", ""],
      permissions: "kernel.read",
      userContext: {
        userId: "user-1",
        roles: "admin",
        permissions: ["kernel.read", ""]
      }
    } as unknown as ExecutionContextInput;

    expect(validator.validate(input).issues).toEqual(
      expect.arrayContaining([
        { field: "roles", message: "roles must be an array of strings" },
        { field: "permissions", message: "permissions must be an array of strings" },
        { field: "userContext.roles", message: "userContext.roles must be an array of strings" },
        {
          field: "userContext.permissions",
          message: "userContext.permissions must be an array of strings"
        }
      ])
    );
  });
});

describe("Execution Context Snapshot", () => {
  it("generates a snapshot with minimum log and audit data", () => {
    const context = factory().create({ tenant: "tenant-1", user: "user-1", requestId: "req-1", correlationId: "corr-1" });

    expect(context.snapshot()).toMatchObject({
      tenant: "tenant-1",
      user: "user-1",
      requestId: "req-1",
      correlationId: "corr-1",
      tenantContext: { tenantId: "tenant-1" },
      requestContext: { requestId: "req-1", correlationId: "corr-1" },
      createdAt
    });
  });


  it("generates an immutable minimal snapshot", () => {
    const context = factory().create({ tenant: "tenant-1", requestId: "req-1", metadata: { tags: ["audit"] } });
    const snapshot = context.snapshot();

    expect(snapshot.workspaceContext).toBeUndefined();
    expect(snapshot.userContext).toBeUndefined();
    expect(snapshot.correlationId).toBe("req-1");
    expect(snapshot.metadata).toEqual({ tags: ["audit"] });
    expect(Object.isFrozen(snapshot.metadata)).toBe(true);
  });
  it("does not change when source input is mutated after context creation", () => {
    const metadata = { audit: { level: "before" } };
    const context = factory().create({ tenant: "tenant-1", metadata });
    const snapshot = createExecutionContextSnapshot(context);

    metadata.audit.level = "after";

    expect(snapshot.metadata).toEqual({ audit: { level: "before" } });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.metadata)).toBe(true);
  });
});

describe("Context value objects", () => {
  it("creates frozen tenant, workspace, user and request contexts", () => {
    const tenant = new KernelTenantContext("tenant-1", "acme", "Acme", "active");
    const workspace = new KernelWorkspaceContext("workspace-1", "ops", "Operations");
    const user = new KernelUserContext("user-1", "user@example.com", "User", ["admin"], ["kernel.read"]);
    const request = new KernelRequestContext("req-1", "corr-1", "test", "127.0.0.1", "vitest");

    expect(Object.isFrozen(tenant)).toBe(true);
    expect(Object.isFrozen(workspace)).toBe(true);
    expect(Object.isFrozen(user)).toBe(true);
    expect(Object.isFrozen(request)).toBe(true);
  });

  it("keeps the createExecutionContext compatibility helper", () => {
    expect(createExecutionContext({ requestId: "req-1", correlationId: "corr-1" })).toMatchObject({
      tenant: "system",
      requestId: "req-1",
      correlationId: "corr-1"
    });
  });
});