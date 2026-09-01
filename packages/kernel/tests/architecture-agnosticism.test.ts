import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ComponentRegistry,
  SYSTEM_COMPONENTS,
  UICompositionRuntime,
  registerSystemComponents
} from "../src/index.js";

const runtimeWords = [
  ["Re", "act"],
  ["Ne", "xt"],
  ["J", "SX"],
  ["Re", "act", "Node"],
  ["Re", "act", "Element"],
  ["Ne", "xt", "Page"],
  ["Ne", "xt", "Component"],
  ["HTML", "Element"],
  ["Guten", "berg"],
  ["Word", "Press"]
].map((parts) => parts.join(""));

const unsafeImplementationKeys = [
  ["render"],
  ["renderer"],
  ["use client"],
  ["use server"],
  ["short", "code"],
  ["template", "Php"],
  ["block", "Json"],
  ["t", "sxPath"],
  ["j", "sxPath"],
  ["p", "hpTemplate"],
  ["component", "File"],
  ["implementation", "Path"]
].map((parts) => parts.join(""));
const sourceImplementationKeys = unsafeImplementationKeys.filter((key) => !["render", "renderer"].includes(key));

describe("Runtime and platform agnosticism guardrail", () => {
  it("keeps contracts and kernel source free from runtime/platform identifiers", () => {
    for (const file of [
      "packages/contracts/src/components.ts",
      "packages/contracts/src/ui-composition.ts",
      "packages/kernel/src/core/components/component-definition.ts",
      "packages/kernel/src/core/components/component-registry.ts",
      "packages/kernel/src/core/components/component-validator.ts",
      "packages/kernel/src/core/components/system-components.ts",
      "packages/kernel/src/core/ui-composition/composition-diagnostics.ts",
      "packages/kernel/src/core/ui-composition/composition-validator.ts",
      "packages/kernel/src/core/ui-composition/ui-composition-runtime.ts"
    ]) {
      const content = readFileSync(join(process.cwd(), "..", "..", file), "utf8");
      for (const word of runtimeWords) expect(content).not.toContain(word);
      for (const key of sourceImplementationKeys) expect(content).not.toContain(key);
    }
  });

  it("rejects component definitions carrying implementation details", () => {
    const registry = new ComponentRegistry();
    const base = {
      key: "site.hero",
      name: "Hero",
      label: "Hero",
      type: "display" as const,
      category: "section" as const,
      version: "1.0.0"
    };

    for (const key of unsafeImplementationKeys.filter((entry) => !entry.includes(" "))) {
      expect(() => registry.register({ ...base, key: `site.${key.toLowerCase()}`, [key]: "x" } as never)).toThrow("unsafe");
    }
    expect(() => registry.register({ ...base, key: "site.callback", render: () => "x" } as never)).toThrow("unsafe");
    expect(JSON.stringify(SYSTEM_COMPONENTS)).not.toContain("function");
  });

  it("keeps registry snapshots serializable and free from implementation mapping", () => {
    const registry = new ComponentRegistry();
    registerSystemComponents(registry);
    const snapshot = registry.snapshot();
    const json = JSON.stringify(snapshot);
    expect(JSON.parse(json)).toMatchObject({ componentsRegistered: SYSTEM_COMPONENTS.length });
    for (const word of runtimeWords) expect(json).not.toContain(word);
    for (const key of sourceImplementationKeys) expect(json).not.toContain(key);
  });

  it("rejects composition nodes with platform element shape or implementation paths", () => {
    const registry = new ComponentRegistry();
    registerSystemComponents(registry);
    const runtime = new UICompositionRuntime(registry);

    const elementMarker = ["$$", "typeof"].join("");
    const treeWithElementShape = runtime.compose({
      sourceType: "custom",
      sourceId: "shape",
      metadata: { root: { id: "shape", componentKey: "system.text", props: { [elementMarker]: "x", type: "div", key: "x", props: {} } } }
    });
    expect(treeWithElementShape.errors.map((error) => error.code)).toContain("composition.unsafeValue");

    const implPath = ["implementation", "Path"].join("");
    const treeWithPath = runtime.compose({
      sourceType: "custom",
      sourceId: "path",
      metadata: { root: { id: "path", componentKey: "system.text", props: { text: "ok", [implPath]: "x" } } }
    });
    expect(treeWithPath.errors.map((error) => error.code)).toContain("composition.unsafeValue");
  });

  it("generates serializable composition without a specific runtime", () => {
    const registry = new ComponentRegistry();
    registerSystemComponents(registry);
    const runtime = new UICompositionRuntime(registry);
    const tree = runtime.compose({
      sourceType: "page",
      sourceId: "home",
      namespace: "site",
      metadata: { id: "home", namespace: "site", title: "Home", sections: [{ id: "hero", type: "section", title: "Hero" }] }
    });

    const json = JSON.stringify(tree);
    expect(JSON.parse(json)).toMatchObject({ root: { componentKey: "system.page" } });
    for (const word of runtimeWords) expect(json).not.toContain(word);
    for (const key of sourceImplementationKeys) expect(json).not.toContain(key);
  });
});


