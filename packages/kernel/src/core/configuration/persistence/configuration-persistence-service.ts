import type {
  ConfigurationDiagnosticEntry, ConfigurationError, ConfigurationHydrationResult,
  ConfigurationKey, ConfigurationPersistenceEntry, ConfigurationPersistenceResult,
  ConfigurationPersistenceSnapshot, ConfigurationPersistenceSummary, ConfigurationValues,
  ConfigurationWarning, HydrateConfigurationInput, IConfigurationPersistenceService,
  IConfigurationProvider, IPersistenceService, ListConfigurationKeysInput,
  LoadConfigurationKeyInput, PersistConfigurationInput, PersistConfigurationKeyInput,
  PersistenceRecordData
} from "@veltryx/contracts";
import { ConfigurationPersistenceMapper } from "./configuration-persistence-mapper.js";
import { CONFIGURATION_PERSISTENCE_ALLOWED_KEYS, ConfigurationPersistenceValidator } from "./configuration-persistence-validator.js";
import { ConfigurationValidator } from "../configuration-validator.js";

const NAMESPACE = "configuration";
const COLLECTION = "configuration.entries";

export class ConfigurationPersistenceService implements IConfigurationPersistenceService {
  private readonly warnings: ConfigurationWarning[] = [];
  private readonly errors: ConfigurationError[] = [];
  private readonly diagnostics: ConfigurationDiagnosticEntry[] = [];
  private readonly persistedKeys = new Set<string>();
  private hydratedKeys = 0;
  private blockedKeys = 0;

  constructor(
    private readonly configuration: IConfigurationProvider,
    private readonly persistence: IPersistenceService,
    private readonly mapper = new ConfigurationPersistenceMapper(),
    private readonly validator = new ConfigurationPersistenceValidator(),
    private readonly configurationValidator = new ConfigurationValidator(),
    private readonly now: () => Date = () => new Date()
  ) {}

  async persistConfiguration(input: PersistConfigurationInput = {}): Promise<ConfigurationPersistenceResult<ConfigurationPersistenceSummary>> {
    const keys = input.keys ?? CONFIGURATION_PERSISTENCE_ALLOWED_KEYS as readonly ConfigurationKey[];
    for (const key of keys) {
      if (!this.validator.isAllowedKey(key)) { this.blockedKeys++; this.warning("CONFIGURATION_PERSISTENCE_KEY_SKIPPED", "A configuration key was not eligible for persistence.", key); continue; }
      const value = this.configuration.get(key);
      if (this.validator.isSerializable(value)) await this.persistKey({ key, value });
    }
    return this.success(this.summary(), "CONFIGURATION_PERSISTENCE_COMPLETED", "Public configuration persistence completed.");
  }

  async persistKey(input: PersistConfigurationKeyInput): Promise<ConfigurationPersistenceResult<ConfigurationPersistenceEntry>> {
    if (this.validator.isBlockedKey(input.key)) { this.blockedKeys++; return this.failure("CONFIGURATION_PERSISTENCE_BLOCKED_KEY", "Sensitive configuration keys cannot be persisted.", input.key); }
    if (!this.validator.isAllowedKey(input.key)) return this.failure("CONFIGURATION_PERSISTENCE_KEY_NOT_ALLOWED", "Configuration key is not allowlisted.", input.key);
    if (!this.validator.isSerializable(input.value)) return this.failure("CONFIGURATION_PERSISTENCE_INVALID_VALUE", "Configuration value is not serializable.", input.key);
    if (!this.configurationValidator.validateValue(input.key as ConfigurationKey, input.value).valid) return this.failure("CONFIGURATION_PERSISTENCE_INVALID_VALUE", "Configuration value is invalid for its public key.", input.key);
    const entry: ConfigurationPersistenceEntry = input.metadata
      ? { key: input.key, value: input.value, source: "persistence", persistedAt: this.now().toISOString(), metadata: input.metadata }
      : { key: input.key, value: input.value, source: "persistence", persistedAt: this.now().toISOString() };
    try {
      const data = this.mapper.toData(entry);
      const repository = this.repository();
      const key = { namespace: NAMESPACE, collection: COLLECTION, id: input.key };
      const exists = await repository.exists(key);
      const result = exists.ok && exists.data
        ? await repository.update({ ...key, data })
        : await repository.create({ ...key, data });
      if (!result.ok) return this.failure("CONFIGURATION_PERSISTENCE_WRITE_FAILED", "Configuration entry could not be persisted.", input.key);
      this.persistedKeys.add(input.key);
      return this.success(entry, "CONFIGURATION_PERSISTENCE_KEY_SAVED", "Public configuration key persisted.");
    } catch {
      return this.failure("CONFIGURATION_PERSISTENCE_WRITE_FAILED", "Configuration entry could not be persisted.", input.key);
    }
  }

