import type {
  IMetadataResolver,
  MetadataEntity,
  MetadataError,
  MetadataMenu,
  MetadataPage,
  MetadataResolutionResult,
  MetadataResource,
  MetadataResourceType
} from "@veltryx/contracts";
import { cloneAndFreezeMetadataValue, createMetadataError } from "./metadata-diagnostics.js";

export interface MetadataResolverStore {
  readonly resources: ReadonlyMap<string, MetadataResource>;
}

export class MetadataResolver implements IMetadataResolver {
  constructor(private readonly store: MetadataResolverStore) {}

  resolve<TResource = MetadataResource>(namespace: string, id: string): MetadataResolutionResult<TResource> {
    const resource = this.store.resources.get(this.key(namespace, id));
    if (!resource) return this.missing(namespace, id) as MetadataResolutionResult<TResource>;
    return Object.freeze({ found: true, namespace, id, type: resource.type, resource: cloneAndFreezeMetadataValue(resource) as TResource }) as MetadataResolutionResult<TResource>;
  }

  resolveEntity(namespace: string, id: string): MetadataResolutionResult<MetadataResource<MetadataEntity>> {
    return this.resolveTyped(namespace, id, "entity") as MetadataResolutionResult<MetadataResource<MetadataEntity>>;
  }

  resolvePage(namespace: string, id: string): MetadataResolutionResult<MetadataResource<MetadataPage>> {
    return this.resolveTyped(namespace, id, "page") as MetadataResolutionResult<MetadataResource<MetadataPage>>;
  }

  resolveMenu(namespace: string, id: string): MetadataResolutionResult<MetadataResource<MetadataMenu>> {
    return this.resolveTyped(namespace, id, "menu") as MetadataResolutionResult<MetadataResource<MetadataMenu>>;
  }

  resolveByType(type: MetadataResourceType, namespace?: string): readonly MetadataResource[] {
    const resources = [...this.store.resources.values()].filter(
      (resource) => resource.type === type && (!namespace || resource.namespace === namespace)
    );
    return Object.freeze(resources.map((resource) => cloneAndFreezeMetadataValue(resource)));
  }

  private resolveTyped(namespace: string, id: string, type: MetadataResourceType): MetadataResolutionResult<MetadataResource> {
    const result = this.resolve<MetadataResource>(namespace, id);
    if (!result.found || !result.resource) return result;
    if (result.resource.type !== type) {
      const error = createMetadataError("metadata.resolutionFailed", "Metadata resource type does not match the requested resolver.", "metadata", { namespace, id, expectedType: type, actualType: result.resource.type });
      return Object.freeze({ found: false, namespace, id, type, error });
    }
    return result;
  }

  private missing(namespace: string, id: string): MetadataResolutionResult<MetadataResource> {
    const error: MetadataError = createMetadataError("metadata.resolutionFailed", "Metadata resource was not found.", "metadata", { namespace, id });
    return Object.freeze({ found: false, namespace, id, error });
  }

  private key(namespace: string, id: string): string {
    return `${namespace}:${id}`;
  }
}

