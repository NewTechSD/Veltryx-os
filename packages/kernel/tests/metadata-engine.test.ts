import { describe, expect, it } from "vitest";
import type { MetadataEntity } from "@veltryx/contracts";

import {
  InMemoryMetadataRegistry,
  MetadataValidator,
  VeltryxKernel,
  createBootstrapContext,
  createMetadataDiagnostic,
  normalizeMetadataFailure
} from "../src/index.js";

const customerEntity: MetadataEntity = {
  id: "customer",
  namespace: "crm",
  name: "Customer",
  label: "Customers",
  fields: [
    { id: "name", name: "name", label: "Name", type: "text", required: true },
    { id: "email", name: "email", label: "Email", type: "email", readonly: false, hidden: false }
  ],
  relations: [{ id: "owner", type: "manyToOne", targetNamespace: "admin", targetEntity: "user" }],
  actions: [{ id: "create", label: "Create", type: "create", confirmationRequired: false, permission: "crm.customer.create" }],
  views: [{ id: "list", type: "list", label: "List", entity: "customer", fields: ["name", "email"], actions: ["create"] }],
  forms: [{ id: "form", label: "Form", entity: "customer", fields: [{ field: "name", required: true }], actions: ["create"] }],
  lists: [{ id: "table", label: "Table", entity: "customer", columns: [{ field: "name", sortable: true }] }],
  permissions: [{ id: "read", action: "read", resource: "crm.customer" }],
  tags: ["crm"],
  version: "1.0.0"
};

