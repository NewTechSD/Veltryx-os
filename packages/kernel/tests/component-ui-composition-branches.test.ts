import { describe, expect, it } from "vitest";
import type { ComponentDefinition, CompositionTree } from "@veltryx/contracts";

import {
  ComponentRegistry,
  ComponentValidator,
  CompositionValidator,
  KernelStatusService,
  UICompositionRuntime,
  UICompositionSnapshotService,
  MetadataCompositionMapper,
  createCompositionDiagnostic,
  hasUnsafeCompositionValue,
  createKernelStatusMetric,
  registerSystemComponents
} from "../src/index.js";

const baseComponent: ComponentDefinition = {
  key: "qa.component",
  name: "Component",
  label: "Component",
  type: "system",
  category: "system",
  version: "1.0.0"
};

describe("Component and composition branch coverage", () => {
  it("covers component validator optional schema and slot branches", () => {
    const validator = new ComponentValidator();
    expect(validator.validate({ ...baseComponent, key: "bad key" }).errors.map((error) => error.code)).toContain("component.invalidKey");
    expect(validator.validate({ ...baseComponent, label: "" }).errors.map((error) => error.code)).toContain("component.invalidLabel");
    expect(validator.validate({ ...baseComponent, version: "1" }).errors.map((error) => error.code)).toContain("component.invalidVersion");
    expect(validator.validate({ ...baseComponent, capabilities: ["bad" as never] }).errors.map((error) => error.code)).toContain("component.invalidCapability");
    expect(validator.validate({ ...baseComponent, allowedChildren: [""] }).errors.map((error) => error.code)).toContain("component.invalidChild");
    expect(validator.validate({ ...baseComponent, propsSchema: "bad" as never }).errors.map((error) => error.code)).toContain("component.invalidPropsSchema");
    expect(validator.validate({ ...baseComponent, propsSchema: [{ name: "x", type: "string" }, { name: "x", type: "number" }] }).errors.map((error) => error.code)).toContain("component.invalidProp");
    expect(validator.validate({ ...baseComponent, propsSchema: [{ name: "x", type: "enum", options: [() => "x"] }] }).errors.map((error) => error.code)).toContain("component.invalidProp");
    expect(validator.validate({ ...baseComponent, slots: "bad" as never }).errors.map((error) => error.code)).toContain("component.invalidSlot");
    expect(validator.validate({ ...baseComponent, slots: [{ name: "body" }, { name: "body" }] }).errors.map((error) => error.code)).toContain("component.invalidSlot");
  });

  it("covers metadata mapper branches for invalid resources and view/custom", () => {
    const registry = new ComponentRegistry();
    registerSystemComponents(registry);
    const runtime = new UICompositionRuntime(registry);

    expect(runtime.compose({ sourceType: "page", sourceId: "bad", metadata: { id: "" } }).errors.map((error) => error.code)).toContain("composition.invalidMetadata");
    expect(runtime.compose({ sourceType: "form", sourceId: "bad", metadata: { id: "f", entity: "e", fields: "bad" } }).errors.map((error) => error.code)).toContain("composition.invalidMetadata");
    expect(runtime.compose({ sourceType: "list", sourceId: "bad", metadata: { id: "l", entity: "e", columns: "bad" } }).errors.map((error) => error.code)).toContain("composition.invalidMetadata");
    expect(runtime.compose({ sourceType: "menu", sourceId: "bad", metadata: { id: "m", namespace: "n", items: "bad" } }).errors.map((error) => error.code)).toContain("composition.invalidMetadata");
    expect(runtime.compose({ sourceType: "view", sourceId: "bad", metadata: { id: "", label: "" } }).errors.map((error) => error.code)).toContain("composition.invalidMetadata");
    expect(runtime.compose({ sourceType: "custom", sourceId: "bad", metadata: {} }).errors.map((error) => error.code)).toContain("composition.invalidMetadata");

    const view = runtime.compose({ sourceType: "view", sourceId: "v", metadata: { id: "v", label: "View", type: "detail", entity: "customer", fields: ["name"] } });
    expect(view.root.componentKey).toBe("system.container");
    const page = runtime.compose({ sourceType: "page", sourceId: "p", namespace: "n", metadata: { id: "p", namespace: "n", title: "P", sections: [{ id: "c", type: "container" }] } });
    expect(page.root.children?.[0]?.componentKey).toBe("system.container");
  });

  it("covers composition prop and slot type branches", () => {
    const registry = new ComponentRegistry();
    registerSystemComponents(registry);
    registry.register({
      ...baseComponent,
      key: "qa.typed",
      propsSchema: [
        { name: "s", type: "string" },
        { name: "n", type: "number" },
        { name: "b", type: "boolean" },
        { name: "a", type: "array" },
        { name: "o", type: "object" },
        { name: "e", type: "enum", options: ["ok"] },
        { name: "u", type: "unknown" }
      ],
      slots: [{ name: "one", multiple: false, accepts: ["system.text"] }]
    });
    const validator = new CompositionValidator(registry);
    const tree: CompositionTree = {
      id: "typed",
      source: "typed",
      sourceType: "custom",
      generatedAt: "2026-09-01T00:00:00.000Z",
      root: {
        id: "typed",
        componentKey: "qa.typed",
        props: { s: "x", n: 1, b: true, a: [], o: {}, e: "ok", u: () => "unsafe" },
        slots: { one: [{ id: "text1", componentKey: "system.text" }, { id: "text2", componentKey: "system.heading", props: { text: "x" } }] }
      },
      warnings: [],
      errors: [],
      diagnostics: []
    };
    const result = validator.validate(tree);
    expect(result.errors.map((error) => error.code)).toEqual(expect.arrayContaining(["composition.unsafeValue", "composition.slotInvalid"]));
    expect(result.errors.filter((error) => error.code === "composition.slotInvalid")).toHaveLength(2);

    const invalidTypes = validator.validate({ ...tree, root: { ...tree.root, props: { s: 1, n: "1", b: "true", a: {}, o: [], e: "bad" }, slots: { one: [{ id: "text", componentKey: "system.text" }] } } });
    expect(invalidTypes.errors.filter((error) => error.code === "composition.propInvalid")).toHaveLength(6);
  });


  it("covers mapper default and snapshot status branches", () => {
    const mapper = new MetadataCompositionMapper();
    expect(mapper.map({ sourceType: "other" as never, sourceId: "x", metadata: {} }).errors.map((error) => error.code)).toContain("composition.invalidSourceType");

    const snapshot = new UICompositionSnapshotService(() => new Date("2026-09-01T00:00:00.000Z"));
    expect(snapshot.snapshot({ compositionsGenerated: 1, warnings: [], errors: [], diagnostics: [] }).status).toBe("ready");
    expect(snapshot.snapshot({ compositionsGenerated: 1, warnings: [{ code: "w", message: "w", source: "ui-composition" }], errors: [], diagnostics: [] }).status).toBe("partial");
    expect(snapshot.snapshot({ compositionsGenerated: 1, warnings: [], errors: [{ code: "e", message: "e", source: "ui-composition" }], diagnostics: [] }).status).toBe("error");
  });

  it("covers composition diagnostics sanitization and platform-shape branches", () => {
    const renderKey = ["render"].join("");
    const diagnostic = createCompositionDiagnostic({
      code: "d",
      message: "d",
      severity: "info",
      details: { ok: true, count: 1, password: "x", [renderKey]: "x", ignored: { nested: true } }
    });
    expect(diagnostic.details).toEqual({ ok: true, count: 1 });
    expect(hasUnsafeCompositionValue(null)).toBe(false);
    expect(hasUnsafeCompositionValue([{ safe: true }])).toBe(false);
    expect(hasUnsafeCompositionValue({ owner: "x", props: {} })).toBe(true);
    expect(hasUnsafeCompositionValue({ nested: { type: "x", key: "k", props: {} } })).toBe(true);
  });
  it("covers composition validation for missing tree root", () => {
    const registry = new ComponentRegistry();
    registerSystemComponents(registry);
    const validator = new CompositionValidator(registry);
    const result = validator.validate({ id: "", source: "x", sourceType: "custom", generatedAt: "now", root: undefined as never, warnings: [], errors: [], diagnostics: [] });
    expect(result.errors.map((error) => error.code)).toEqual(expect.arrayContaining(["composition.invalidTree"]));
  });
});

