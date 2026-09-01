import type {
  IMetadataValidator,
  MetadataAction,
  MetadataEntity,
  MetadataError,
  MetadataField,
  MetadataFieldType,
  MetadataMenu,
  MetadataMenuItem,
  MetadataNamespace,
  MetadataPage,
  MetadataRelation,
  MetadataResource,
  MetadataResourceType,
  MetadataValidationResult,
  MetadataView
} from "@veltryx/contracts";
import { createMetadataError, createMetadataWarning, hasUnsafeMetadataValue } from "./metadata-diagnostics.js";

const RESOURCE_TYPES = new Set<MetadataResourceType>([
  "entity", "field", "relation", "action", "view", "form", "list", "page", "menu", "permission", "validation", "setting", "dashboard"
]);
const FIELD_TYPES = new Set<MetadataFieldType>([
  "text", "textarea", "number", "boolean", "date", "datetime", "email", "phone", "url", "select", "multiselect", "relation", "json", "currency", "status"
]);
const RELATION_TYPES = new Set(["oneToOne", "oneToMany", "manyToOne", "manyToMany"]);
const ACTION_TYPES = new Set(["create", "update", "delete", "archive", "restore", "export", "import", "send", "approve", "reject", "custom"]);
const VIEW_TYPES = new Set(["list", "detail", "form", "kanban", "calendar", "dashboard", "custom"]);

export class MetadataValidator implements IMetadataValidator {
  validateNamespace(namespace: MetadataNamespace): MetadataValidationResult {
    const errors: MetadataError[] = [];
    if (!this.nonEmpty(namespace.id)) errors.push(createMetadataError("metadata.invalidNamespace", "Metadata namespace id is required."));
    if (!this.nonEmpty(namespace.name)) errors.push(createMetadataError("metadata.invalidNamespace", "Metadata namespace name is required."));
    this.collectUnsafe(namespace, errors, "metadata.invalidNamespace");
    return this.result([], errors);
  }

  validateResource(resource: MetadataResource): MetadataValidationResult {
    const errors: MetadataError[] = [];
    if (!this.nonEmpty(resource.id)) errors.push(createMetadataError("metadata.invalidResource", "Metadata resource id is required."));
    if (!this.nonEmpty(resource.namespace)) errors.push(createMetadataError("metadata.invalidResource", "Metadata resource namespace is required."));
    if (!RESOURCE_TYPES.has(resource.type)) errors.push(createMetadataError("metadata.invalidResource", "Metadata resource type is invalid."));
    this.collectUnsafe(resource, errors, "metadata.invalidResource");
    return this.result([], errors);
  }

  validateEntity(entity: MetadataEntity): MetadataValidationResult {
    const errors: MetadataError[] = [];
    const warnings = [];
    if (!this.nonEmpty(entity.id)) errors.push(createMetadataError("metadata.invalidEntity", "Metadata entity id is required."));
    if (!this.nonEmpty(entity.namespace)) errors.push(createMetadataError("metadata.invalidEntity", "Metadata entity namespace is required."));
    if (!this.nonEmpty(entity.name)) errors.push(createMetadataError("metadata.invalidEntity", "Metadata entity name is required."));
    if (!this.nonEmpty(entity.label)) warnings.push(createMetadataWarning("metadata.invalidEntity", "Metadata entity label is empty."));
    if (!Array.isArray(entity.fields)) errors.push(createMetadataError("metadata.invalidEntity", "Metadata entity fields must be an array."));
    else {
      if (entity.fields.length === 0) warnings.push(createMetadataWarning("metadata.entityWithoutFields", "Metadata entity has no fields."));
      this.collectDuplicateIds(entity.fields, errors, "metadata.invalidField", "Metadata entity has duplicate field ids.");
      for (const field of entity.fields) this.validateFieldInto(field, errors);
    }
    this.collectDuplicateIds(entity.relations ?? [], errors, "metadata.invalidRelation", "Metadata entity has duplicate relation ids.");
    for (const relation of entity.relations ?? []) this.validateRelationInto(relation, errors);
    this.collectDuplicateIds(entity.actions ?? [], errors, "metadata.invalidAction", "Metadata entity has duplicate action ids.");
    for (const action of entity.actions ?? []) this.validateActionInto(action, errors);
    this.collectDuplicateIds(entity.views ?? [], errors, "metadata.invalidResource", "Metadata entity has duplicate view ids.");
    for (const view of entity.views ?? []) this.validateViewInto(view, errors);
    this.collectUnsafe(entity, errors, "metadata.invalidEntity");
    return this.result(warnings, errors);
  }

  validatePage(page: MetadataPage): MetadataValidationResult {
    const errors: MetadataError[] = [];
    const warnings = [];
    if (!this.nonEmpty(page.id)) errors.push(createMetadataError("metadata.invalidPage", "Metadata page id is required."));
    if (!this.nonEmpty(page.namespace)) errors.push(createMetadataError("metadata.invalidPage", "Metadata page namespace is required."));
    if (!this.nonEmpty(page.title)) warnings.push(createMetadataWarning("metadata.pageWithoutRoute", "Metadata page title is empty."));
    if (!this.nonEmpty(page.route)) warnings.push(createMetadataWarning("metadata.pageWithoutRoute", "Metadata page has no route."));
    this.collectUnsafe(page, errors, "metadata.invalidPage");
    return this.result(warnings, errors);
  }

