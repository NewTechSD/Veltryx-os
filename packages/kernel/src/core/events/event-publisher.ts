import type { EventDispatchResult, EventPublishInput, IEventBus, IEventPublisher } from "@veltryx/contracts";

export class KernelEventPublisher implements IEventPublisher {
  constructor(private readonly eventBus: IEventBus) {}

  async publish<TPayload>(event: EventPublishInput<TPayload>): Promise<EventDispatchResult> {
    return this.eventBus.publish(event);
  }
}
