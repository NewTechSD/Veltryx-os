import type {
  EventDispatchError,
  EventDispatchResult,
  EventEnvelope,
  EventSubscription,
  IEventDispatcher
} from "@veltryx/contracts";

export class KernelEventDispatcher implements IEventDispatcher {
  constructor(private readonly now: () => Date = () => new Date()) {}

  async dispatch<TPayload>(
    event: EventEnvelope<TPayload>,
    subscriptions: readonly EventSubscription<TPayload>[]
  ): Promise<EventDispatchResult> {
    const errors: EventDispatchError[] = [];
    let handlersExecuted = 0;
    let handlersSucceeded = 0;
    let handlersFailed = 0;

    for (const subscription of subscriptions) {
      handlersExecuted += 1;

      try {
        await subscription.handler(event);
        handlersSucceeded += 1;
      } catch (error) {
        handlersFailed += 1;
        errors.push(this.normalizeError(event.eventName, subscription.subscriptionId, error));
      }
    }

    return {
      eventId: event.eventId,
      eventName: event.eventName,
      handlersMatched: subscriptions.length,
      handlersExecuted,
      handlersSucceeded,
      handlersFailed,
      errors,
      warnings: subscriptions.length === 0 ? ["No event handlers matched this event."] : [],
      dispatchedAt: this.now()
    };
  }

  private normalizeError(
    eventName: string,
    subscriptionId: string,
    error: unknown
  ): EventDispatchError {
    if (error instanceof Error) {
      return {
        subscriptionId,
        eventName,
        message: error.message,
        code: "EVENT_HANDLER_FAILED",
        stack: error.stack
      };
    }

    return {
      subscriptionId,
      eventName,
      message: "Unknown event handler failure",
      code: "EVENT_HANDLER_FAILED"
    };
  }
}
