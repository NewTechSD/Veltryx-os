import type {
  ComponentDefinition, ComponentHydrationResult, ComponentPersistenceEntry,
  ComponentPersistenceResult, ComponentPersistenceSnapshot, ComponentPersistenceSummary,
  ComponentRegistryDiagnosticEntry, ComponentRegistryError, ComponentRegistryWarning,
  HydrateComponentRegistryInput, IComponentPersistenceService, IComponentRegistry,
  IPersistenceService, ListPersistedComponentsInput, LoadComponentInput,
  PersistAllComponentsInput, PersistComponentInput, PersistenceRecordData
} from "@veltryx/contracts";
import {
  cloneAndFreezeComponentValue, createComponentDiagnostic, createComponentError,
  createComponentWarning, freezeComponentValue
} from "../component-diagnostics.js";
import { ComponentPersistenceMapper } from "./component-persistence-mapper.js";

const NAMESPACE = "components";
const COLLECTION = "component.definitions";

export class ComponentPersistenceService implements IComponentPersistenceService {
  private readonly warnings: ComponentRegistryWarning[] = [];
  private readonly errors: ComponentRegistryError[] = [];
  private readonly diagnostics: ComponentRegistryDiagnosticEntry[] = [];
  private readonly persisted = new Set<string>();
  private hydrated = 0;

  constructor(
    private readonly components: IComponentRegistry,
    private readonly persistence: IPersistenceService,
    private readonly mapper = new ComponentPersistenceMapper(),
    private readonly now: () => Date = () => new Date()
  ) {}

  async persistComponent(input: PersistComponentInput): Promise<ComponentPersistenceResult<ComponentPersistenceEntry>> {
    try {
      const entry: ComponentPersistenceEntry = input.metadata
        ? { key: input.component.key, version: input.component.version, definition: input.component, source: "persistence", persistedAt: this.now().toISOString(), metadata: input.metadata }
        : { key: input.component.key, version: input.component.version, definition: input.component, source: "persistence", persistedAt: this.now().toISOString() };
      const data = this.mapper.toData(entry);
      const id = this.mapper.id(input.component);
      const repository = this.repository();
      const key = { namespace: NAMESPACE, collection: COLLECTION, id };
      const exists = await repository.exists(key);
      if (!exists.ok) return this.failure("component.persistence.writeFailed", "Component definition could not be persisted.");
      const result = exists.data ? await repository.update({ ...key, data }) : await repository.create({ ...key, data });
      if (!result.ok) return this.failure("component.persistence.writeFailed", "Component definition could not be persisted.");
      this.persisted.add(id);
      return this.success(entry, "component.persistence.saved", "Component definition persisted.");
    } catch {
      return this.failure("component.persistence.invalidDefinition", "Component definition is not persistable.");
    }
  }

  async persistAllComponents(input: PersistAllComponentsInput = {}): Promise<ComponentPersistenceResult<ComponentPersistenceSummary>> {
    const allowed = input.keys ? new Set(input.keys) : undefined;
    for (const component of this.components.list()) {
      if (allowed && !allowed.has(component.key)) continue;
      const result = await this.persistComponent({ component });
      if (!result.ok) this.warning("component.persistence.skipped", "An invalid component definition was skipped.");
    }
    return this.success(this.summary(), "component.persistence.allSaved", "Registered component persistence completed.");
  }

  async loadComponent(input: LoadComponentInput): Promise<ComponentPersistenceResult<ComponentDefinition | null>> {
    const listed = await this.entries();
    if (!listed) return this.failure("component.persistence.readFailed", "Persisted component definitions could not be loaded.");
    const entry = listed.find((item) => item.key === input.key && (!input.version || item.version === input.version));
    return this.success(entry?.definition ?? null, "component.persistence.loaded", "Component definition load completed.");
  }

  async listComponents(input: ListPersistedComponentsInput = {}): Promise<ComponentPersistenceResult<readonly ComponentDefinition[]>> {
    const entries = await this.entries(input);
    if (!entries) return this.failure("component.persistence.listFailed", "Persisted component definitions could not be listed.");
    return this.success(entries.map((entry) => entry.definition), "component.persistence.listed", "Persisted component definitions listed.");
  }

