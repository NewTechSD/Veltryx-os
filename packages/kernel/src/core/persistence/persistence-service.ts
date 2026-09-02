import type { IPersistenceProvider, IPersistenceService, IRepository, PersistenceRecordData, PersistenceSnapshot, RepositoryInput } from "@veltryx/contracts";

export class PersistenceService implements IPersistenceService {
  constructor(private readonly persistenceProvider: IPersistenceProvider) {}
  provider(): IPersistenceProvider { return this.persistenceProvider; }
  repository<TData extends PersistenceRecordData = PersistenceRecordData>(input: RepositoryInput): IRepository<TData> { return this.persistenceProvider.repository<TData>(input); }
  snapshot(): PersistenceSnapshot { return this.persistenceProvider.snapshot(); }
}
