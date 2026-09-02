import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import DynamicRuntimePage from "../../app/runtime/[sourceType]/[namespace]/[sourceId]/page";
import { Sidebar } from "../../components/sidebar";

describe("Dynamic runtime route", () => {
  it("renders the valid demo inside the Admin shell", async () => {
    const html = renderToStaticMarkup(
      await DynamicRuntimePage({
        params: Promise.resolve({
          sourceType: "page",
          namespace: "system",
          sourceId: "admin-overview"
        })
      })
    );
    expect(html).toContain("Veltryx");
    expect(html).toContain("Runtime Dynamic Overview");
    expect(html).toContain("Components registered");
  });
  it("handles invalid namespace and sourceId without breaking the shell", async () => {
    const html = renderToStaticMarkup(
      await DynamicRuntimePage({
        params: Promise.resolve({ sourceType: "page", namespace: "invalid", sourceId: "missing" })
      })
    );
    expect(html).toContain("Veltryx");
    expect(html).toContain("Dynamic screen unavailable");
    expect(html).not.toContain("stack");
  });
  it("exposes the dynamic link while preserving existing destinations", () => {
    const html = renderToStaticMarkup(<Sidebar />);
    for (const href of [
      "/",
      "/status",
      "/diagnostics",
      "/modules",
      "/runtime/page/system/admin-overview"
    ])
      expect(html).toContain(`href="${href}"`);
  });
});

describe("runtime agnosticism guardrails", () => {
  const workspace = resolve(process.cwd(), "../..");
  const sources = (folder: string) => collectTypeScriptSources(resolve(workspace, folder));
  it("keeps React, Next and JSX out of Kernel and Contracts", () => {
    for (const folder of ["packages/kernel", "packages/contracts"]) {
      const files = sources(folder);
      expect(files.filter((file) => file.endsWith(".tsx"))).toEqual([]);
      for (const file of files)
        expect(readFileSync(file, "utf8")).not.toMatch(
          /from\s+["'](?:react|next(?:\/[^"']*)?)["']/
        );
    }
  });
  it("keeps forbidden implementation paths and unsafe HTML out of the adapter/renderer", () => {
    const adapter = readFileSync(
      resolve(workspace, "apps/admin/lib/runtime/admin-composition-adapter.ts"),
      "utf8"
    );
    const renderer = readFileSync(
      resolve(workspace, "apps/admin/components/dynamic/dynamic-screen-renderer.tsx"),
      "utf8"
    );
    expect(adapter).not.toMatch(
      /implementationPath|componentFile|tsxPath|jsxPath|phpTemplate|blockJson/
    );
    expect(renderer).not.toContain("dangerouslySetInnerHTML");
  });
});

function collectTypeScriptSources(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      if (!["node_modules", "dist", "coverage", ".next"].includes(entry.name))
        files.push(...collectTypeScriptSources(path));
    } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
      files.push(path);
    }
  }
  return files;
}