  async hydrateRegistry(input: HydrateComponentRegistryInput = {}): Promise<ComponentPersistenceResult<ComponentHydrationResult>> {
    const warningStart = this.warnings.length;
    let componentsHydrated = 0;
    let conflicts = 0;
    let invalidEntries = 0;
    const allowed = input.keys ? new Set(input.keys) : undefined;
    const result = await this.repository().list({ namespace: NAMESPACE, collection: COLLECTION, limit: 1000, offset: 0 });
    if (!result.ok) return this.failure("component.persistence.hydrationFailed", "Persisted component definitions could not be loaded.");
    for (const record of result.data?.items ?? []) {
      const entry = this.mapper.fromData(record.data);
      if (!entry) { invalidEntries++; this.warning("component.persistence.invalidEntry", "An invalid persisted component definition was ignored."); continue; }
      if (allowed && !allowed.has(entry.key)) continue;
      this.persisted.add(record.id);
      if (this.components.resolve(entry.key, entry.version).found) { conflicts++; this.warning("component.persistence.conflict", "Existing Component Registry definition was preserved."); continue; }
      try { this.components.register(entry.definition); componentsHydrated++; this.hydrated++; }
      catch { invalidEntries++; this.warning("component.persistence.invalidEntry", "An invalid persisted component definition was ignored."); }
    }
    return this.success({ componentsHydrated, conflicts, invalidEntries }, "component.persistence.hydrated", "Component Registry hydration completed.", this.warnings.slice(warningStart));
  }

  snapshot(): ComponentPersistenceSnapshot {
    const provider = this.persistence.snapshot().provider;
    return freezeComponentValue({ status: this.errors.length ? "error" : this.warnings.length ? "warning" : "ready", generatedAt: this.now().toISOString(), provider: { id: provider.id, kind: provider.kind }, componentsPersisted: this.persisted.size, componentsHydrated: this.hydrated, warnings: [...this.warnings], errors: [...this.errors], diagnostics: [...this.diagnostics] });
  }

  private repository() { return this.persistence.repository<PersistenceRecordData>({ namespace: NAMESPACE, collection: COLLECTION }); }
  private async entries(input: ListPersistedComponentsInput = {}): Promise<ComponentPersistenceEntry[] | undefined> { const result = await this.repository().list({ namespace: NAMESPACE, collection: COLLECTION, limit: input.limit ?? 1000, offset: input.offset ?? 0 }); if (!result.ok) return undefined; const entries: ComponentPersistenceEntry[] = []; for (const record of result.data?.items ?? []) { const entry = this.mapper.fromData(record.data); if (entry) { entries.push(entry); this.persisted.add(record.id); } } return entries; }
  private summary(): ComponentPersistenceSummary { const snapshot = this.snapshot(); return { status: snapshot.status, providerId: snapshot.provider.id, providerKind: snapshot.provider.kind, componentsPersisted: snapshot.componentsPersisted, componentsHydrated: snapshot.componentsHydrated, warnings: snapshot.warnings.length, errors: snapshot.errors.length, diagnostics: snapshot.diagnostics.length }; }
  private success<T>(data: T, code: string, message: string, warnings: readonly ComponentRegistryWarning[] = []): ComponentPersistenceResult<T> { const diagnostic = createComponentDiagnostic({ code, message, severity: "info", timestamp: this.now().toISOString() }); this.diagnostics.push(diagnostic); return freezeComponentValue({ ok: true, data: cloneAndFreezeComponentValue(data), warnings: [...warnings], errors: [], diagnostics: [diagnostic] }); }
  private failure<T>(code: string, message: string): ComponentPersistenceResult<T> { const error = createComponentError(code, message, undefined, this.now().toISOString()); const diagnostic = { ...error, severity: "error" as const }; this.errors.push(error); this.diagnostics.push(diagnostic); return freezeComponentValue({ ok: false, warnings: [], errors: [error], diagnostics: [diagnostic] }); }
  private warning(code: string, message: string): void { const warning = createComponentWarning(code, message, undefined, this.now().toISOString()); this.warnings.push(warning); this.diagnostics.push({ ...warning, severity: "warning" }); }
}
