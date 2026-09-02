import { describe, expect, it } from "vitest";
import { getAdminNavigationViewModel } from "./admin-navigation-adapter";
import { isNavigationItemActive, normalizeCurrentPath, sanitizeInternalHref, sanitizeNavigationId, sanitizeNavigationText } from "./admin-navigation-sanitizer";

type Item = Record<string, unknown>;
function kernel(options: { items?: Item[]; found?: boolean; throws?: boolean; warnings?: object[]; errors?: object[] } = {}) {
  const items = options.items ?? [{ id: "dashboard", label: "Dashboard", route: "/" }, { id: "modules", label: "Modules", route: "/modules" }];
  const definition = { id: "admin-main", namespace: "system", label: "Main", items };
  return {
    metadata: () => ({ registerMenu: () => undefined, resolveMenu: () => options.found === false ? { found: false } : { found: true, resource: { definition } } }),
    uiComposition: () => ({ compose: () => {
      if (options.throws) throw new Error("secret stack trace");
      return { generatedAt: "2026-09-01T12:00:00.000Z", root: { componentKey: "system.menu", props: { label: "Main navigation", items } }, warnings: options.warnings ?? [], errors: options.errors ?? [], diagnostics: [] };
    } })
  };
}

describe("Admin Navigation Adapter", () => {
  it("creates a frozen ready ViewModel and marks the current item active", () => {
    const model = getAdminNavigationViewModel({ currentPath: "/modules" }, { createKernel: () => kernel() as never });
    expect(model.status).toBe("ready");
    expect(model.groups[0]?.items.find((item) => item.id === "modules")?.active).toBe(true);
    expect(model.groups[0]?.items.find((item) => item.id === "dashboard")?.active).toBe(false);
    expect(model.generatedAt).toBe("2026-09-01T12:00:00.000Z");
    expect(Object.isFrozen(model)).toBe(true);
    expect(Object.isFrozen(model.groups[0]?.items)).toBe(true);
  });

  it("returns empty for an empty menu and controlled error for missing/failing menus", () => {
    expect(getAdminNavigationViewModel({}, { createKernel: () => kernel({ items: [] }) as never }).status).toBe("empty");
    expect(getAdminNavigationViewModel({}, { createKernel: () => kernel({ found: false }) as never }).errors[0]?.code).toBe("adminNavigation.menuMissing");
    const failed = getAdminNavigationViewModel({}, { createKernel: () => kernel({ throws: true }) as never });
    expect(failed.status).toBe("error");
    expect(JSON.stringify(failed)).not.toContain("secret stack");
  });

  it("normalizes public warnings and errors", () => {
    const issue = { code: "menu.issue", message: "Safe issue", source: "ui-composition" };
    const warning = getAdminNavigationViewModel({}, { createKernel: () => kernel({ warnings: [issue] }) as never });
    const error = getAdminNavigationViewModel({}, { createKernel: () => kernel({ errors: [issue] }) as never });
    expect(warning.status).toBe("warning");
    expect(warning.warnings[0]).toMatchObject({ severity: "warning", message: "Safe issue" });
    expect(error.status).toBe("error");
    expect(error.errors[0]).toMatchObject({ severity: "error", message: "Safe issue" });
  });

  it.each(["https://example.com", "http://example.com", "javascript:alert(1)", "data:text/html,x", "mailto:test@example.com", "tel:99999", "", "//example.com"])("blocks unsafe href %s", (route) => {
    const model = getAdminNavigationViewModel({}, { createKernel: () => kernel({ items: [{ id: "unsafe", label: "Unsafe", route }] }) as never });
    expect(model.groups[0]?.items[0]).toMatchObject({ href: "#", disabled: true, active: false });
    expect(model.warnings[0]?.code).toBe("adminNavigation.invalidHref");
  });

  it("ignores invalid items and never executes or propagates functions/actions", () => {
    let executed = false;
    const action = () => { executed = true; };
    const model = getAdminNavigationViewModel({}, { createKernel: () => kernel({ items: [{ id: "", label: "Missing id", route: "/x" }, { id: "action", label: "Action", route: "/action", action }] }) as never });
    expect(executed).toBe(false);
    expect(model.groups).toEqual([]);
    expect(JSON.stringify(model)).not.toContain("function");
  });
});

describe("Admin Navigation Sanitizer", () => {
  it("accepts safe values and normalizes current paths", () => {
    expect(sanitizeNavigationId("admin-main")).toBe("admin-main");
    expect(sanitizeNavigationText("  Main   menu  ")).toBe("Main menu");
    expect(sanitizeInternalHref("/modules?tab=all")).toBe("/modules?tab=all");
    expect(normalizeCurrentPath("/modules?tab=all#top")).toBe("/modules");
    expect(isNavigationItemActive("/runtime", "/runtime/page/system/admin-overview")).toBe(true);
  });
  it("rejects malformed ids, control characters and backslashes", () => {
    expect(sanitizeNavigationId("bad id")).toBeUndefined();
    expect(sanitizeInternalHref("/bad\\path")).toBeUndefined();
    expect(sanitizeInternalHref("/bad\npath")).toBeUndefined();
  });
});