describe("Metadata Engine Core", () => {
  it("registers namespaces, entities, pages, menus and exposes an immutable snapshot", () => {
    const registry = new InMemoryMetadataRegistry();

    const namespace = registry.registerNamespace({ id: "crm", name: "CRM", description: "Customer metadata", source: "module:crm", version: "1.0.0" });
    expect(namespace).toMatchObject({ id: "crm", name: "CRM" });
    expect(Object.isFrozen(namespace)).toBe(true);

    const entity = registry.registerEntity(customerEntity, { source: "module:crm" });
    registry.registerPage({ id: "customers.list", namespace: "crm", title: "Customers", route: "/crm/customers", sections: [{ id: "main", type: "list", resource: "customer" }] });
    registry.registerMenu({ id: "crm-menu", namespace: "crm", label: "CRM", items: [{ id: "crm-customers", label: "Customers", page: "crm.customers.list" }] });

    expect(entity.type).toBe("entity");
    expect(registry.listResources("crm")).toHaveLength(3);
    expect(registry.resolveEntity("crm", "customer")).toMatchObject({ found: true, type: "entity" });
    expect(registry.resolvePage("crm", "customers.list")).toMatchObject({ found: true, type: "page" });
    expect(registry.resolveMenu("crm", "crm-menu")).toMatchObject({ found: true, type: "menu" });
    expect(registry.resolveByType("entity", "crm")).toHaveLength(1);

    const snapshot = registry.snapshot();
    expect(snapshot).toMatchObject({
      status: "ready",
      namespacesRegistered: 1,
      resourcesRegistered: 3,
      entitiesRegistered: 1,
      pagesRegistered: 1,
      menusRegistered: 1,
      resourcesByType: { entity: 1, page: 1, menu: 1 }
    });
    expect(snapshot.namespaces[0]).toMatchObject({ id: "crm" });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.resources)).toBe(true);
    expect(JSON.stringify(snapshot)).not.toContain("useFactory");
    expect(JSON.stringify(snapshot)).not.toContain("stack");
  });

  it("keeps legacy MetadataRecord registration compatible", async () => {
    const registry = new InMemoryMetadataRegistry();
    await registry.register({ namespace: "kernel", key: "health", version: "1.0.0", owner: "kernel", status: "registered", metadata: { enabled: true } });

    await expect(registry.get({ namespace: "kernel", key: "health" })).resolves.toMatchObject({ namespace: "kernel", key: "health" });
    await expect(registry.list("kernel")).resolves.toHaveLength(1);
    await expect(registry.listVersions("kernel", "health")).resolves.toEqual(["1.0.0"]);
    expect(registry.resolve("kernel", "health")).toMatchObject({ found: true, type: "setting" });
  });

  it("normalizes validation errors for invalid resources and unsafe values", () => {
    const registry = new InMemoryMetadataRegistry();
    expect(() => registry.registerNamespace({ id: " ", name: "Empty" })).toThrow("Metadata namespace id is required");
    expect(() => registry.registerResource({ id: "x", namespace: "crm", type: "invalid" as never })).toThrow("Metadata resource type is invalid");
    expect(() => registry.registerEntity({ ...customerEntity, fields: [{ id: "name", name: "name", label: "Name", type: "invalid" as never }] })).toThrow("Metadata field type is invalid");
    expect(() => registry.registerEntity({ ...customerEntity, id: "unsafe", fields: [{ id: "x", name: "x", label: "X", type: "json", defaultValue: () => "no" }] })).toThrow("Metadata contains unsafe values");
    expect(registry.snapshot().status).toBe("error");
    expect(registry.snapshot().errors.every((error) => !("stack" in error))).toBe(true);
  });

  it("rejects duplicate resources in one namespace and allows the same id in another namespace", () => {
    const registry = new InMemoryMetadataRegistry();
    registry.registerEntity(customerEntity);
    expect(() => registry.registerEntity(customerEntity)).toThrow("Metadata resource already registered");
    registry.registerEntity({ ...customerEntity, namespace: "sales" });
    expect(registry.resolveEntity("sales", "customer").found).toBe(true);
  });

  it("emits warnings for empty snapshots, empty entities, pages without route and missing menu page references", () => {
    const registry = new InMemoryMetadataRegistry();
    expect(registry.snapshot()).toMatchObject({ status: "empty", namespacesRegistered: 0, resourcesRegistered: 0 });
    registry.registerEntity({ id: "note", namespace: "crm", name: "Note", label: "Note", fields: [] });
    registry.registerPage({ id: "notes", namespace: "crm", title: "Notes" });
    registry.registerMenu({ id: "crm-menu", namespace: "crm", label: "CRM", items: [{ id: "missing", label: "Missing", page: "crm.missing" }] });
    expect(registry.snapshot().status).toBe("partial");
    expect(registry.snapshot().warnings.map((warning) => warning.code)).toEqual(expect.arrayContaining(["metadata.entityWithoutFields", "metadata.pageWithoutRoute", "metadata.optionalReferenceMissing"]));
  });

  it("returns controlled resolution results for missing resources and wrong resolver type", () => {
    const registry = new InMemoryMetadataRegistry();
    registry.registerEntity(customerEntity);
    expect(registry.resolve("crm", "missing")).toMatchObject({ found: false, error: { code: "metadata.resolutionFailed" } });
    expect(registry.resolvePage("crm", "customer")).toMatchObject({ found: false, error: { code: "metadata.resolutionFailed" } });
  });

  it("validates fields, relations, actions and menu structures directly", () => {
    const validator = new MetadataValidator();
    expect(validator.validateEntity(customerEntity).valid).toBe(true);
    expect(validator.validateEntity({ ...customerEntity, fields: [{ id: "x", name: "x", label: "X", type: "text" }, { id: "x", name: "x2", label: "X2", type: "text" }] }).errors.map((error) => error.code)).toContain("metadata.invalidField");
    expect(validator.validateEntity({ ...customerEntity, relations: [{ id: "r", type: "wrong" as never, targetNamespace: "", targetEntity: "" }] }).errors.map((error) => error.code)).toContain("metadata.invalidRelation");
    expect(validator.validateEntity({ ...customerEntity, actions: [{ id: "", label: "", type: "wrong" as never }] }).errors.map((error) => error.code)).toContain("metadata.invalidAction");
    expect(validator.validateMenu({ id: "m", namespace: "crm", label: "CRM", items: [] }).warnings.map((warning) => warning.code)).toContain("metadata.menuWithoutItems");
  });

  it("exposes metadata API through Kernel and summarizes it in Kernel and Runtime snapshots", async () => {
    const kernel = new VeltryxKernel();
    kernel.metadata().registerEntity(customerEntity);
    kernel.metadata().registerPage({ id: "customers.list", namespace: "crm", title: "Customers", route: "/crm/customers" });
    const context = createBootstrapContext();

    await kernel.bootstrap(context);
    await kernel.initialize(context);
    await kernel.ready(context);

    expect(kernel.metadata().snapshot().entitiesRegistered).toBe(1);
    const status = await kernel.status({ environment: "test" }).snapshot();
    expect(status.metadataRegistryStatus).toMatchObject({ status: "available" });
    expect(status.metadataResourcesRegistered).toBe(2);
    expect(status.metadataEntitiesRegistered).toBe(1);
    expect(status.metadataPagesRegistered).toBe(1);
    expect(kernel.runtime().context()?.metadata).toMatchObject({ resourcesRegistered: 2, entitiesRegistered: 1, pagesRegistered: 1 });
    expect(kernel.runtime().snapshot()).toMatchObject({ metadataResourcesRegistered: 2, metadataEntitiesRegistered: 1, metadataPagesRegistered: 1 });
  });
});

