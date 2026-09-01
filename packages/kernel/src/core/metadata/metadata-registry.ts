import type {
  IMetadataRegistry,
  MetadataDiagnosticEntry,
  MetadataEngineSnapshot,
  MetadataEntity,
  MetadataMenu,
  MetadataMenuItem,
  MetadataNamespace,
  MetadataPage,
  MetadataQuery,
  MetadataRecord,
  MetadataRegistrationOptions,
  MetadataResolutionResult,
  MetadataResource,
  MetadataResourceType,
  MetadataValidationResult,
  MetadataWarning
} from "@veltryx/contracts";
import { cloneAndFreezeMetadataValue, createMetadataDiagnostic, createMetadataError, createMetadataWarning } from "./metadata-diagnostics.js";
import { MetadataResolver } from "./metadata-resolver.js";
import { MetadataSnapshotService } from "./metadata-snapshot.js";
import { MetadataValidator } from "./metadata-validator.js";

export class MetadataRegistry implements IMetadataRegistry {
  private readonly legacyRecords = new Map<string, MetadataRecord>();
  private readonly namespaces = new Map<string, MetadataNamespace>();
  private readonly resources = new Map<string, MetadataResource>();
  private readonly warnings: MetadataWarning[] = [];
  private readonly errors: ReturnType<typeof createMetadataError>[] = [];
  private readonly diagnostics: MetadataDiagnosticEntry[] = [];
  private readonly resolver = new MetadataResolver({ resources: this.resources });

  constructor(
    private readonly validator = new MetadataValidator(),
    private readonly snapshotService = new MetadataSnapshotService()
  ) {}

  async register<TMetadata>(record: MetadataRecord<TMetadata>): Promise<void> {
    const registryKey = this.legacyKey(record.namespace, record.key, record.version);
    if (this.legacyRecords.has(registryKey)) throw new Error(`Metadata already registered: ${registryKey}`);
    if (!record.namespace.trim() || !record.key.trim() || !record.version.trim()) throw new Error("Metadata record namespace, key and version are required.");
    const frozen = cloneAndFreezeMetadataValue(record as MetadataRecord);
    this.legacyRecords.set(registryKey, frozen);
    this.ensureNamespace(record.namespace, "legacy");
    this.registerResource({ id: record.key, namespace: record.namespace, type: "setting", label: record.key, source: `legacy:${record.owner}`, version: record.version, definition: record.metadata }, { override: true });
  }

  async get<TMetadata>(query: MetadataQuery): Promise<MetadataRecord<TMetadata> | undefined> {
    if (query.version) return cloneAndFreezeMetadataValue(this.legacyRecords.get(this.legacyKey(query.namespace, query.key, query.version))) as MetadataRecord<TMetadata> | undefined;
    const record = [...this.legacyRecords.values()].find((item) => item.namespace === query.namespace && item.key === query.key);
    return record ? cloneAndFreezeMetadataValue(record) as MetadataRecord<TMetadata> : undefined;
  }

  async list(namespace: string): Promise<readonly MetadataRecord[]> {
    return Object.freeze([...this.legacyRecords.values()].filter((record) => record.namespace === namespace).map((record) => cloneAndFreezeMetadataValue(record)));
  }

  async listVersions(namespace: string, key: string): Promise<readonly string[]> {
    return Object.freeze([...this.legacyRecords.values()].filter((record) => record.namespace === namespace && record.key === key).map((record) => record.version));
  }

  registerNamespace(namespace: MetadataNamespace): MetadataNamespace {
    const validation = this.validator.validateNamespace(namespace);
    this.acceptValidation(validation);
    if (!validation.valid) throw this.registrationError(validation);
    if (this.namespaces.has(namespace.id)) throw this.duplicate(`Metadata namespace already registered: ${namespace.id}`);
    const frozen = cloneAndFreezeMetadataValue(namespace);
    this.namespaces.set(namespace.id, frozen);
    this.diagnostic("metadata.namespace.registered", "Metadata namespace registered.", { namespace: namespace.id });
    return cloneAndFreezeMetadataValue(frozen);
  }

  registerResource(resource: MetadataResource, options: MetadataRegistrationOptions = {}): MetadataResource {
    this.ensureNamespace(resource.namespace, options.source ?? resource.source);
    const validation = this.validator.validateResource(resource);
    this.acceptValidation(validation);
    if (!validation.valid) throw this.registrationError(validation);
    return this.storeResource(resource, options);
  }

  registerEntity(entity: MetadataEntity, options: MetadataRegistrationOptions = {}): MetadataResource<MetadataEntity> {
    this.ensureNamespace(entity.namespace, options.source ?? entity.source);
    const validation = this.validator.validateEntity(entity);
    this.acceptValidation(validation);
    if (!validation.valid) throw this.registrationError(validation);
    const resource = this.storeResource({ id: entity.id, namespace: entity.namespace, type: "entity", label: entity.label, source: options.source ?? entity.source, version: entity.version, definition: entity }, options) as MetadataResource<MetadataEntity>;
    this.diagnostic("metadata.entity.registered", "Metadata entity registered.", { namespace: entity.namespace, id: entity.id });
    return resource;
  }

  registerPage(page: MetadataPage, options: MetadataRegistrationOptions = {}): MetadataResource<MetadataPage> {
    this.ensureNamespace(page.namespace, options.source);
    const validation = this.validator.validatePage(page);
    this.acceptValidation(validation);
    if (!validation.valid) throw this.registrationError(validation);
    const resource = this.storeResource({ id: page.id, namespace: page.namespace, type: "page", label: page.title, source: options.source, definition: page }, options) as MetadataResource<MetadataPage>;
    this.diagnostic("metadata.page.registered", "Metadata page registered.", { namespace: page.namespace, id: page.id });
    return resource;
  }

