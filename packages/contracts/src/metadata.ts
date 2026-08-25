import type { IExecutionContext } from "./context.js";

export type MetadataStatus = "draft" | "validated" | "registered" | "published" | "active" | "deprecated" | "archived";

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

export interface IMetadataRegistry {
  register<TMetadata>(record: MetadataRecord<TMetadata>): Promise<void>;
  get<TMetadata>(query: MetadataQuery): Promise<MetadataRecord<TMetadata> | undefined>;
  list(namespace: string): Promise<readonly MetadataRecord[]>;
  listVersions(namespace: string, key: string): Promise<readonly string[]>;
}
