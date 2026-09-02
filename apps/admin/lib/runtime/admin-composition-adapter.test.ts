import { describe, expect, it } from "vitest";
import { getAdminCompositionScreenViewModel } from "./admin-composition-adapter";

const input = { sourceType: "page", namespace: "system", sourceId: "admin-overview" };

function kernel(overrides: { found?: boolean; composeThrows?: boolean; warnings?: unknown[]; errors?: unknown[] } = {}) {
  const definition = { id: "admin-overview", namespace: "system", title: "Overview" };
  return {
    metadata: () => ({ registerPage: () => undefined, resolvePage: () => overrides.found === false ? { found: false } : { found: true, resource: { definition } }, snapshot: () => ({ resourcesRegistered: 2 }) }),
    components: () => ({ snapshot: () => ({ componentsRegistered: 13 }) }),
    runtime: () => ({ snapshot: () => ({ servicesRegistered: 8, providersRegistered: 5, modulesLoaded: 0 }) }),
    status: () => ({ snapshot: async () => ({ servicesRegistered: { value: 8 }, modulesLoaded: { value: 0 } }) }),
    uiComposition: () => ({
      snapshot: () => ({ status: "ready" }),
      compose: () => {
        if (overrides.composeThrows) throw new Error("private stack must not escape");
        return { id: "composition:page:admin-overview", source: "system.admin-overview", sourceType: "page", generatedAt: "2026-09-01T12:00:00.000Z", root: { id: "page:admin-overview", componentKey: "system.page", props: { title: "Overview", unsafe: () => "executed", className: "evil", style: { color: "red" }, dangerouslySetInnerHTML: { __html: "bad" } }, children: [] }, warnings: overrides.warnings ?? [], errors: overrides.errors ?? [], diagnostics: [] };
      }
    })
  };
}

describe("Admin Composition Adapter", () => {
  it("returns a ready, immutable ViewModel from the public Composition Tree", async () => {
    const model = await getAdminCompositionScreenViewModel(input, { createKernel: () => kernel() as never });
    expect(model.status).toBe("ready");
    expect(model.tree?.root.componentKey).toBe("system.page");
    expect(model.generatedAt).toBe("2026-09-01T12:00:00.000Z");
    expect(model.tree?.root.props).toEqual({ title: "Overview" });
    expect(Object.isFrozen(model.tree?.root)).toBe(true);
  });

  it("returns controlled errors for a missing source and invalid sourceType", async () => {
    const missing = await getAdminCompositionScreenViewModel(input, { createKernel: () => kernel({ found: false }) as never });
    const invalid = await getAdminCompositionScreenViewModel({ ...input, sourceType: "script" });
    expect(missing.errors[0]?.code).toBe("adminComposition.sourceMissing");
    expect(invalid.errors[0]?.code).toBe("adminComposition.invalidSourceType");
  });

  it("normalizes warnings and errors without exposing stack traces", async () => {
    const warning = { code: "warn", message: "Safe warning", source: "ui-composition" };
    const warned = await getAdminCompositionScreenViewModel(input, { createKernel: () => kernel({ warnings: [warning] }) as never });
    const failed = await getAdminCompositionScreenViewModel(input, { createKernel: () => kernel({ composeThrows: true }) as never });
    expect(warned.status).toBe("warning");
    expect(warned.warnings[0]).toMatchObject({ severity: "warning", message: "Safe warning" });
    expect(failed.status).toBe("error");
    expect(JSON.stringify(failed)).not.toContain("private stack");
  });
});
