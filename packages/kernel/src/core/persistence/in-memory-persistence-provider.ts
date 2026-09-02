import type { IPersistenceProvider, IRepository, PersistenceRecordData, PersistenceSnapshot, RepositoryInput } from "@veltryx/contracts";
import { InMemoryRepository, type PersistenceStore } from "./in-memory-repository.js";
import { validateRepositoryInput } from "./persistence-validator.js";

export interface InMemoryPersistenceProviderOptions { readonly id?: string; readonly name?: string; readonly now?: () => Date }

export class InMemoryPersistenceProvider implements IPersistenceProvider {
  readonly id: string; readonly name: string; readonly kind = "memory" as const;
  private readonly namespaces = new Map<string, PersistenceStore>(); private readonly now: () => Date;
  constructor(options: InMemoryPersistenceProviderOptions = {}) { this.id = options.id ?? "kernel.persistence.memory"; this.name = options.name ?? "In-memory Persistence Provider"; this.now = options.now ?? (() => new Date()); }
  repository<TData extends PersistenceRecordData = PersistenceRecordData>(input: RepositoryInput): IRepository<TData> {
    validateRepositoryInput(input); let namespace = this.namespaces.get(input.namespace); if (!namespace) { namespace = new Map(); this.namespaces.set(input.namespace, namespace); }
    return new InMemoryRepository<TData>(Object.freeze({ ...input }), namespace, this.now);
  }
  snapshot(): PersistenceSnapshot {
    let collections = 0; let records = 0;
    for (const namespace of this.namespaces.values()) { collections += namespace.size; for (const collection of namespace.values()) records += collection.size; }
    return Object.freeze({ status: "ready", generatedAt: this.now().toISOString(), provider: Object.freeze({ id: this.id, name: this.name, kind: this.kind }), namespaces: this.namespaces.size, collections, records, warnings: Object.freeze([]), errors: Object.freeze([]), diagnostics: Object.freeze([]) });
  }
}
