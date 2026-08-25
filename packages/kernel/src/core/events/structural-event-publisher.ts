import type {
  EventDispatchResult,
  IEventBus,
  IStructuralEventPublisher,
  StructuralEventPayload,
  StructuralEventPublishInput
} from "@veltryx/contracts";

export class KernelStructuralEventPublisher implements IStructuralEventPublisher {
  constructor(private readonly eventBus: IEventBus) {}

  async publish<TPayload extends StructuralEventPayload>(
    event: StructuralEventPublishInput<TPayload>
  ): Promise<EventDispatchResult | undefined> {
    try {
      return await this.eventBus.publish({
        eventName: event.eventName,
        eventType: event.eventType,
        payload: event.payload,
        metadata: event.metadata,
        contextSnapshot: event.contextSnapshot,
        occurredAt: event.occurredAt
      });
    } catch {
      return undefined;
    }
  }
}

export function publishStructuralEvent<TPayload extends StructuralEventPayload>(
  publisher: IStructuralEventPublisher | undefined,
  event: StructuralEventPublishInput<TPayload>
): void {
  if (!publisher) {
    return;
  }

  try {
    void publisher.publish(event).catch(() => undefined);
  } catch {
    return;
  }
}

