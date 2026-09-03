import { describe, expect, it } from "vitest";
import { AuthBridge, createExecutionContext } from "../src/index.js";

describe("Auth/Tenant foundation", () => {
  it("resolves anonymous default context safely", () => {
    const bridge = new AuthBridge();
    const context = bridge.resolve();
    expect(context.principal).toMatchObject({ id: "anonymous", kind: "anonymous", roles: [] });
    expect(context.tenant.id).toBe("default");
    expect(context.workspace.tenantId).toBe(context.tenant.id);
    expect(JSON.stringify(context)).not.toMatch(/token|password|cookie|secret/i);
    expect(Object.isFrozen(context)).toBe(true);
  });
  it("supports internal system context but ignores external principal activation", () => {
    const bridge = new AuthBridge();
    expect(bridge.resolve({ principalHint: { kind: "system" } }).principal.kind).toBe("anonymous");
    expect(bridge.system().principal).toMatchObject({ id: "system", kind: "system", roles: ["system"] });
    expect(bridge.snapshot()).toMatchObject({ anonymousContexts: 1, systemContexts: 1 });
  });
  it("integrates AuthContext into Execution Context without breaking legacy fields", () => {
    const auth = new AuthBridge().anonymous({ tenantHint: { id: "tenant-1" }, workspaceHint: { id: "workspace-1" } });
    const context = createExecutionContext({ auth });
    expect(context.auth).toBe(auth);
    expect(context.tenant).toBe("tenant-1");
    expect(context.workspace).toBe("workspace-1");
    expect(context.roles).toEqual([]);
    expect(context.permissions).toEqual([]);
    expect(Object.isFrozen(context.snapshot())).toBe(true);
  });
});
