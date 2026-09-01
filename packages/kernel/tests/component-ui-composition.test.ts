import { describe, expect, it } from "vitest";
import type { ComponentDefinition, CompositionTree, MetadataForm, MetadataList, MetadataMenu, MetadataPage } from "@veltryx/contracts";

import {
  ComponentRegistry,
  ComponentValidator,
  CompositionValidator,
  SYSTEM_COMPONENTS,
  UICompositionRuntime,
  VeltryxKernel,
  createBootstrapContext,
  registerSystemComponents
} from "../src/index.js";

const customCard: ComponentDefinition = {
  key: "qa.card",
  name: "QaCard",
  label: "QA Card",
  type: "display",
  category: "card",
  version: "1.0.0",
  propsSchema: [
    { name: "title", type: "string", required: true },
    { name: "variant", type: "enum", options: ["default", "warning"], defaultValue: "default" }
  ],
  slots: [{ name: "body", required: true, accepts: ["system.text"], multiple: false }],
  capabilities: ["canRenderChildren", "canUseSlots"]
};

const pageMetadata: MetadataPage = {
  id: "dashboard",
  namespace: "admin",
  title: "Dashboard",
  route: "/dashboard",
  sections: [{ id: "main", type: "section", title: "Main", children: [{ id: "summary", type: "card", title: "Summary" }] }]
};

const formMetadata: MetadataForm = {
  id: "customer.form",
  label: "Customer",
  entity: "customer",
  fields: [{ field: "name", label: "Name", required: true }, { field: "email", label: "Email" }],
  actions: ["submit"]
};

const listMetadata: MetadataList = {
  id: "customer.list",
  label: "Customers",
  entity: "customer",
  columns: [{ field: "name", label: "Name", sortable: true }],
  actions: ["export"]
};

const menuMetadata: MetadataMenu = {
  id: "main",
  namespace: "admin",
  label: "Main",
  items: [{ id: "dashboard", label: "Dashboard", page: "admin.dashboard" }]
};

describe("Component Registry", () => {
  it("handles empty, valid registration, resolution, grouping, replacement and immutable safe snapshots", () => {
    const registry = new ComponentRegistry();
    expect(registry.snapshot()).toMatchObject({ status: "empty", componentsRegistered: 0 });

    const registered = registry.register(customCard);
    expect(Object.isFrozen(registered)).toBe(true);
    expect(() => registry.register(customCard)).toThrow("Component already registered");
    registry.register({ ...customCard, label: "QA Card v2" }, { replace: true });

    expect(registry.resolve("qa.card")).toMatchObject({ found: true, version: "1.0.0" });
    expect(registry.resolve("missing.card")).toMatchObject({ found: false, error: { code: "component.resolutionFailed" } });
    expect(registry.resolveByType("display")).toHaveLength(1);
    expect(registry.resolveByCategory("card")).toHaveLength(1);
    expect(registry.list()).toHaveLength(1);

    const snapshot = registry.snapshot();
    expect(snapshot.componentsByType).toEqual({ display: 1 });
    expect(snapshot.componentsByCategory).toEqual({ card: 1 });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.components)).toBe(true);
    expect(JSON.stringify(snapshot)).not.toContain("useFactory");
    expect(JSON.stringify(snapshot)).not.toContain("stack");
    expect(JSON.stringify(snapshot)).not.toContain("secret");
  });

  it("validates required fields, enums, props defaults, slots and unsafe values", () => {
    const validator = new ComponentValidator();
    expect(validator.validate(customCard).valid).toBe(true);
    expect(validator.validate({ ...customCard, key: "" }).errors.map((error) => error.code)).toContain("component.invalidKey");
    expect(validator.validate({ ...customCard, name: "" }).errors.map((error) => error.code)).toContain("component.invalidName");
    expect(validator.validate({ ...customCard, type: "bad" as never }).errors.map((error) => error.code)).toContain("component.invalidType");
    expect(validator.validate({ ...customCard, category: "bad" as never }).errors.map((error) => error.code)).toContain("component.invalidCategory");
    expect(validator.validate({ ...customCard, propsSchema: [{ name: "x", type: "bad" as never }] }).errors.map((error) => error.code)).toContain("component.invalidProp");
    expect(validator.validate({ ...customCard, propsSchema: [{ name: "x", type: "enum" }] }).errors.map((error) => error.code)).toContain("component.invalidProp");
    expect(validator.validate({ ...customCard, propsSchema: [{ name: "x", type: "string", defaultValue: () => "x" }] }).errors.map((error) => error.code)).toContain("component.invalidProp");
    expect(validator.validate({ ...customCard, propsSchema: [{ name: "x", type: "object", defaultValue: new Date() }] }).errors.map((error) => error.code)).toContain("component.invalidProp");
    expect(validator.validate({ ...customCard, slots: [{ name: "" }] }).errors.map((error) => error.code)).toContain("component.invalidSlot");
    expect(validator.validate({ ...customCard, slots: [{ name: "body", accepts: [""] }] }).errors.map((error) => error.code)).toContain("component.invalidSlot");
    expect(validator.validate({ ...customCard, source: "x", tags: ["ok"], description: "safe" }).valid).toBe(true);
  });

  it("registers minimum system components", () => {
    const registry = new ComponentRegistry();
    registerSystemComponents(registry);
    for (const key of ["system.page", "system.section", "system.card", "system.table", "system.form", "system.field", "system.button", "system.navigation", "system.emptyState", "system.errorState"]) {
      expect(registry.resolve(key).found).toBe(true);
    }
    expect(SYSTEM_COMPONENTS.length).toBeGreaterThanOrEqual(20);
  });
});