describe("Kernel Status component and composition branch coverage", () => {
  const moduleSnapshot = Object.freeze({ status: "empty" as const, generatedAt: "now", modulesDiscovered: 0, modulesResolved: 0, modulesLoaded: 0, modules: [], warnings: [], errors: [], diagnostics: [], reports: { discovery: undefined, resolution: undefined, loading: undefined } });
  const serviceSnapshot = Object.freeze({ status: "empty" as const, generatedAt: "now", servicesRegistered: 0, servicesAvailable: 0, servicesWithWarnings: 0, servicesWithErrors: 0, services: [], warnings: [], errors: [], diagnostics: [] });

  function statusService(overrides: Record<string, unknown>) {
    return new KernelStatusService({
      configuration: { getString: () => undefined } as never,
      services: { snapshot: () => serviceSnapshot, list: () => [] } as never,
      modules: { snapshot: async () => moduleSnapshot } as never,
      metadata: { snapshot: () => ({ status: "empty", generatedAt: "now", namespacesRegistered: 0, resourcesRegistered: 0, entitiesRegistered: 0, pagesRegistered: 0, menusRegistered: 0, resourcesByType: {}, namespaces: [], resources: [], warnings: [], errors: [], diagnostics: [] }) } as never,
      runtime: { state: () => "created" } as never,
      ...overrides
    }, { kernelState: () => "created", bootTimestamp: () => undefined });
  }

  it("reports service and configuration failures", async () => {
    const snapshot = await statusService({
      configuration: { getString: () => { throw new Error("config down"); } },
      services: { snapshot: () => ({ ...serviceSnapshot, status: "error", errors: [{ code: "e", message: "e", source: "services" }] }), list: () => [] }
    }).snapshot();
    expect(snapshot.errors.map((error) => error.code)).toEqual(expect.arrayContaining(["KERNEL_SERVICE_REGISTRY_DEGRADED", "KERNEL_CONFIGURATION_SNAPSHOT_FAILED"]));
  });

  it("reports unavailable component and composition snapshots", async () => {
    const snapshot = await statusService({ components: { snapshot: () => { throw new Error("components down"); } }, uiComposition: { snapshot: () => { throw new Error("composition down"); } } }).snapshot();
    expect(snapshot.errors.map((error) => error.code)).toEqual(expect.arrayContaining(["KERNEL_COMPONENT_REGISTRY_FAILED", "KERNEL_UI_COMPOSITION_FAILED"]));
    expect(snapshot.componentRegistryStatus).toMatchObject({ status: "unavailable" });
    expect(snapshot.uiCompositionStatus).toMatchObject({ status: "unavailable" });
  });

  it("reports degraded component and composition snapshots", async () => {
    const metric = createKernelStatusMetric("available", "ok", 1);
    expect(metric.value).toBe(1);
    const snapshot = await statusService({
      components: { snapshot: () => ({ status: "error", generatedAt: "now", componentsRegistered: 0, componentsByType: {}, componentsByCategory: {}, components: [], warnings: [], errors: [{ code: "x", message: "x", source: "components" }], diagnostics: [] }) },
      uiComposition: { snapshot: () => ({ status: "error", generatedAt: "now", compositionsGenerated: 0, warnings: [], errors: [{ code: "x", message: "x", source: "ui-composition" }], diagnostics: [] }) }
    }).snapshot();
    expect(snapshot.errors.map((error) => error.code)).toEqual(expect.arrayContaining(["KERNEL_COMPONENT_REGISTRY_DEGRADED", "KERNEL_UI_COMPOSITION_DEGRADED"]));
  });
});