  registerMenu(menu: MetadataMenu, options: MetadataRegistrationOptions = {}): MetadataResource<MetadataMenu> {
    this.ensureNamespace(menu.namespace, options.source);
    const validation = this.validator.validateMenu(menu);
    this.acceptValidation(validation);
    const pageWarnings = this.menuReferenceWarnings(menu);
    this.warnings.push(...pageWarnings);
    if (!validation.valid) throw this.registrationError(validation);
    const resource = this.storeResource({ id: menu.id, namespace: menu.namespace, type: "menu", label: menu.label, source: options.source, definition: menu }, options) as MetadataResource<MetadataMenu>;
    this.diagnostic("metadata.menu.registered", "Metadata menu registered.", { namespace: menu.namespace, id: menu.id });
    return resource;
  }

  resolve<TResource = MetadataResource>(namespace: string, id: string): MetadataResolutionResult<TResource> {
    return this.resolver.resolve<TResource>(namespace, id);
  }

  resolveEntity(namespace: string, id: string): MetadataResolutionResult<MetadataResource<MetadataEntity>> {
    return this.resolver.resolveEntity(namespace, id) as MetadataResolutionResult<MetadataResource<MetadataEntity>>;
  }

  resolvePage(namespace: string, id: string): MetadataResolutionResult<MetadataResource<MetadataPage>> {
    return this.resolver.resolvePage(namespace, id) as MetadataResolutionResult<MetadataResource<MetadataPage>>;
  }

  resolveMenu(namespace: string, id: string): MetadataResolutionResult<MetadataResource<MetadataMenu>> {
    return this.resolver.resolveMenu(namespace, id) as MetadataResolutionResult<MetadataResource<MetadataMenu>>;
  }

  resolveByType(type: MetadataResourceType, namespace?: string): readonly MetadataResource[] {
    return this.resolver.resolveByType(type, namespace);
  }

  listResources(namespace?: string): readonly MetadataResource[] {
    const resources = [...this.resources.values()].filter((resource) => !namespace || resource.namespace === namespace);
    return Object.freeze(resources.map((resource) => cloneAndFreezeMetadataValue(resource)));
  }

  listNamespaces(): readonly MetadataNamespace[] {
    return Object.freeze([...this.namespaces.values()].map((namespace) => cloneAndFreezeMetadataValue(namespace)));
  }

  snapshot(): MetadataEngineSnapshot {
    return this.snapshotService.snapshot({
      namespaces: this.listNamespaces(),
      resources: this.listResources(),
      warnings: this.warnings,
      errors: this.errors,
      diagnostics: this.diagnostics
    });
  }

  private storeResource(resource: MetadataResource, options: MetadataRegistrationOptions): MetadataResource {
    const key = this.resourceKey(resource.namespace, resource.id);
    if (this.resources.has(key) && !options.override) throw this.duplicate(`Metadata resource already registered: ${key}`);
    const frozen = cloneAndFreezeMetadataValue(resource);
    this.resources.set(key, frozen);
    this.diagnostic("metadata.resource.registered", "Metadata resource registered.", { namespace: resource.namespace, id: resource.id, type: resource.type });
    return cloneAndFreezeMetadataValue(frozen);
  }

  private ensureNamespace(id: string, source?: string): void {
    if (this.namespaces.has(id)) return;
    this.registerNamespace({ id, name: id, source, version: "1.0.0" });
  }

  private acceptValidation(validation: MetadataValidationResult): void {
    this.warnings.push(...validation.warnings);
    this.errors.push(...validation.errors);
    for (const warning of validation.warnings) this.diagnostics.push({ ...warning, severity: "warning" });
    for (const error of validation.errors) this.diagnostics.push({ ...error, severity: "error" });
  }

  private duplicate(message: string): Error {
    const error = createMetadataError("metadata.duplicateResource", message);
    this.errors.push(error);
    this.diagnostics.push({ ...error, severity: "error" });
    return new Error(message);
  }

  private registrationError(validation: MetadataValidationResult): Error {
    return new Error(validation.errors[0]?.message ?? "Metadata validation failed.");
  }

  private menuReferenceWarnings(menu: MetadataMenu): MetadataWarning[] {
    const warnings: MetadataWarning[] = [];
    const visit = (items: readonly MetadataMenuItem[]): void => {
      for (const item of items) {
        if (item.page) {
          const segments = item.page.split(".");
          const namespace = segments.length > 1 ? (segments[0] ?? menu.namespace) : menu.namespace;
          const id = segments.length > 1 ? segments.slice(1).join(".") : item.page;
          if (!this.resources.has(this.resourceKey(namespace, id))) {
            warnings.push(
              createMetadataWarning(
                "metadata.optionalReferenceMissing",
                "Metadata menu item references a page that is not registered.",
                "metadata",
                { menu: menu.id, page: item.page }
              )
            );
          }
        }
        if (item.children) visit(item.children);
      }
    };
    visit(menu.items);
    return warnings;
  }

  private diagnostic(code: string, message: string, details?: Readonly<Record<string, unknown>>): void {
    this.diagnostics.push(createMetadataDiagnostic({ code, message, severity: "info", source: "metadata", details, timestamp: new Date().toISOString() }));
  }

  private legacyKey(namespace: string, key: string, version: string): string {
    return `${namespace}:${key}:${version}`;
  }

  private resourceKey(namespace: string, id: string): string {
    return `${namespace}:${id}`;
  }
}



