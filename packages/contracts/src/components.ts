export type ComponentRegistryStatus = "empty" | "ready" | "partial" | "error";
export type ComponentDiagnosticSeverity = "info" | "warning" | "error";

export type ComponentKey = string;

export type ComponentType =
  | "layout"
  | "display"
  | "data"
  | "form"
  | "navigation"
  | "feedback"
  | "action"
  | "overlay"
  | "content"
  | "system";

export type ComponentCategory =
  | "page"
  | "section"
  | "container"
  | "card"
  | "table"
  | "form"
  | "field"
  | "button"
  | "navigation"
  | "status"
  | "feedback"
  | "media"
  | "typography"
  | "layout"
  | "system";

export type ComponentCapability =
  | "canRenderChildren"
  | "canReceiveActions"
  | "canBindData"
  | "canUseSlots"
  | "canDisplayStatus"
  | "canSubmitForm"
  | "canNavigate"
  | "canRenderCollection"
  | "canRenderField";

export type ComponentPropType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "array"
  | "object"
  | "enum"
  | "icon"
  | "image"
  | "url"
  | "color"
  | "spacing"
  | "variant"
  | "unknown";

export interface ComponentPropDefinition {
  readonly name: string;
  readonly type: ComponentPropType;
  readonly required?: boolean;
  readonly defaultValue?: unknown;
  readonly description?: string;
  readonly options?: readonly unknown[];
}

export type ComponentPropsSchema = readonly ComponentPropDefinition[];

export interface ComponentSlotDefinition {
  readonly name: string;
  readonly required?: boolean;
  readonly accepts?: readonly ComponentKey[];
  readonly multiple?: boolean;
}

export interface ComponentDefinition {
  readonly key: ComponentKey;
  readonly name: string;
  readonly label: string;
  readonly description?: string;
  readonly type: ComponentType;
  readonly category: ComponentCategory;
  readonly version: string;
  readonly propsSchema?: ComponentPropsSchema;
  readonly slots?: readonly ComponentSlotDefinition[];
  readonly capabilities?: readonly ComponentCapability[];
  readonly allowedChildren?: readonly ComponentKey[];
  readonly tags?: readonly string[];
  readonly source?: string;
}

export type ComponentDefinitionInput = ComponentDefinition;
export type ComponentDefinitionSnapshot = ComponentDefinition;

export interface ComponentRegistryDiagnosticEntry {
  readonly code: string;
  readonly message: string;
  readonly severity: ComponentDiagnosticSeverity;
  readonly source: "components";
  readonly details?: Readonly<Record<string, unknown>>;
  readonly timestamp?: string;
}

export type ComponentRegistryWarning = Omit<ComponentRegistryDiagnosticEntry, "severity">;
export type ComponentRegistryError = Omit<ComponentRegistryDiagnosticEntry, "severity">;

export interface ComponentValidationResult {
  readonly valid: boolean;
  readonly warnings: readonly ComponentRegistryWarning[];
  readonly errors: readonly ComponentRegistryError[];
}

export interface ComponentResolutionResult {
  readonly found: boolean;
  readonly key: ComponentKey;
  readonly version?: string;
  readonly component?: ComponentDefinition;
  readonly error?: ComponentRegistryError;
}

export interface ComponentRegistrationOptions {
  readonly replace?: boolean;
  readonly source?: string;
}

export interface ComponentRegistrySnapshot {
  readonly status: ComponentRegistryStatus;
  readonly generatedAt: string;
  readonly componentsRegistered: number;
  readonly componentsByType: Readonly<Record<string, number>>;
  readonly componentsByCategory: Readonly<Record<string, number>>;
  readonly components: readonly ComponentDefinitionSnapshot[];
  readonly warnings: readonly ComponentRegistryWarning[];
  readonly errors: readonly ComponentRegistryError[];
  readonly diagnostics: readonly ComponentRegistryDiagnosticEntry[];
}

export interface IComponentValidator {
  validate(component: ComponentDefinition): ComponentValidationResult;
}

export interface IComponentResolver {
  resolve(key: ComponentKey, version?: string): ComponentResolutionResult;
  resolveByType(type: ComponentType): readonly ComponentDefinition[];
  resolveByCategory(category: ComponentCategory): readonly ComponentDefinition[];
}

export interface IComponentSnapshotService {
  snapshot(input?: {
    readonly components: readonly ComponentDefinition[];
    readonly warnings: readonly ComponentRegistryWarning[];
    readonly errors: readonly ComponentRegistryError[];
    readonly diagnostics: readonly ComponentRegistryDiagnosticEntry[];
  }): ComponentRegistrySnapshot;
}

export interface IComponentRegistry extends IComponentResolver {
  register(
    component: ComponentDefinitionInput,
    options?: ComponentRegistrationOptions
  ): ComponentDefinition;
  list(): readonly ComponentDefinition[];
  snapshot(): ComponentRegistrySnapshot;
}
