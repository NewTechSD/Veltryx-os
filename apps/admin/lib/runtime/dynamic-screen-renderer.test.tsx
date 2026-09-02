import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DynamicScreenRenderer } from "../../components/dynamic/dynamic-screen-renderer";
import type { AdminCompositionNodeViewModel, AdminCompositionScreenViewModel } from "./admin-composition-view-model";

function node(componentKey: string, id = componentKey, props: Record<string, unknown> = {}, children: AdminCompositionNodeViewModel[] = [], slots: Record<string, AdminCompositionNodeViewModel[]> = {}): AdminCompositionNodeViewModel { return { id, componentKey, props, children, slots }; }
function model(root?: AdminCompositionNodeViewModel, status: AdminCompositionScreenViewModel["status"] = "ready"): AdminCompositionScreenViewModel { return { status, title: "Test screen", description: "Safe description", sourceType: "custom", sourceId: "test", namespace: "system", generatedAt: "2026-09-01T12:00:00.000Z", tree: root ? { id: "tree", source: "test", sourceType: "custom", generatedAt: "2026-09-01T12:00:00.000Z", root } : undefined, warnings: [], errors: [], diagnostics: [] }; }

describe("Dynamic Screen Renderer", () => {
  it("renders every supported system component, nested children and slots", () => {
    const keys = ["system.section", "system.container", "system.card", "system.stack", "system.grid", "system.heading", "system.text", "system.badge", "system.button", "system.emptyState", "system.errorState", "system.statusIndicator"];
    const children = keys.map((key, index) => node(key, `node-${index}`, { title: key, text: key, label: key, href: index === 8 ? "/status" : undefined }));
    const root = node("system.page", "root", { title: "Dynamic" }, children, { footer: [node("system.text", "slot", { text: "Slot content" })] });
    const html = renderToStaticMarkup(<DynamicScreenRenderer viewModel={model(root)} />);
    expect(html).toContain("Dynamic");
    expect(html).toContain("Slot content");
    for (const key of keys) expect(html).toContain(key);
    expect(html).toContain('href="/status"');
  });

  it("uses controlled fallbacks for unknown components, empty and error screens", () => {
    expect(renderToStaticMarkup(<DynamicScreenRenderer viewModel={model(node("hero.split"))} />)).toContain("Unsupported component: hero.split");
    expect(renderToStaticMarkup(<DynamicScreenRenderer viewModel={model(undefined, "error")} />)).toContain("Test screen");
    expect(renderToStaticMarkup(<DynamicScreenRenderer viewModel={model(undefined, "empty")} />)).toContain("Test screen");
  });

  it("does not execute functions or render raw HTML and rejects external URLs", () => {
    let executed = false;
    const root = node("system.page", "root", {}, [node("system.text", "text", { text: "<script>alert(1)</script>", callback: () => { executed = true; } }), node("system.button", "button", { label: "Unsafe", href: "https://example.com" })]);
    const html = renderToStaticMarkup(<DynamicScreenRenderer viewModel={model(root)} />);
    expect(executed).toBe(false);
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("https://example.com");
    expect(html).toContain("disabled");
  });
});