  async loadKey(input: LoadConfigurationKeyInput): Promise<ConfigurationPersistenceResult<ConfigurationPersistenceEntry | null>> {
    if (!this.validator.isAllowedKey(input.key)) return this.failure("CONFIGURATION_PERSISTENCE_KEY_NOT_ALLOWED", "Configuration key is not allowlisted.", input.key);
    const result = await this.repository().get({ namespace: NAMESPACE, collection: COLLECTION, id: input.key });
    if (!result.ok) return this.failure("CONFIGURATION_PERSISTENCE_READ_FAILED", "Configuration entry could not be loaded.", input.key);
    const entry = result.data ? this.mapper.fromData(result.data.data) : null;
    if (result.data && !entry) return this.failure("CONFIGURATION_PERSISTENCE_INVALID_ENTRY", "Persisted configuration entry is invalid.", input.key);
    return this.success(entry ?? null, "CONFIGURATION_PERSISTENCE_KEY_LOADED", "Configuration key load completed.");
  }

  async listKeys(input: ListConfigurationKeysInput = {}): Promise<ConfigurationPersistenceResult<readonly ConfigurationPersistenceEntry[]>> {
    const result = await this.repository().list({ namespace: NAMESPACE, collection: COLLECTION, limit: input.limit ?? 1000, offset: input.offset ?? 0 });
    if (!result.ok) return this.failure("CONFIGURATION_PERSISTENCE_LIST_FAILED", "Persisted configuration entries could not be listed.");
    const entries = (result.data?.items ?? []).flatMap((record) => {
      const entry = this.mapper.fromData(record.data);
      if (!entry) return [];
      this.persistedKeys.add(entry.key);
      return [entry];
    });
    return this.success(entries, "CONFIGURATION_PERSISTENCE_KEYS_LISTED", "Persisted configuration keys listed.");
  }

