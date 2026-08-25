import type { IMetadataRegistry, MetadataQuery, MetadataRecord } from "@veltryx/contracts";

export class InMemoryMetadataRegistry implements IMetadataRegistry {
  private readonly records = new Map<string, MetadataRecord>();

  async register<TMetadata>(record: MetadataRecord<TMetadata>): Promise<void> {
    const registryKey = this.registryKey(record.namespace, record.key, record.version);

    if (this.records.has(registryKey)) {
      throw new Error(`Metadata already registered: ${registryKey}`);
    }

    this.records.set(registryKey, record as MetadataRecord);
  }

  async get<TMetadata>(query: MetadataQuery): Promise<MetadataRecord<TMetadata> | undefined> {
    if (query.version) {
      return this.records.get(this.registryKey(query.namespace, query.key, query.version)) as
        MetadataRecord<TMetadata> | undefined;
    }

    return [...this.records.values()].find(
      (record) => record.namespace === query.namespace && record.key === query.key
    ) as MetadataRecord<TMetadata> | undefined;
  }

  async list(namespace: string): Promise<readonly MetadataRecord[]> {
    return [...this.records.values()].filter((record) => record.namespace === namespace);
  }

  async listVersions(namespace: string, key: string): Promise<readonly string[]> {
    return [...this.records.values()]
      .filter((record) => record.namespace === namespace && record.key === key)
      .map((record) => record.version);
  }

  private registryKey(namespace: string, key: string, version: string): string {
    return `${namespace}:${key}:${version}`;
  }
}
