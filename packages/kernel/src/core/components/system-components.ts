import type { ComponentDefinition, IComponentRegistry } from "@veltryx/contracts";

const VERSION = "1.0.0";

export const SYSTEM_COMPONENTS: readonly ComponentDefinition[] = Object.freeze([
  {
    key: "system.page",
    name: "Page",
    label: "Page",
    type: "layout",
    category: "page",
    version: VERSION,
    capabilities: ["canRenderChildren", "canUseSlots"],
    slots: [{ name: "content", multiple: true }],
    allowedChildren: ["system.section", "system.container", "system.card", "system.navigation"],
    source: "kernel"
  },
  { key: "system.section", name: "Section", label: "Section", type: "layout", category: "section", version: VERSION, capabilities: ["canRenderChildren"], allowedChildren: ["system.container", "system.card", "system.grid", "system.stack", "system.table", "system.form", "system.emptyState", "system.errorState"], source: "kernel" },
  { key: "system.container", name: "Container", label: "Container", type: "layout", category: "container", version: VERSION, capabilities: ["canRenderChildren"], source: "kernel" },
  { key: "system.card", name: "Card", label: "Card", type: "display", category: "card", version: VERSION, capabilities: ["canRenderChildren", "canUseSlots"], slots: [{ name: "header" }, { name: "body" }, { name: "footer" }, { name: "actions" }], source: "kernel" },
  { key: "system.grid", name: "Grid", label: "Grid", type: "layout", category: "layout", version: VERSION, capabilities: ["canRenderChildren"], propsSchema: [{ name: "columns", type: "number", defaultValue: 1 }], source: "kernel" },
  { key: "system.stack", name: "Stack", label: "Stack", type: "layout", category: "layout", version: VERSION, capabilities: ["canRenderChildren"], source: "kernel" },
  { key: "system.table", name: "Table", label: "Table", type: "data", category: "table", version: VERSION, capabilities: ["canBindData", "canRenderCollection", "canReceiveActions"], propsSchema: [{ name: "label", type: "string" }, { name: "entity", type: "string" }, { name: "columns", type: "array" }], source: "kernel" },
  { key: "system.form", name: "Form", label: "Form", type: "form", category: "form", version: VERSION, capabilities: ["canRenderChildren", "canBindData", "canSubmitForm", "canReceiveActions"], propsSchema: [{ name: "label", type: "string" }, { name: "entity", type: "string" }], allowedChildren: ["system.field", "system.input", "system.select", "system.textarea", "system.checkbox", "system.button"], source: "kernel" },
  { key: "system.field", name: "Field", label: "Field", type: "form", category: "field", version: VERSION, capabilities: ["canRenderField", "canBindData", "canRenderChildren"], propsSchema: [{ name: "field", type: "string", required: true }, { name: "label", type: "string" }, { name: "required", type: "boolean" }, { name: "readonly", type: "boolean" }, { name: "hidden", type: "boolean" }], source: "kernel" },
  { key: "system.input", name: "Input", label: "Input", type: "form", category: "field", version: VERSION, capabilities: ["canRenderField", "canBindData"], propsSchema: [{ name: "field", type: "string" }, { name: "inputType", type: "variant", options: ["text", "email", "number", "date", "datetime"] }], source: "kernel" },
  { key: "system.select", name: "Select", label: "Select", type: "form", category: "field", version: VERSION, capabilities: ["canRenderField", "canBindData"], source: "kernel" },
  { key: "system.textarea", name: "Textarea", label: "Textarea", type: "form", category: "field", version: VERSION, capabilities: ["canRenderField", "canBindData"], source: "kernel" },
  { key: "system.checkbox", name: "Checkbox", label: "Checkbox", type: "form", category: "field", version: VERSION, capabilities: ["canRenderField", "canBindData"], source: "kernel" },
  { key: "system.button", name: "Button", label: "Button", type: "action", category: "button", version: VERSION, capabilities: ["canReceiveActions"], propsSchema: [{ name: "label", type: "string", required: true }, { name: "variant", type: "variant", options: ["primary", "secondary", "danger", "ghost"] }], source: "kernel" },
  { key: "system.badge", name: "Badge", label: "Badge", type: "feedback", category: "status", version: VERSION, capabilities: ["canDisplayStatus"], source: "kernel" },
  { key: "system.heading", name: "Heading", label: "Heading", type: "content", category: "typography", version: VERSION, propsSchema: [{ name: "text", type: "string", required: true }, { name: "level", type: "number", defaultValue: 2 }], source: "kernel" },
  { key: "system.text", name: "Text", label: "Text", type: "content", category: "typography", version: VERSION, propsSchema: [{ name: "text", type: "string" }], source: "kernel" },
  { key: "system.emptyState", name: "Empty State", label: "Empty State", type: "feedback", category: "feedback", version: VERSION, capabilities: ["canDisplayStatus"], source: "kernel" },
  { key: "system.errorState", name: "Error State", label: "Error State", type: "feedback", category: "feedback", version: VERSION, capabilities: ["canDisplayStatus"], source: "kernel" },
  { key: "system.statusIndicator", name: "Status Indicator", label: "Status Indicator", type: "feedback", category: "status", version: VERSION, capabilities: ["canDisplayStatus"], source: "kernel" },
  { key: "system.navigation", name: "Navigation", label: "Navigation", type: "navigation", category: "navigation", version: VERSION, capabilities: ["canNavigate", "canRenderChildren"], allowedChildren: ["system.menu"], source: "kernel" },
  { key: "system.menu", name: "Menu", label: "Menu", type: "navigation", category: "navigation", version: VERSION, capabilities: ["canNavigate", "canRenderCollection"], propsSchema: [{ name: "label", type: "string" }, { name: "items", type: "array", required: true }], source: "kernel" }
]);

export function registerSystemComponents(registry: IComponentRegistry): void {
  for (const component of SYSTEM_COMPONENTS) registry.register(component, { replace: true, source: "kernel" });
}

