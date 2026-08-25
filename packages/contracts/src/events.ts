import type { ExecutionContextSnapshot, IExecutionContext } from "./context.js";

export type EventType = "kernel" | "module" | "metadata" | "runtime" | "system";

export interface EventMetadata {
  readonly source?: string;
  readonly moduleId?: string;
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly tenantId?: string;
  readonly workspaceId?: string;
  readonly tags?: readonly string[];
}

export interface EventEnvelope<TPayload = unknown> {
  readonly eventId: string;
  readonly eventName: string;
  readonly eventType: EventType;
  readonly payload: TPayload;
  readonly metadata?: EventMetadata;
  readonly contextSnapshot?: ExecutionContextSnapshot;
  readonly occurredAt: Date;
}

export interface LegacyEventEnvelope<TPayload = unknown> {
  readonly name: string;
  readonly version?: string;
  readonly payload: TPayload;
  readonly context?: IExecutionContext;
  readonly occurredAt: Date;
}

export interface EventPublishInput<TPayload = unknown> {
  readonly eventId?: string;
  readonly eventName: string;
  readonly eventType: EventType;
  readonly payload: TPayload;
  readonly metadata?: EventMetadata;
  readonly contextSnapshot?: ExecutionContextSnapshot;
  readonly occurredAt?: Date;
}

export interface EventDispatchError {
  readonly subscriptionId: string;
  readonly eventName: string;
  readonly message: string;
  readonly code: string;
  readonly stack?: string;
}

export interface EventDispatchResult {
  readonly eventId: string;
  readonly eventName: string;
  readonly handlersMatched: number;
  readonly handlersExecuted: number;
  readonly handlersSucceeded: number;
  readonly handlersFailed: number;
  readonly errors: readonly EventDispatchError[];
  readonly warnings: readonly string[];
  readonly dispatchedAt: Date;
}

export type EventHandlerResult<TResult = unknown> = TResult | void;

export type EventHandler<TPayload = unknown, TResult = unknown> = (
  event: EventEnvelope<TPayload>
) => EventHandlerResult<TResult> | Promise<EventHandlerResult<TResult>>;

export interface EventRegistration {
  readonly name: string;
  readonly version: string;
  readonly owner: string;
  readonly public?: boolean;
}

export interface EventSubscription<TPayload = unknown> {
  readonly subscriptionId: string;
  readonly eventName: string;
  readonly handler: EventHandler<TPayload>;
  readonly createdAt: Date;
}

export interface EventSubscriptionInput<TPayload = unknown> {
  readonly subscriptionId?: string;
  readonly eventName: string;
  readonly handler: EventHandler<TPayload>;
}

export interface IEventDispatcher {
  dispatch<TPayload>(
    event: EventEnvelope<TPayload>,
    subscriptions: readonly EventSubscription<TPayload>[]
  ): Promise<EventDispatchResult>;
}

export interface IEventPublisher {
  publish<TPayload>(event: EventPublishInput<TPayload>): Promise<EventDispatchResult>;
}

export interface IEventBus extends IEventPublisher {
  register(event: EventRegistration): Promise<void>;
  publish<TPayload>(event: EventPublishInput<TPayload> | EventEnvelope<TPayload> | LegacyEventEnvelope<TPayload>): Promise<EventDispatchResult>;
  subscribe<TPayload>(eventName: string, handler: EventHandler<TPayload>): Promise<EventSubscription<TPayload>>;
  unsubscribe(subscriptionId: string): Promise<boolean>;
  listSubscriptions(eventName?: string): Promise<readonly EventSubscription[]>;
  listEvents(): Promise<readonly EventRegistration[]>;
}