describe("Metadata Engine branch coverage", () => {
  it("validates every declared resource type and controlled override", () => {
    const registry = new InMemoryMetadataRegistry();
    const types = ["field", "relation", "action", "view", "form", "list", "permission", "validation", "setting", "dashboard"] as const;
    for (const type of types) {
      registry.registerResource({ id: type, namespace: "system", type, label: type });
    }
    registry.registerResource({ id: "setting", namespace: "system", type: "setting", label: "Setting v2" }, { override: true });
    expect(registry.listNamespaces()).toHaveLength(1);
    expect(registry.resolveByType("setting")).toHaveLength(1);
    expect(registry.snapshot().resourcesRegistered).toBe(types.length);
  });

  it("covers invalid optional arrays, missing page fields and invalid menu structures", () => {
    const validator = new MetadataValidator();
    const invalidArrays = validator.validateEntity({
      ...customerEntity,
      fields: "not-array" as never,
      relations: [{ id: "", type: "oneToOne", targetNamespace: "admin", targetEntity: "user" }],
      actions: [{ id: "export", label: "Export", type: "export", payloadSchema: { ok: true } }],
      views: [{ id: "bad", label: "Bad", type: "bad" as never }]
    });
    expect(invalidArrays.valid).toBe(false);
    expect(invalidArrays.errors.map((error) => error.code)).toEqual(expect.arrayContaining(["metadata.invalidEntity", "metadata.invalidRelation", "metadata.invalidResource"]));

    const invalidField = validator.validateEntity({
      ...customerEntity,
      fields: [{ id: "", name: "", label: "", type: "select", options: "bad" as never, validations: "bad" as never }]
    });
    expect(invalidField.errors.map((error) => error.code)).toContain("metadata.invalidField");

    expect(validator.validatePage({ id: "", namespace: "", title: "" }).errors.map((error) => error.code)).toContain("metadata.invalidPage");
    expect(validator.validateMenu({ id: "", namespace: "", label: "", items: "bad" as never }).errors.map((error) => error.code)).toContain("metadata.invalidMenu");
    expect(validator.validateMenu({ id: "m", namespace: "crm", label: "CRM", items: [{ id: "", label: "", children: [{ id: "child", label: "Child" }] }] }).errors.map((error) => error.code)).toContain("metadata.invalidMenu");
  });

  it("accepts all field, relation, action and view enum variants", () => {
    const fieldTypes = ["text", "textarea", "number", "boolean", "date", "datetime", "email", "phone", "url", "select", "multiselect", "relation", "json", "currency", "status"] as const;
    const relationTypes = ["oneToOne", "oneToMany", "manyToOne", "manyToMany"] as const;
    const actionTypes = ["create", "update", "delete", "archive", "restore", "export", "import", "send", "approve", "reject", "custom"] as const;
    const viewTypes = ["list", "detail", "form", "kanban", "calendar", "dashboard", "custom"] as const;
    const validator = new MetadataValidator();
    const result = validator.validateEntity({
      id: "full",
      namespace: "qa",
      name: "Full",
      label: "Full",
      fields: fieldTypes.map((type) => ({ id: type, name: type, label: type, type, options: type === "select" ? [{ value: "a", label: "A" }] : undefined, validations: [{ id: `${type}-required`, type: "required" }] })),
      relations: relationTypes.map((type) => ({ id: type, type, targetNamespace: "qa", targetEntity: "target", sourceField: "id", targetField: "id" })),
      actions: actionTypes.map((type) => ({ id: type, label: type, type, confirmationRequired: type === "delete", permission: `qa.${type}` })),
      views: viewTypes.map((type) => ({ id: type, type, label: type, entity: "full", filters: [{ id: `${type}-filter`, field: "text", operator: "eq", value: "x" }], sort: [{ field: "text", direction: "asc" as const }] }))
    });
    expect(result.valid).toBe(true);
  });

  it("keeps diagnostics safe when details contain unsafe values", () => {
    const diagnostic = createMetadataDiagnostic({
      code: "metadata.validation.warning",
      message: "warning",
      severity: "warning",
      details: {
        password: "hidden",
        error: new Error("safe message"),
        fn: () => "drop",
        symbol: Symbol("drop"),
        count: 1
      }
    });
    expect(diagnostic.details).toEqual({ error: "safe message", count: 1 });
  });

  it("rejects instance and sensitive key values", () => {
    const registry = new InMemoryMetadataRegistry();
    expect(() => registry.registerResource({ id: "date", namespace: "qa", type: "setting", definition: { value: new Date() } })).toThrow("Metadata contains unsafe values");
    expect(() => registry.registerResource({ id: "secret", namespace: "qa", type: "setting", definition: { apiKey: "x" } })).toThrow("Metadata contains unsafe values");
  });


  it("covers registry failure branches and local menu page references", () => {
    const registry = new InMemoryMetadataRegistry();
    expect(() => registry.registerResource({ id: "", namespace: "", type: "setting" })).toThrow();
    expect(() => registry.registerEntity({ id: "", namespace: "", name: "", label: "", fields: [] })).toThrow();
    expect(() => registry.registerPage({ id: "", namespace: "", title: "" })).toThrow();
    expect(() => registry.registerMenu({ id: "", namespace: "", label: "", items: "bad" as never })).toThrow();

    registry.registerPage({ id: "local", namespace: "qa", title: "Local", route: "/qa/local" });
    registry.registerMenu({ id: "qa-menu", namespace: "qa", label: "QA", items: [{ id: "local", label: "Local", page: "local" }, { id: "route", label: "Route", route: "/qa" }] });
    expect(registry.listResources()).toHaveLength(2);
    expect(registry.snapshot().warnings.map((warning) => warning.code)).not.toContain("metadata.optionalReferenceMissing");
  });

  it("normalizes metadata failures without stack details", () => {
    expect(normalizeMetadataFailure(new Error("boom"))).toMatchObject({ code: "metadata.snapshotFailed", message: "boom" });
    expect(normalizeMetadataFailure("boom", "metadata.resolutionFailed")).toMatchObject({ code: "metadata.resolutionFailed", message: "Metadata operation failed." });
  });
});



