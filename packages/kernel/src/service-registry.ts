import type {
  IExecutionContext,
  IServiceRegistry,
  ServiceProvider,
  ServiceToken
} from "@veltryx/contracts";

export class KernelServiceRegistry implements IServiceRegistry {
  private readonly providers = new Map<string, ServiceProvider>();
  private readonly singletons = new Map<string, unknown>();

  async register<TService>(provider: ServiceProvider<TService>): Promise<void> {
    if (this.providers.has(provider.token.id)) {
      throw new Error(`Service already registered: ${provider.token.id}`);
    }

    this.providers.set(provider.token.id, provider as ServiceProvider);
  }

  async resolve<TService>(
    token: ServiceToken,
    context?: IExecutionContext
  ): Promise<TService> {
    const provider = this.providers.get(token.id);

    if (!provider) {
      throw new Error(`Service not registered: ${token.id}`);
    }

    if (token.scope === "global" && this.singletons.has(token.id)) {
      return this.singletons.get(token.id) as TService;
    }

    const service = await provider.resolve(context);

    if (token.scope === "global") {
      this.singletons.set(token.id, service);
    }

    return service as TService;
  }

  has(tokenId: string): boolean {
    return this.providers.has(tokenId);
  }

  list(): readonly ServiceToken[] {
    return [...this.providers.values()].map((provider) => provider.token);
  }
}