describe("UI Composition Runtime", () => {
  function runtimeWithSystemComponents() {
    const registry = new ComponentRegistry();
    registerSystemComponents(registry);
    return { registry, runtime: new UICompositionRuntime(registry) };
  }

  it("starts empty and composes page, form, list and menu metadata into immutable trees", () => {
    const { runtime } = runtimeWithSystemComponents();
    expect(runtime.snapshot()).toMatchObject({ status: "empty", compositionsGenerated: 0 });

    const page = runtime.compose({ sourceType: "page", sourceId: pageMetadata.id, namespace: pageMetadata.namespace, metadata: pageMetadata, runtimeContext: {} as never });
    const form = runtime.compose({ sourceType: "form", sourceId: formMetadata.id, metadata: formMetadata, runtimeContext: {} as never });
    const list = runtime.compose({ sourceType: "list", sourceId: listMetadata.id, metadata: listMetadata, runtimeContext: {} as never });
    const menu = runtime.compose({ sourceType: "menu", sourceId: menuMetadata.id, namespace: menuMetadata.namespace, metadata: menuMetadata, runtimeContext: {} as never });

    expect(page.root.componentKey).toBe("system.page");
    expect(page.root.children?.[0]?.componentKey).toBe("system.section");
    expect(form.root.componentKey).toBe("system.form");
    expect(form.root.children?.map((child) => child.componentKey)).toEqual(["system.field", "system.field", "system.button"]);
    expect(list.root.componentKey).toBe("system.table");
    expect(menu.root.componentKey).toBe("system.menu");
    expect(Object.isFrozen(page)).toBe(true);
    expect(JSON.stringify(page)).not.toContain("$$typeof");
    expect(JSON.stringify(page)).not.toContain("function");
    expect(runtime.snapshot()).toMatchObject({ compositionsGenerated: 4, lastSourceType: "menu", lastSourceId: "main" });
  });

  it("fails invalid input, missing metadata, missing components and unsafe metadata in a controlled way", () => {
    const { runtime } = runtimeWithSystemComponents();
    expect(runtime.compose({ sourceType: "bad" as never, sourceId: "x", metadata: {} }).errors.map((error) => error.code)).toContain("composition.invalidSourceType");
    expect(runtime.compose({ sourceType: "page", sourceId: "missing" }).errors.map((error) => error.code)).toContain("composition.metadataMissing");
    expect(runtime.compose({ sourceType: "custom", sourceId: "bad", metadata: { root: { id: "x", componentKey: "missing.component" } }, runtimeContext: {} as never }).errors.map((error) => error.code)).toContain("composition.componentMissing");
    expect(runtime.compose({ sourceType: "custom", sourceId: "unsafe", metadata: { root: { id: "x", componentKey: "system.text", props: { secret: "x" } } } }).errors.map((error) => error.code)).toContain("composition.unsafeValue");
  });

  it("validates props, required slots, invalid slots, children and versions", () => {
    const registry = new ComponentRegistry();
    registerSystemComponents(registry);
    registry.register(customCard);
    const validator = new CompositionValidator(registry);
    const valid: CompositionTree = {
      id: "tree",
      source: "qa",
      sourceType: "custom",
      generatedAt: "2026-09-01T00:00:00.000Z",
      root: { id: "card", componentKey: "qa.card", props: { title: "Title", variant: "default" }, slots: { body: [{ id: "text", componentKey: "system.text", props: { text: "ok" } }] } },
      warnings: [],
      errors: [],
      diagnostics: []
    };
    expect(validator.validate(valid).valid).toBe(true);
    expect(validator.validate({ ...valid, root: { ...valid.root, id: "" } }).errors.map((error) => error.code)).toContain("composition.invalidNode");
    expect(validator.validate({ ...valid, root: { ...valid.root, componentKey: "" } }).errors.map((error) => error.code)).toContain("composition.invalidNode");
    expect(validator.validate({ ...valid, root: { ...valid.root, componentVersion: "9.9.9" } }).errors.map((error) => error.code)).toContain("composition.componentMissing");
    expect(validator.validate({ ...valid, root: { ...valid.root, props: { variant: "bad" } } }).errors.map((error) => error.code)).toEqual(expect.arrayContaining(["composition.propMissing", "composition.propInvalid"]));
    expect(validator.validate({ ...valid, root: { ...valid.root, slots: {} } }).errors.map((error) => error.code)).toContain("composition.slotMissing");
    expect(validator.validate({ ...valid, root: { ...valid.root, slots: { bad: [] } } }).errors.map((error) => error.code)).toEqual(expect.arrayContaining(["composition.slotInvalid", "composition.slotMissing"]));
    expect(validator.validate({ ...valid, root: { id: "form", componentKey: "system.form", children: [{ id: "bad", componentKey: "system.table" }] } }).errors.map((error) => error.code)).toContain("composition.childNotAllowed");
  });

  it("integrates with metadata, kernel services, DI, runtime context and kernel status without mutating metadata", async () => {
    const kernel = new VeltryxKernel();
    const before = JSON.stringify(pageMetadata);
    const tree = kernel.uiComposition().compose({ sourceType: "page", sourceId: pageMetadata.id, namespace: pageMetadata.namespace, metadata: pageMetadata, runtimeContext: {} as never });
    expect(tree.root.componentKey).toBe("system.page");
    expect(JSON.stringify(pageMetadata)).toBe(before);
    expect(kernel.components().snapshot().componentsRegistered).toBeGreaterThanOrEqual(20);
    expect(kernel.services().get("kernel.componentRegistry")).toBeDefined();
    expect(kernel.services().get("kernel.uiCompositionRuntime")).toBeDefined();
    expect(kernel.container().has("kernel.componentRegistry")).toBe(true);
    expect(kernel.container().has("kernel.uiCompositionRuntime")).toBe(true);

    const context = createBootstrapContext();
    await kernel.bootstrap(context);
    await kernel.initialize(context);
    await kernel.ready(context);
    expect(kernel.runtime().context()?.componentRegistry).toMatchObject({ status: "ready" });
    expect(kernel.runtime().context()?.uiComposition).toMatchObject({ compositionsGenerated: 1 });
    expect(kernel.runtime().snapshot()).toMatchObject({ componentRegistryStatus: "ready", uiCompositionStatus: "ready", compositionsGenerated: 1 });
    const status = await kernel.status({ environment: "test" }).snapshot();
    expect(status.componentRegistryStatus).toMatchObject({ status: "available" });
    expect(status.uiCompositionStatus).toMatchObject({ status: "available" });
    expect(status.componentsRegistered).toBeGreaterThanOrEqual(20);
  });
});

