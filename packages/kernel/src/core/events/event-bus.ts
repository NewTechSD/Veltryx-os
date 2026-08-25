import type {
  EventDispatchResult,
  EventEnvelope,
  EventHandler,
  EventPublishInput,
  EventRegistration,
  EventSubscription,
  IEventBus,
  IEventDispatcher,
  LegacyEventEnvelope
} from "@veltryx/contracts";

import { createEventEnvelope, type EventEnvelopeFactoryOptions } from "./event-envelope.js";
import { KernelEventDispatcher } from "./event-dispatcher.js";
import { assertEventName, KernelEventSubscription } from "./event-subscription.js";

export interface InMemoryEventBusOptions extends EventEnvelopeFactoryOptions {
  readonly dispatcher?: IEventDispatcher;
}

export class InMemoryEventBus implements IEventBus {
  private readonly subscriptions = new Map<string, EventSubscription[]>();
  private readonly registrations = new Map<string, EventRegistration>();
  private readonly events: EventEnvelope[] = [];
  private readonly dispatcher: IEventDispatcher;

  constructor(private readonly options: InMemoryEventBusOptions = {}) {
    this.dispatcher = options.dispatcher ?? new KernelEventDispatcher(options.now);
  }

  async register(event: EventRegistration): Promise<void> {
    assertEventName(event.name);
    this.assertNonEmptyString(event.version, "Event registration version");
    this.assertNonEmptyString(event.owner, "Event registration owner");

    const key = this.registrationKey(event.name, event.version);

    if (this.registrations.has(key)) {
      throw new Error(`Event already registered: ${key}`);
    }

    this.registrations.set(key, event);
  }

  async publish<TPayload>(
    event: EventPublishInput<TPayload> | EventEnvelope<TPayload> | LegacyEventEnvelope<TPayload>
  ): Promise<EventDispatchResult> {
    const envelope = createEventEnvelope(event, this.options);
    this.events.push(envelope);

    const subscriptions = this.subscriptions.get(envelope.eventName) ?? [];

    return this.dispatcher.dispatch(envelope, subscriptions as EventSubscription<TPayload>[]);
  }

  async subscribe<TPayload>(
    eventName: string,
    handler: EventHandler<TPayload>
  ): Promise<EventSubscription<TPayload>> {
    const subscription = new KernelEventSubscription({ eventName, handler });
    const subscriptions = this.subscriptions.get(eventName) ?? [];

    subscriptions.push(subscription as EventSubscription);
    this.subscriptions.set(eventName, subscriptions);

    return subscription;
  }

  async unsubscribe(subscriptionId: string): Promise<boolean> {
    this.assertNonEmptyString(subscriptionId, "Event subscription id");

    for (const [eventName, subscriptions] of this.subscriptions.entries()) {
      const next = subscriptions.filter((subscription) => subscription.subscriptionId !== subscriptionId);

      if (next.length !== subscriptions.length) {
        if (next.length === 0) {
          this.subscriptions.delete(eventName);
        } else {
          this.subscriptions.set(eventName, next);
        }

        return true;
      }
    }

    return false;
  }

  async listSubscriptions(eventName?: string): Promise<readonly EventSubscription[]> {
    if (eventName !== undefined) {
      assertEventName(eventName);
      return [...(this.subscriptions.get(eventName) ?? [])];
    }

    return [...this.subscriptions.values()].flat();
  }

  async listEvents(): Promise<readonly EventRegistration[]> {
    return [...this.registrations.values()];
  }

  publishedEvents(): readonly EventEnvelope[] {
    return [...this.events];
  }

  private registrationKey(name: string, version: string): string {
    return `${name}:${version}`;
  }

  private assertNonEmptyString(value: unknown, field: string): asserts value is string {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`${field} must be a non-empty string`);
    }
  }
}
