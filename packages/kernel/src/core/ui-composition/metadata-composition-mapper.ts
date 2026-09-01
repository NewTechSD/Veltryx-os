import type {
  CompositionInput,
  CompositionNode,
  MetadataForm,
  MetadataList,
  MetadataMenu,
  MetadataMenuItem,
  MetadataPage,
  MetadataPageSection,
  MetadataView
} from "@veltryx/contracts";
import { createCompositionError } from "./composition-diagnostics.js";

export interface MetadataCompositionMappingResult {
  readonly root?: CompositionNode;
  readonly errors: ReturnType<typeof createCompositionError>[];
}

export class MetadataCompositionMapper {
  map(input: CompositionInput): MetadataCompositionMappingResult {
    if (!input.metadata || typeof input.metadata !== "object") return { errors: [createCompositionError("composition.metadataMissing", "Composition metadata is required.", { sourceId: input.sourceId })] };
    switch (input.sourceType) {
      case "page": return this.mapPage(input.metadata as MetadataPage);
      case "form": return this.mapForm(input.metadata as MetadataForm);
      case "list": return this.mapList(input.metadata as MetadataList);
      case "menu": return this.mapMenu(input.metadata as MetadataMenu);
      case "view": return this.mapView(input.metadata as MetadataView);
      case "custom": return this.mapCustom(input.metadata);
      default: return { errors: [createCompositionError("composition.invalidSourceType", "Composition sourceType is invalid.", { sourceType: String(input.sourceType) })] };
    }
  }

  private mapPage(page: MetadataPage): MetadataCompositionMappingResult {
    if (!page.id || !page.namespace) return { errors: [createCompositionError("composition.invalidMetadata", "MetadataPage id and namespace are required.")] };
    return {
      root: {
        id: this.nodeId("page", page.id),
        componentKey: "system.page",
        props: { title: page.title, route: page.route, layout: page.layout, namespace: page.namespace },
        children: (page.sections ?? []).map((section) => this.mapPageSection(section))
      },
      errors: []
    };
  }

  private mapPageSection(section: MetadataPageSection): CompositionNode {
    const componentKey = section.type === "card" ? "system.card" : section.type === "container" ? "system.container" : "system.section";
    return {
      id: this.nodeId("section", section.id),
      componentKey,
      props: { title: section.title, resource: section.resource, sectionType: section.type },
      children: (section.children ?? []).map((child) => this.mapPageSection(child))
    };
  }

  private mapForm(form: MetadataForm): MetadataCompositionMappingResult {
    if (!form.id || !form.entity || !Array.isArray(form.fields)) return { errors: [createCompositionError("composition.invalidMetadata", "MetadataForm id, entity and fields are required.")] };
    return {
      root: {
        id: this.nodeId("form", form.id),
        componentKey: "system.form",
        props: { label: form.label, entity: form.entity, layout: form.layout },
        children: [
          ...form.fields.map((field) => ({
            id: this.nodeId("field", field.field),
            componentKey: "system.field",
            props: { field: field.field, label: field.label, required: field.required, readonly: field.readonly, hidden: field.hidden },
            bindings: [{ prop: "value", source: "metadata", path: field.field }]
          })),
          ...(form.actions ?? []).map((action) => ({ id: this.nodeId("action", action), componentKey: "system.button", props: { label: action, variant: "primary" }, actions: [{ action }] }))
        ]
      },
      errors: []
    };
  }

  private mapList(list: MetadataList): MetadataCompositionMappingResult {
    if (!list.id || !list.entity || !Array.isArray(list.columns)) return { errors: [createCompositionError("composition.invalidMetadata", "MetadataList id, entity and columns are required.")] };
    return {
      root: {
        id: this.nodeId("list", list.id),
        componentKey: "system.table",
        props: { label: list.label, entity: list.entity, columns: list.columns, filters: list.filters, sort: list.sort },
        actions: (list.actions ?? []).map((action) => ({ action }))
      },
      errors: []
    };
  }

  private mapMenu(menu: MetadataMenu): MetadataCompositionMappingResult {
    if (!menu.id || !menu.namespace || !Array.isArray(menu.items)) return { errors: [createCompositionError("composition.invalidMetadata", "MetadataMenu id, namespace and items are required.")] };
    return { root: { id: this.nodeId("menu", menu.id), componentKey: "system.menu", props: { label: menu.label, items: menu.items.map((item) => this.safeMenuItem(item)) } }, errors: [] };
  }

  private mapView(view: MetadataView): MetadataCompositionMappingResult {
    if (!view.id || !view.label) return { errors: [createCompositionError("composition.invalidMetadata", "MetadataView id and label are required.")] };
    return { root: { id: this.nodeId("view", view.id), componentKey: "system.container", props: { label: view.label, type: view.type, entity: view.entity, fields: view.fields } }, errors: [] };
  }

  private mapCustom(metadata: unknown): MetadataCompositionMappingResult {
    const node = (metadata as { readonly root?: CompositionNode }).root;
    if (!node) return { errors: [createCompositionError("composition.invalidMetadata", "Custom composition metadata requires a root node.")] };
    return { root: node, errors: [] };
  }

  private safeMenuItem(item: MetadataMenuItem): Record<string, unknown> {
    return { id: item.id, label: item.label, page: item.page, route: item.route, children: item.children?.map((child) => this.safeMenuItem(child)) };
  }

  private nodeId(prefix: string, id: string): string {
    return `${prefix}:${id}`.replace(/[^A-Za-z0-9_.:-]/g, "-");
  }
}
