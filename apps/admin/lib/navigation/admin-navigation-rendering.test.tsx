import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import AdminHome from "../../app/page";
import ModulesPage from "../../app/modules/page";
import StatusPage from "../../app/status/page";
import DiagnosticsPage from "../../app/diagnostics/page";
import DynamicRuntimePage from "../../app/runtime/[sourceType]/[namespace]/[sourceId]/page";
import { Sidebar } from "../../components/sidebar";
import type { AdminNavigationViewModel } from "./admin-navigation-view-model";

function viewModel(status: AdminNavigationViewModel["status"] = "ready"): AdminNavigationViewModel {
  return { status, generatedAt: "2026-09-01T12:00:00.000Z", currentPath: "/modules", groups: status === "ready" ? [{ id: "main", label: "Main navigation", items: [{ id: "dashboard", label: "Dashboard", href: "/", active: false, disabled: false }, { id: "modules", label: "Modules", href: "/modules", active: true, disabled: false, badge: "New", description: "Module System" }, { id: "unsafe", label: "Unsafe", href: "#", active: false, disabled: true }] }] : [], warnings: [], errors: status === "error" ? [{ code: "failed", message: "Failed", severity: "error", source: "test" }] : [], diagnostics: [] };
}

describe("Dynamic Admin navigation rendering", () => {
  it("renders groups, items, badges, active state and disabled items", () => {
    const html = renderToStaticMarkup(<Sidebar navigation={viewModel()} />);
    expect(html).toContain("Main navigation");
    expect(html).toContain("Dashboard");
    expect(html).toContain("Modules");
    expect(html).toContain("New");
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('aria-disabled="true"');
    expect(html).not.toContain('href="#"');
  });
  it("renders empty and error fallbacks", () => {
    expect(renderToStaticMarkup(<Sidebar navigation={viewModel("empty")} />)).toContain("Navigation is empty");
    expect(renderToStaticMarkup(<Sidebar navigation={viewModel("error")} />)).toContain("Navigation unavailable");
  });
  it("renders every declarative demo destination and its active state", () => {
    const html = renderToStaticMarkup(<Sidebar currentPath="/runtime/page/system/admin-overview" />);
    for (const route of ["/", "/modules", "/runtime/page/system/admin-overview", "/status", "/diagnostics", "/health"]) expect(html).toContain(`href="${route}"`);
    expect(html).toContain("Dynamic Screen");
    expect(html).toContain('aria-current="page"');
  });
  it("does not use unsafe HTML in shell/navigation sources", () => {
    for (const file of ["../../components/sidebar.tsx", "../../components/navigation/admin-navigation.tsx"]) expect(readFileSync(new URL(file, import.meta.url), "utf8")).not.toContain("dangerouslySetInnerHTML");
  });
});

describe("preserved Admin routes", () => {
  it("renders shell routes with their dynamic active navigation", async () => {
    const pages = [await AdminHome(), await ModulesPage(), await StatusPage(), await DiagnosticsPage(), await DynamicRuntimePage({ params: Promise.resolve({ sourceType: "page", namespace: "system", sourceId: "admin-overview" }) })];
    for (const page of pages) { const html = renderToStaticMarkup(page); expect(html).toContain("Admin navigation"); expect(html).toContain('aria-current="page"'); }
  });
  it("preserves the Health route implementation without the accidental spaced path", () => {
    const source = readFileSync(new URL("../../app/health/route.ts", import.meta.url), "utf8");
    expect(source).toContain("export async function GET");
    expect(source).not.toContain('" /health"');
  });
});