  validateMenu(menu: MetadataMenu): MetadataValidationResult {
    const errors: MetadataError[] = [];
    const warnings = [];
    if (!this.nonEmpty(menu.id)) errors.push(createMetadataError("metadata.invalidMenu", "Metadata menu id is required."));
    if (!this.nonEmpty(menu.namespace)) errors.push(createMetadataError("metadata.invalidMenu", "Metadata menu namespace is required."));
    if (!this.nonEmpty(menu.label)) errors.push(createMetadataError("metadata.invalidMenu", "Metadata menu label is required."));
    if (!Array.isArray(menu.items)) errors.push(createMetadataError("metadata.invalidMenu", "Metadata menu items must be an array."));
    else if (menu.items.length === 0) warnings.push(createMetadataWarning("metadata.menuWithoutItems", "Metadata menu has no items."));
    for (const item of menu.items ?? []) this.validateMenuItemInto(item, errors);
    this.collectUnsafe(menu, errors, "metadata.invalidMenu");
    return this.result(warnings, errors);
  }

  private validateFieldInto(field: MetadataField, errors: MetadataError[]): void {
    if (!this.nonEmpty(field.id)) errors.push(createMetadataError("metadata.invalidField", "Metadata field id is required."));
    if (!this.nonEmpty(field.name)) errors.push(createMetadataError("metadata.invalidField", "Metadata field name is required."));
    if (!this.nonEmpty(field.label)) errors.push(createMetadataError("metadata.invalidField", "Metadata field label is required."));
    if (!FIELD_TYPES.has(field.type)) errors.push(createMetadataError("metadata.invalidField", "Metadata field type is invalid."));
    if (field.options !== undefined && !Array.isArray(field.options)) errors.push(createMetadataError("metadata.invalidField", "Metadata field options must be an array."));
    if (field.validations !== undefined && !Array.isArray(field.validations)) errors.push(createMetadataError("metadata.invalidField", "Metadata field validations must be an array."));
  }

  private validateRelationInto(relation: MetadataRelation, errors: MetadataError[]): void {
    if (!this.nonEmpty(relation.id)) errors.push(createMetadataError("metadata.invalidRelation", "Metadata relation id is required."));
    if (!RELATION_TYPES.has(relation.type)) errors.push(createMetadataError("metadata.invalidRelation", "Metadata relation type is invalid."));
    if (!this.nonEmpty(relation.targetNamespace)) errors.push(createMetadataError("metadata.invalidRelation", "Metadata relation targetNamespace is required."));
    if (!this.nonEmpty(relation.targetEntity)) errors.push(createMetadataError("metadata.invalidRelation", "Metadata relation targetEntity is required."));
  }

  private validateActionInto(action: MetadataAction, errors: MetadataError[]): void {
    if (!this.nonEmpty(action.id)) errors.push(createMetadataError("metadata.invalidAction", "Metadata action id is required."));
    if (!this.nonEmpty(action.label)) errors.push(createMetadataError("metadata.invalidAction", "Metadata action label is required."));
    if (!ACTION_TYPES.has(action.type)) errors.push(createMetadataError("metadata.invalidAction", "Metadata action type is invalid."));
  }

  private validateViewInto(view: MetadataView, errors: MetadataError[]): void {
    if (!this.nonEmpty(view.id)) errors.push(createMetadataError("metadata.invalidResource", "Metadata view id is required."));
    if (!this.nonEmpty(view.label)) errors.push(createMetadataError("metadata.invalidResource", "Metadata view label is required."));
    if (!VIEW_TYPES.has(view.type)) errors.push(createMetadataError("metadata.invalidResource", "Metadata view type is invalid."));
  }

  private validateMenuItemInto(item: MetadataMenuItem, errors: MetadataError[]): void {
    if (!this.nonEmpty(item.id)) errors.push(createMetadataError("metadata.invalidMenu", "Metadata menu item id is required."));
    if (!this.nonEmpty(item.label)) errors.push(createMetadataError("metadata.invalidMenu", "Metadata menu item label is required."));
    for (const child of item.children ?? []) this.validateMenuItemInto(child, errors);
  }

  private collectDuplicateIds(items: readonly { readonly id?: string }[], errors: MetadataError[], code: string, message: string): void {
    const ids = new Set<string>();
    for (const item of items) {
      if (!item.id) continue;
      if (ids.has(item.id)) errors.push(createMetadataError(code, message, "metadata", { id: item.id }));
      ids.add(item.id);
    }
  }

  private collectUnsafe(value: unknown, errors: MetadataError[], code: string): void {
    if (hasUnsafeMetadataValue(value)) errors.push(createMetadataError(code, "Metadata contains unsafe values."));
  }

  private nonEmpty(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
  }

  private result(warnings: MetadataValidationResult["warnings"], errors: MetadataValidationResult["errors"]): MetadataValidationResult {
    return Object.freeze({ valid: errors.length === 0, warnings: Object.freeze([...warnings]), errors: Object.freeze([...errors]) });
  }
}
