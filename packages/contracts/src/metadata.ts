import type { IExecutionContext } from "./context.js";

export type MetadataStatus = "draft" | "validated" | "registered" | "published" | "active" | "deprecated" | "archived";
export type MetadataEngineStatus = "empty" | "ready" | "partial" | "error";
export type MetadataDiagnosticSeverity = "info" | "warning" | "error";

export type MetadataResourceType =
  | "entity"
  | "field"
  | "relation"
  | "action"
  | "view"
  | "form"
  | "list"
  | "page"
  | "menu"
  | "permission"
  | "validation"
  | "setting"
  | "dashboard";

export type MetadataFieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "email"
  | "phone"
  | "url"
  | "select"
  | "multiselect"
  | "relation"
  | "json"
  | "currency"
  | "status";

export type MetadataRelationType = "oneToOne" | "oneToMany" | "manyToOne" | "manyToMany";
export type MetadataActionType =
  | "create"
  | "update"
  | "delete"
  | "archive"
  | "restore"
  | "export"
  | "import"
  | "send"
  | "approve"
  | "reject"
  | "custom";
export type MetadataViewType = "list" | "detail" | "form" | "kanban" | "calendar" | "dashboard" | "custom";

export interface MetadataRecord<TMetadata = unknown> {
  readonly namespace: string;
  readonly key: string;
  readonly version: string;
  readonly owner: string;
  readonly status: MetadataStatus;
  readonly metadata: TMetadata;
}

export interface MetadataQuery {
  readonly namespace: string;
  readonly key: string;
  readonly version?: string;
  readonly context?: IExecutionContext;
}

export interface MetadataNamespace {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly source?: string;
  readonly version?: string;
}

export interface MetadataResource<TDefinition = unknown> {
  readonly id: string;
  readonly namespace: string;
  readonly type: MetadataResourceType;
  readonly label?: string;
  readonly description?: string;
  readonly source?: string;
  readonly version?: string;
  readonly definition?: TDefinition;
}

export interface MetadataValidationRule {
  readonly id: string;
  readonly type: string;
  readonly message?: string;
  readonly config?: Readonly<Record<string, unknown>>;
}

export interface MetadataFieldOption {
  readonly value: string | number | boolean;
  readonly label: string;
  readonly description?: string;
}

export interface MetadataField {
  readonly id: string;
  readonly name: string;
  readonly label: string;
  readonly type: MetadataFieldType;
  readonly required?: boolean;
  readonly readonly?: boolean;
  readonly hidden?: boolean;
  readonly defaultValue?: unknown;
  readonly placeholder?: string;
  readonly helpText?: string;
  readonly validations?: readonly MetadataValidationRule[];
  readonly options?: readonly MetadataFieldOption[];
}

export interface MetadataRelation {
  readonly id: string;
  readonly type: MetadataRelationType;
  readonly targetNamespace: string;
  readonly targetEntity: string;
  readonly sourceField?: string;
  readonly targetField?: string;
  readonly label?: string;
  readonly required?: boolean;
}

export interface MetadataAction {
  readonly id: string;
  readonly label: string;
  readonly type: MetadataActionType;
  readonly target?: string;
  readonly confirmationRequired?: boolean;
  readonly permission?: string;
  readonly payloadSchema?: Readonly<Record<string, unknown>>;
}

export interface MetadataFilterDefinition {
  readonly id: string;
  readonly field: string;
  readonly operator: string;
  readonly value?: unknown;
}

export interface MetadataSortDefinition {
  readonly field: string;
  readonly direction: "asc" | "desc";
}

export interface MetadataView {
  readonly id: string;
  readonly type: MetadataViewType;
  readonly label: string;
  readonly entity?: string;
  readonly fields?: readonly string[];
  readonly actions?: readonly string[];
  readonly filters?: readonly MetadataFilterDefinition[];
  readonly sort?: readonly MetadataSortDefinition[];
}

export interface MetadataLayoutDefinition {
  readonly type: string;
  readonly columns?: number;
  readonly sections?: readonly string[];
}

export interface MetadataFormField {
  readonly field: string;
  readonly label?: string;
  readonly required?: boolean;
  readonly readonly?: boolean;
  readonly hidden?: boolean;
}

export interface MetadataForm {
  readonly id: string;
  readonly label: string;
  readonly entity: string;
  readonly fields: readonly MetadataFormField[];
  readonly layout?: MetadataLayoutDefinition;
  readonly actions?: readonly string[];
}

export interface MetadataListColumn {
  readonly field: string;
  readonly label?: string;
  readonly sortable?: boolean;
  readonly hidden?: boolean;
}

export interface MetadataList {
  readonly id: string;
  readonly label: string;
  readonly entity: string;
  readonly columns: readonly MetadataListColumn[];
  readonly filters?: readonly MetadataFilterDefinition[];
  readonly sort?: readonly MetadataSortDefinition[];
  readonly actions?: readonly string[];
}

export interface MetadataPermissionDeclaration {
  readonly id: string;
  readonly action: string;
  readonly resource: string;
  readonly description?: string;
}

export interface MetadataEntity {
  readonly id: string;
  readonly namespace: string;
  readonly name: string;
  readonly label: string;
  readonly description?: string;
  readonly fields: readonly MetadataField[];
  readonly relations?: readonly MetadataRelation[];
  readonly actions?: readonly MetadataAction[];
  readonly views?: readonly MetadataView[];
  readonly forms?: readonly MetadataForm[];
  readonly lists?: readonly MetadataList[];
  readonly permissions?: readonly MetadataPermissionDeclaration[];
  readonly tags?: readonly string[];
  readonly source?: string;
  readonly version?: string;
}