describe("Metadata integration error branches", () => {
  it("covers direct missing required fields in validator", () => {
    const validator = new MetadataValidator();
    expect(validator.validateResource({ id: "", namespace: "", type: "setting" }).errors.map((error) => error.code)).toContain("metadata.invalidResource");
    const entity = validator.validateEntity({ id: "", namespace: "", name: "", label: "", fields: [] });
    expect(entity.warnings.map((warning) => warning.code)).toEqual(expect.arrayContaining(["metadata.invalidEntity", "metadata.entityWithoutFields"]));
    expect(entity.errors.map((error) => error.code)).toContain("metadata.invalidEntity");
    expect(validator.validateEntity({ ...customerEntity, views: [{ id: "", label: "", type: "list" }] }).errors.map((error) => error.code)).toContain("metadata.invalidResource");
  });

  it("normalizes metadata snapshot errors in Kernel Status", async () => {
    const failingKernel = new VeltryxKernel({
      configuration: { getString: () => undefined } as never,
      events: { publish: async () => undefined, subscribe: () => undefined } as never,
      modules: { snapshot: async () => ({ status: "empty", modulesDiscovered: 0, modulesResolved: 0, modulesLoaded: 0, modules: [], warnings: [], errors: [], diagnostics: [], generatedAt: "now", reports: { discovery: undefined, resolution: undefined, loading: undefined } }) } as never,
      services: { snapshot: () => ({ status: "empty", generatedAt: "now", servicesRegistered: 0, servicesAvailable: 0, servicesWithWarnings: 0, servicesWithErrors: 0, services: [], warnings: [], errors: [], diagnostics: [] }), list: () => [] } as never,
      metadata: { snapshot: () => { throw new Error("metadata down"); } } as never,
      runtime: { state: () => "created" } as never
    });
    const failed = await failingKernel.status({ environment: "test" }).snapshot();
    expect(failed.errors.map((error) => error.code)).toContain("KERNEL_METADATA_REGISTRY_FAILED");

    const degradedKernel = new VeltryxKernel({
      configuration: { getString: () => undefined } as never,
      events: { publish: async () => undefined, subscribe: () => undefined } as never,
      modules: { snapshot: async () => ({ status: "empty", modulesDiscovered: 0, modulesResolved: 0, modulesLoaded: 0, modules: [], warnings: [], errors: [], diagnostics: [], generatedAt: "now", reports: { discovery: undefined, resolution: undefined, loading: undefined } }) } as never,
      services: { snapshot: () => ({ status: "empty", generatedAt: "now", servicesRegistered: 0, servicesAvailable: 0, servicesWithWarnings: 0, servicesWithErrors: 0, services: [], warnings: [], errors: [], diagnostics: [] }), list: () => [] } as never,
      metadata: { snapshot: () => ({ status: "error", generatedAt: "now", namespacesRegistered: 0, resourcesRegistered: 0, entitiesRegistered: 0, pagesRegistered: 0, menusRegistered: 0, resourcesByType: {}, namespaces: [], resources: [], warnings: [], errors: [{ code: "metadata.snapshotFailed", message: "failed", source: "metadata" }], diagnostics: [] }) } as never,
      runtime: { state: () => "created" } as never
    });
    const degraded = await degradedKernel.status({ environment: "test" }).snapshot();
    expect(degraded.errors.map((error) => error.code)).toContain("KERNEL_METADATA_REGISTRY_DEGRADED");
  });
});