  async hydrateConfiguration(input: HydrateConfigurationInput = {}): Promise<ConfigurationPersistenceResult<ConfigurationHydrationResult>> {
    const warningStart = this.warnings.length;
    let conflicts = 0;
    let invalidEntries = 0;
    let blockedEntries = 0;
    const values: Record<string, unknown> = {};
    const result = await this.repository().list({ namespace: NAMESPACE, collection: COLLECTION, limit: 1000, offset: 0 });
    if (!result.ok) return this.failure("CONFIGURATION_PERSISTENCE_HYDRATION_FAILED", "Persisted configuration could not be loaded.");
    const strongerKeys = new Set(this.configuration.snapshot().sources
      .filter((source) => source.type === "environment" || source.type === "in-memory")
      .flatMap((source) => [...source.loadedKeys]));
    for (const record of result.data?.items ?? []) {
      const rawKey = typeof record.data.entry === "object" && record.data.entry ? (record.data.entry as Record<string, unknown>).key : undefined;
      if (this.validator.isBlockedKey(rawKey)) { blockedEntries++; this.blockedKeys++; this.warning("CONFIGURATION_PERSISTENCE_BLOCKED_ENTRY", "A blocked persisted configuration entry was ignored."); continue; }
      const entry = this.mapper.fromData(record.data);
      if (!entry) { invalidEntries++; this.warning("CONFIGURATION_PERSISTENCE_INVALID_ENTRY", "An invalid persisted configuration entry was ignored."); continue; }
      this.persistedKeys.add(entry.key);
      if (!input.allowOverride && strongerKeys.has(entry.key as ConfigurationKey)) { conflicts++; this.warning("CONFIGURATION_PERSISTENCE_CONFLICT", "Current configuration precedence was preserved.", entry.key); continue; }
      values[entry.key] = entry.value;
    }
    if (!this.configuration.applyPersistenceOverrides) return this.failure("CONFIGURATION_PERSISTENCE_TARGET_UNAVAILABLE", "Configuration Provider does not support public persistence overrides.");
    const applied = this.configuration.applyPersistenceOverrides(values as ConfigurationValues, { allowOverride: input.allowOverride });
    if (!applied.valid) return this.failure("CONFIGURATION_PERSISTENCE_HYDRATION_FAILED", "Persisted configuration values were rejected.");
    const keysHydrated = Object.keys(values).length;
    this.hydratedKeys += keysHydrated;
    return this.success({ keysHydrated, conflicts, invalidEntries, blockedEntries }, "CONFIGURATION_PERSISTENCE_HYDRATED", "Configuration hydration completed.", this.warnings.slice(warningStart));
  }

  snapshot(): ConfigurationPersistenceSnapshot {
    const provider = this.persistence.snapshot().provider;
    return freeze({ status: this.errors.length ? "error" : this.warnings.length ? "warning" : "ready", generatedAt: this.now().toISOString(), provider: { id: provider.id, kind: provider.kind }, keysPersisted: this.persistedKeys.size, keysHydrated: this.hydratedKeys, allowedKeys: [...CONFIGURATION_PERSISTENCE_ALLOWED_KEYS], blockedKeysCount: this.blockedKeys, warnings: [...this.warnings], errors: [...this.errors], diagnostics: [...this.diagnostics] });
  }

  private repository() { return this.persistence.repository<PersistenceRecordData>({ namespace: NAMESPACE, collection: COLLECTION }); }
  private summary(): ConfigurationPersistenceSummary { const snapshot = this.snapshot(); return { status: snapshot.status, providerId: snapshot.provider.id, providerKind: snapshot.provider.kind, keysPersisted: snapshot.keysPersisted, keysHydrated: snapshot.keysHydrated, warnings: snapshot.warnings.length, errors: snapshot.errors.length, diagnostics: snapshot.diagnostics.length }; }
  private success<T>(data: T, code: string, message: string, warnings: readonly ConfigurationWarning[] = []): ConfigurationPersistenceResult<T> { const diagnostic = this.diagnostic(code, message, "info"); this.diagnostics.push(diagnostic); return freeze({ ok: true, data: clone(data), warnings: [...warnings], errors: [], diagnostics: [diagnostic] }); }
  private failure<T>(code: string, message: string, key?: string): ConfigurationPersistenceResult<T> { const error = freeze({ code, message, source: "configuration-persistence", key }); const diagnostic = this.diagnostic(code, message, "error", key); this.errors.push(error); this.diagnostics.push(diagnostic); return freeze({ ok: false, warnings: [], errors: [error], diagnostics: [diagnostic] }); }
  private warning(code: string, message: string, key?: string): void { const warning = freeze({ code, message, source: "configuration-persistence", key }); this.warnings.push(warning); this.diagnostics.push(this.diagnostic(code, message, "warning", key)); }
  private diagnostic(code: string, message: string, severity: ConfigurationDiagnosticEntry["severity"], key?: string): ConfigurationDiagnosticEntry { return freeze({ code, message, severity, source: "configuration-persistence", key }); }
}

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
function freeze<T>(value: T): T { if (value && typeof value === "object") { for (const nested of Object.values(value)) freeze(nested); Object.freeze(value); } return value; }