export interface MetadataPageSection {
  readonly id: string;
  readonly type: string;
  readonly title?: string;
  readonly resource?: string;
  readonly children?: readonly MetadataPageSection[];
}

export interface MetadataPage {
  readonly id: string;
  readonly namespace: string;
  readonly title: string;
  readonly route?: string;
  readonly layout?: string;
  readonly sections?: readonly MetadataPageSection[];
  readonly actions?: readonly string[];
  readonly menu?: string;
  readonly permission?: string;
}

export interface MetadataMenuItem {
  readonly id: string;
  readonly label: string;
  readonly page?: string;
  readonly route?: string;
  readonly permission?: string;
  readonly children?: readonly MetadataMenuItem[];
}

export interface MetadataMenu {
  readonly id: string;
  readonly namespace: string;
  readonly label: string;
  readonly items: readonly MetadataMenuItem[];
}

export interface MetadataDiagnosticEntry {
  readonly code: string;
  readonly message: string;
  readonly severity: MetadataDiagnosticSeverity;
  readonly source: string;
  readonly details?: Readonly<Record<string, unknown>>;
  readonly timestamp?: string;
}
export type MetadataWarning = Omit<MetadataDiagnosticEntry, "severity">;
export type MetadataError = Omit<MetadataDiagnosticEntry, "severity">;

export interface MetadataNamespaceSnapshot {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly source?: string;
  readonly version?: string;
}

export interface MetadataResourceSnapshot {
  readonly id: string;
  readonly namespace: string;
  readonly type: MetadataResourceType;
  readonly label?: string;
  readonly source?: string;
  readonly version?: string;
}

export interface MetadataEngineSnapshot {
  readonly status: MetadataEngineStatus;
  readonly generatedAt: string;
  readonly namespacesRegistered: number;
  readonly resourcesRegistered: number;
  readonly entitiesRegistered: number;
  readonly pagesRegistered: number;
  readonly menusRegistered: number;
  readonly resourcesByType: Readonly<Record<string, number>>;
  readonly namespaces: readonly MetadataNamespaceSnapshot[];
  readonly resources: readonly MetadataResourceSnapshot[];
  readonly warnings: readonly MetadataWarning[];
  readonly errors: readonly MetadataError[];
  readonly diagnostics: readonly MetadataDiagnosticEntry[];
}

export interface MetadataValidationResult {
  readonly valid: boolean;
  readonly warnings: readonly MetadataWarning[];
  readonly errors: readonly MetadataError[];
}

export interface MetadataResolutionResult<TResource = MetadataResource> {
  readonly found: boolean;
  readonly namespace: string;
  readonly id: string;
  readonly type?: MetadataResourceType;
  readonly resource?: TResource;
  readonly error?: MetadataError;
}

export interface MetadataRegistrationOptions {
  readonly override?: boolean;
  readonly source?: string;
}

export interface IMetadataValidator {
  validateNamespace(namespace: MetadataNamespace): MetadataValidationResult;
  validateResource(resource: MetadataResource): MetadataValidationResult;
  validateEntity(entity: MetadataEntity): MetadataValidationResult;
  validatePage(page: MetadataPage): MetadataValidationResult;
  validateMenu(menu: MetadataMenu): MetadataValidationResult;
}

export interface IMetadataResolver {
  resolve<TResource = MetadataResource>(namespace: string, id: string): MetadataResolutionResult<TResource>;
  resolveEntity(namespace: string, id: string): MetadataResolutionResult<MetadataResource<MetadataEntity>>;
  resolvePage(namespace: string, id: string): MetadataResolutionResult<MetadataResource<MetadataPage>>;
  resolveMenu(namespace: string, id: string): MetadataResolutionResult<MetadataResource<MetadataMenu>>;
  resolveByType(type: MetadataResourceType, namespace?: string): readonly MetadataResource[];
}

export interface IMetadataSnapshotService {
  snapshot(): MetadataEngineSnapshot;
}

export interface IMetadataRegistry extends IMetadataResolver, IMetadataSnapshotService {
  register<TMetadata>(record: MetadataRecord<TMetadata>): Promise<void>;
  get<TMetadata>(query: MetadataQuery): Promise<MetadataRecord<TMetadata> | undefined>;
  list(namespace: string): Promise<readonly MetadataRecord[]>;
  listVersions(namespace: string, key: string): Promise<readonly string[]>;
  registerNamespace(namespace: MetadataNamespace): MetadataNamespace;
  registerResource(resource: MetadataResource, options?: MetadataRegistrationOptions): MetadataResource;
  registerEntity(entity: MetadataEntity, options?: MetadataRegistrationOptions): MetadataResource<MetadataEntity>;
  registerPage(page: MetadataPage, options?: MetadataRegistrationOptions): MetadataResource<MetadataPage>;
  registerMenu(menu: MetadataMenu, options?: MetadataRegistrationOptions): MetadataResource<MetadataMenu>;
  listResources(namespace?: string): readonly MetadataResource[];
  listNamespaces(): readonly MetadataNamespace[];
}

export type IMetadataEngine = IMetadataRegistry;
