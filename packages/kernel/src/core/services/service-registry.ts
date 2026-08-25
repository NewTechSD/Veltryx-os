import type {
  IExecutionContext,
  IServiceRegistry,
  ServiceDescriptorInput,
  ServiceProvider,
  ServiceRegistrationOptions,
  ServiceRegistryDiagnosticEntry,
  ServiceRegistryError,
  ServiceRegistrySnapshot,
  ServiceRegistryWarning,
  ServiceToken
} from "@veltryx/contracts";
import { createServiceDescriptor, freezeDescriptor } from "./service-descriptor.js";
import { createRegistrySummaryDiagnostics } from "./service-registry-diagnostics.js";
import type { InternalServiceRegistration } from "./service-registration.js";
import { createServiceRegistrySnapshot } from "./service-registry-snapshot.js";
import { ServiceRegistryValidator } from "./service-registry-validator.js";
import { freezeServiceToken, serviceTokenId } from "./service-token.js";

export interface KernelServiceRegistryOptions {
  readonly now?: () => Date;
  readonly validator?: ServiceRegistryValidator;
}

export class KernelServiceRegistry implements IServiceRegistry {
  private readonly registrations = new Map<string, InternalServiceRegistration>();
  private readonly singletons = new Map<string, unknown>();
  private readonly warnings: ServiceRegistryWarning[] = [];
  private readonly errors: ServiceRegistryError[] = [];
  private readonly operationDiagnostics: ServiceRegistryDiagnosticEntry[] = [];
  private replacements = 0;
  private lastRegistration: string | undefined;
  private lastReplacement: string | undefined;
  private readonly now: () => Date;
  private readonly validator: ServiceRegistryValidator;

  constructor(options: KernelServiceRegistryOptions = {}) {
    this.now = options.now ?? (() => new Date());
    this.validator = options.validator ?? new ServiceRegistryValidator();
  }

  async register<TService>(provider: ServiceProvider<TService>): Promise<void>;
  async register<TService>(
    token: ServiceToken | string,
    service: TService,
    descriptor: ServiceDescriptorInput,
    options?: ServiceRegistrationOptions
  ): Promise<void>;
  async register<TService>(
    providerOrToken: ServiceProvider<TService> | ServiceToken | string,
    service?: TService,
    descriptor?: ServiceDescriptorInput,
    options: ServiceRegistrationOptions = {}
  ): Promise<void> {
    if (isProvider(providerOrToken)) {
      const token = this.validator.validateProvider(providerOrToken as ServiceProvider);
      this.addRegistration(
        token,
        undefined,
        providerOrToken as ServiceProvider,
        {
          name: token.id,
          description: token.description,
          category: token.owner === "kernel" ? "kernel" : "system",
          lifecycle: "registered",
          scope: token.scope,
          source: token.owner,
          version: token.version,
          tags: []
        },
        options
      );
      return;
    }

    this.validator.validateService(service);
    if (!descriptor)
      throw this.registrationError(
        "SERVICE_DESCRIPTOR_INVALID",
        "Service descriptor must be defined.",
        typeof providerOrToken === "string" ? providerOrToken : providerOrToken.id
      );
    this.validator.validateDescriptor(descriptor);
    const token =
      typeof providerOrToken === "string"
        ? freezeServiceToken({
            id: providerOrToken,
            version: descriptor.version ?? "1.0.0",
            owner: descriptor.source ?? "kernel",
            scope: descriptor.scope,
            description: descriptor.description
          })
        : this.validator.validateToken(providerOrToken);
    this.addRegistration(token, service, undefined, descriptor, options);
  }

  async resolve<TService>(token: ServiceToken, context?: IExecutionContext): Promise<TService> {
    const registration = this.registrations.get(serviceTokenId(token));
    if (!registration) throw new Error(`Service not registered: ${token.id}`);
    if (registration.service !== undefined) return registration.service as TService;
    if (!registration.provider) throw new Error(`Service unavailable: ${token.id}`);
    if ((token.scope === "global" || token.scope === "singleton") && this.singletons.has(token.id))
      return this.singletons.get(token.id) as TService;
    const resolved = await registration.provider.resolve(context);
    if (token.scope === "global" || token.scope === "singleton")
      this.singletons.set(token.id, resolved);
    return resolved as TService;
  }

  get<TService>(token: ServiceToken | string): TService | undefined {
    return this.registrations.get(serviceTokenId(token))?.service as TService | undefined;
  }

  has(token: ServiceToken | string): boolean {
    return this.registrations.has(serviceTokenId(token));
  }
  list(): readonly ServiceToken[] {
    return Object.freeze([...this.registrations.values()].map((entry) => entry.token));
  }

  remove(token: ServiceToken | string): boolean {
    const id = serviceTokenId(token);
    const removed = this.registrations.delete(id);
    this.singletons.delete(id);
    if (removed)
      this.operationDiagnostics.push(
        Object.freeze({
          code: "SERVICE_REMOVED",
          message: "Service removed from registry.",
          severity: "info",
          token: id,
          source: "service-registry"
        })
      );
    return removed;
  }

  snapshot(): ServiceRegistrySnapshot {
    const services = [...this.registrations.values()].map((entry) =>
      freezeDescriptor(entry.descriptor)
    );
    return createServiceRegistrySnapshot({
      generatedAt: this.now(),
      services,
      warnings: this.warnings,
      errors: this.errors,
      diagnostics: [
        ...this.operationDiagnostics,
        ...createRegistrySummaryDiagnostics(
          services,
          this.replacements,
          this.lastRegistration,
          this.lastReplacement
        )
      ]
    });
  }

  private addRegistration(
    token: ServiceToken,
    service: unknown,
    provider: ServiceProvider | undefined,
    descriptor: ServiceDescriptorInput,
    options: ServiceRegistrationOptions
  ): void {
    const existing = this.registrations.has(token.id);
    if (existing && options.replace !== true)
      throw this.registrationError(
        "SERVICE_DUPLICATE",
        `Service already registered: ${token.id}`,
        token.id
      );
    const timestamp = this.now();
    const publicDescriptor = createServiceDescriptor(
      token,
      descriptor,
      timestamp,
      service !== undefined,
      existing
    );
    this.registrations.set(
      token.id,
      Object.freeze({ token, service, provider, descriptor: publicDescriptor })
    );
    this.singletons.delete(token.id);
    this.lastRegistration = timestamp.toISOString();
    if (existing) {
      this.replacements += 1;
      this.lastReplacement = timestamp.toISOString();
      const warning = Object.freeze({
        code: "SERVICE_REPLACED",
        message: "Service was replaced through explicit authorization.",
        token: token.id,
        source: "service-registry"
      });
      this.warnings.push(warning);
      this.operationDiagnostics.push(Object.freeze({ ...warning, severity: "warning" }));
    } else {
      this.operationDiagnostics.push(
        Object.freeze({
          code: "SERVICE_REGISTERED",
          message: "Service registered.",
          severity: "info",
          token: token.id,
          source: "service-registry"
        })
      );
    }
  }

  private registrationError(code: string, message: string, token?: string): Error {
    this.errors.push(Object.freeze({ code, message, token, source: "service-registry" }));
    return new Error(message);
  }
}

function isProvider(value: unknown): value is ServiceProvider {
  return typeof value === "object" && value !== null && "token" in value && "resolve" in value;
}
